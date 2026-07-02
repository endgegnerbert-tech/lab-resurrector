/**
 * server.js — flabs server
 *
 * Static public labs + private browser sessions + server-side pi SDK agent bridge.
 * User API keys are accepted per agent request and are not persisted by default.
 */

import crypto from 'crypto';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, extname, join, relative, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3210;
const IS_PROD = process.env.NODE_ENV === 'production';

const EXPERIMENTS_DIR = join(__dirname, 'experiments');
const PUBLIC_SPACES_DIR = join(EXPERIMENTS_DIR, 'spaces');
const DATA_DIR = process.env.FLABS_DATA_DIR || process.env.DATA_DIR || join(__dirname, '.data');
const HAS_PERSISTENT_DISK = process.env.FLABS_DATA_PERSISTENT === 'true';
const PRIVATE_SPACES_DIR = join(DATA_DIR, 'spaces');
const STORE_FILE = join(DATA_DIR, 'store.json');
const SESSION_COOKIE = 'flabs_session';
const GUEST_SESSION_TTL_MS = 1000 * 60 * 60 * 24;
const ALLOWED_SPACE_FILES = new Set(['index.html', 'sketch.js', 'experiment.json', 'sources.json']);
const PROVIDER_CATALOG = readJsonFile(join(__dirname, 'sources', 'pi-model-catalog.json'), []);

let piSdkCache = null;

function readJsonFile(path, fallback = null) {
  try { return JSON.parse(fs.readFileSync(path, 'utf-8')); }
  catch (_) { return fallback; }
}

function writeJsonFile(path, data) {
  fs.mkdirSync(dirname(path), { recursive: true });
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

function readStore() {
  const store = readJsonFile(STORE_FILE, { users: [], sessions: [], spaces: [] }) || { users: [], sessions: [], spaces: [] };
  store.users = Array.isArray(store.users) ? store.users : [];
  store.sessions = Array.isArray(store.sessions) ? store.sessions : [];
  store.spaces = Array.isArray(store.spaces) ? store.spaces : [];
  return store;
}

function writeStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = STORE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, STORE_FILE);
}

function sanitizeSpaceId(value) {
  return String(value || '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'new-space';
}

function isValidSpaceId(value) {
  return /^[a-z][a-z0-9-]*$/.test(String(value || ''));
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function serializeSessionCookie(token, maxAgeSeconds) {
  const parts = [
    SESSION_COOKIE + '=' + encodeURIComponent(token || ''),
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ];
  if (Number.isFinite(maxAgeSeconds)) parts.push('Max-Age=' + maxAgeSeconds);
  if (IS_PROD) parts.push('Secure');
  return parts.join('; ');
}

function getCurrentUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const store = readStore();
  const tokenHash = sha256(token);
  const now = Date.now();
  const session = store.sessions.find((s) => s.tokenHash === tokenHash && Date.parse(s.expiresAt) > now);
  if (!session) return null;
  const user = store.users.find((u) => u.id === session.userId);
  return user ? { user, session, store } : null;
}

function requireUser(req, res, next) {
  const auth = getCurrentUser(req);
  if (!auth) return res.status(401).json({ error: 'Private session required' });
  req.flabsAuth = auth;
  next();
}

function readPublicManifest() {
  return readJsonFile(join(EXPERIMENTS_DIR, 'manifest.json'), { spaces: [] }) || { spaces: [] };
}

function resolvePublicSpacePath(spaceId) {
  if (!isValidSpaceId(spaceId)) throw new Error('Invalid space ID');
  const resolved = resolve(PUBLIC_SPACES_DIR, spaceId);
  if (!resolved.startsWith(resolve(PUBLIC_SPACES_DIR) + '/')) throw new Error('Forbidden');
  return resolved;
}

function resolvePrivateSpaceDir(userId, spaceId) {
  if (!/^user_[a-zA-Z0-9_-]+$/.test(String(userId || ''))) throw new Error('Invalid user ID');
  if (!isValidSpaceId(spaceId)) throw new Error('Invalid space ID');
  const base = resolve(PRIVATE_SPACES_DIR, userId);
  const resolved = resolve(base, spaceId);
  if (!resolved.startsWith(base + '/')) throw new Error('Forbidden');
  return resolved;
}

function findPrivateSpace(store, userId, spaceId) {
  return store.spaces.find((s) => s.ownerId === userId && s.id === spaceId) || null;
}

function ensureUniquePrivateSpaceId(store, userId, title) {
  const publicIds = new Set((readPublicManifest().spaces || []).map((s) => s.id));
  let id = sanitizeSpaceId(title);
  let c = 2;
  while (publicIds.has(id) || store.spaces.some((s) => s.ownerId === userId && s.id === id)) {
    id = sanitizeSpaceId(title) + '-' + (c++);
  }
  return id;
}

function privateSpacePath(id) {
  return '/api/me/spaces/' + encodeURIComponent(id) + '/';
}

function publicSpacePath(id) {
  return '/experiments/spaces/' + encodeURIComponent(id) + '/';
}

function defaultExperimentManifest(id, title) {
  return {
    schemaVersion: 1,
    id,
    title,
    domain: 'physics',
    engine: 'canvas-2d',
    level: 'school',
    concepts: ['clean slate'],
    parameters: {},
    measurements: [],
    formulas: [],
    validityLimits: {
      model: 'Clean slate. Ask the builder to create the experiment.',
    },
  };
}

function defaultIndexHtml(title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0d0d14; color: #e2e2ee; font-family: system-ui, sans-serif; overflow: hidden; }
    canvas { display: block; width: 100vw; height: 100vh; }
    .label { position: fixed; left: 14px; top: 12px; color: #9b9bb8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="label">${escapeHtml(title)} · private draft</div>
  <canvas id="lab"></canvas>
  <script src="sketch.js"></script>
</body>
</html>
`;
}

function defaultSketchJs() {
  return `(function () {
  const canvas = document.getElementById('lab');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    draw();
  }

  function draw() {
    const w = canvas.width / devicePixelRatio;
    const h = canvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#070711';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#20203a';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.strokeRect(24, 24, Math.max(0, w - 48), Math.max(0, h - 48));
    ctx.setLineDash([]);
    ctx.fillStyle = '#8b8baa';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Clean lab: ask flabs to build an experiment.', w / 2, h / 2);
    ctx.textAlign = 'start';
  }

  window.addEventListener('resize', resize);
  window.addEventListener('message', (event) => {
    if (window.parent && event.source !== window.parent) return;
    const msg = event.data || {};
    if (msg.type === 'control:reset') draw();
  });

  resize();
})();
`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function createPrivateSpaceFiles(userId, id, title) {
  const dir = resolvePrivateSpaceDir(userId, id);
  fs.mkdirSync(dir, { recursive: true });
  writeJsonFile(join(dir, 'experiment.json'), defaultExperimentManifest(id, title));
  fs.writeFileSync(join(dir, 'index.html'), defaultIndexHtml(title));
  fs.writeFileSync(join(dir, 'sketch.js'), defaultSketchJs());
  writeJsonFile(join(dir, 'sources.json'), {
    schemaVersion: 1,
    spaceId: id,
    sources: [],
    notes: 'Private demo draft. No external source code copied.',
  });
}

function createSession(store, user, ttlMs) {
  const sessionToken = randomToken(32);
  store.sessions = store.sessions.filter((s) => Date.parse(s.expiresAt) > Date.now());
  store.sessions.push({
    tokenHash: sha256(sessionToken),
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  });
  return sessionToken;
}

function userResponse(user) {
  return {
    id: user.id,
    displayName: user.displayName,
    createdAt: user.createdAt,
    temporary: true,
  };
}

function ensureStarterSpace(store, user) {
  if (store.spaces.some((s) => s.ownerId === user.id)) return null;
  const title = 'My private lab';
  const id = ensureUniquePrivateSpaceId(store, user.id, title);
  createPrivateSpaceFiles(user.id, id, title);
  const space = {
    id,
    title,
    ownerId: user.id,
    domain: 'physics',
    concepts: ['clean slate'],
    createdAt: new Date().toISOString(),
  };
  store.spaces.push(space);
  return space;
}

function createGuestAccount(res) {
  const store = readStore();
  const user = {
    id: 'user_' + randomToken(16),
    displayName: 'Private session',
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  ensureStarterSpace(store, user);
  const sessionToken = createSession(store, user, GUEST_SESSION_TTL_MS);
  writeStore(store);
  res.setHeader('Set-Cookie', serializeSessionCookie(sessionToken));
  return user;
}

function readPrivateManifest(userId, id) {
  return readJsonFile(join(resolvePrivateSpaceDir(userId, id), 'experiment.json'), null);
}

function allFormulaCollections() {
  const dir = join(__dirname, 'sources', 'formulas');
  try {
    return fs.readdirSync(dir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => readJsonFile(join(dir, file), null))
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function normalizeSearchText(value) {
  return String(value || '').toLowerCase();
}

function sourceCatalogEntries() {
  const catalog = readJsonFile(join(__dirname, 'sources', 'catalog.json'), { entries: [] });
  return Array.isArray(catalog.entries) ? catalog.entries : [];
}

function searchLocalPhysics(query, limit = 8) {
  const q = normalizeSearchText(query);
  const terms = q.split(/[^a-z0-9äöüß]+/i).filter(Boolean);
  const rows = [];

  allFormulaCollections().forEach((collection) => {
    (collection.formulas || []).forEach((formula) => {
      const haystack = normalizeSearchText([
        collection.topic,
        formula.id,
        formula.name,
        formula.formula,
        formula.validWhen,
        Object.values(formula.variables || {}).join(' '),
      ].join(' '));
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      if (score > 0 || !terms.length) rows.push({ type: 'formula', score, topic: collection.topic, ...formula });
    });
  });

  sourceCatalogEntries().forEach((source) => {
    const haystack = normalizeSearchText([
      source.id,
      source.name,
      source.url,
      source.license,
      source.licenseStatus,
      source.usage,
      source.allowedUse,
      source.notes,
      (source.useFor || []).join(' '),
    ].join(' '));
    const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
    if (score > 0 || !terms.length) rows.push({ type: 'source', score, ...source });
  });

  return rows
    .sort((a, b) => b.score - a.score || String(a.id || a.name).localeCompare(String(b.id || b.name)))
    .slice(0, Math.max(1, Math.min(Number(limit) || 8, 20)));
}

function safeSpaceFilePath(userId, spaceId, file) {
  if (!ALLOWED_SPACE_FILES.has(file)) throw new Error('Unsupported file');
  const dir = resolvePrivateSpaceDir(userId, spaceId);
  const resolved = resolve(dir, file);
  if (relative(dir, resolved).startsWith('..')) throw new Error('Forbidden');
  return resolved;
}

function scriptTagsFor(html) {
  return [...String(html || '').matchAll(/<script\b[^>]*>/gi)].map((match) => match[0]);
}

function scriptSrcFor(tag) {
  const match = String(tag || '').match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  return match ? match[1].trim() : '';
}

function isLocalSketchScript(src) {
  return src === 'sketch.js' || src === './sketch.js';
}

function validateIndexHtmlRules(html) {
  const issues = [];
  const tags = scriptTagsFor(html);
  const srcs = tags.map(scriptSrcFor).filter(Boolean);
  if (tags.some((tag) => !scriptSrcFor(tag))) {
    issues.push('index.html includes inline script; use sketch.js only');
  }
  if (srcs.some((src) => !isLocalSketchScript(src))) {
    issues.push('index.html includes a forbidden external script');
  }
  if (!srcs.some(isLocalSketchScript)) {
    issues.push('index.html must load local sketch.js');
  }
  if (/<(?:input|button|select|textarea|form)\b/i.test(html)) {
    issues.push('index.html must not define controls; parent app owns controls');
  }
  if (/\.\.\//.test(html)) issues.push('index.html includes a parent path');
  return issues;
}

function verifyPrivateSpace(userId, spaceId) {
  const issues = [];
  const dir = resolvePrivateSpaceDir(userId, spaceId);
  ALLOWED_SPACE_FILES.forEach((file) => {
    const p = safeSpaceFilePath(userId, spaceId, file);
    if (!fs.existsSync(p)) issues.push(file + ' is missing');
  });
  ['experiment.json', 'sources.json'].forEach((file) => {
    const p = safeSpaceFilePath(userId, spaceId, file);
    if (!fs.existsSync(p)) return;
    try { JSON.parse(fs.readFileSync(p, 'utf-8')); }
    catch (err) { issues.push(file + ' is not valid JSON'); }
  });
  const indexPath = safeSpaceFilePath(userId, spaceId, 'index.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf-8');
    issues.push(...validateIndexHtmlRules(html));
  }
  const sketchPath = safeSpaceFilePath(userId, spaceId, 'sketch.js');
  if (fs.existsSync(sketchPath)) {
    const sketch = fs.readFileSync(sketchPath, 'utf-8');
    if (/document\.(?:querySelector|querySelectorAll|createElement)|localStorage|sessionStorage/i.test(sketch)) {
      issues.push('sketch.js must not manipulate parent-style DOM or browser storage');
    }
    const domIds = [...sketch.matchAll(/document\.getElementById\(\s*['"`]([^'"`]+)['"`]\s*\)/g)].map((m) => m[1]);
    domIds.filter((id) => id !== 'lab').forEach((id) => issues.push('sketch.js may only read canvas id "lab", found "' + id + '"'));
  }
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  files.forEach((file) => {
    if (!ALLOWED_SPACE_FILES.has(file)) issues.push('unexpected file: ' + file);
  });
  return { ok: issues.length === 0, issues };
}

function validateSpaceFile(file, content) {
  const text = String(content || '');
  if (text.length > 200_000) throw new Error('File too large');
  if (file === 'experiment.json' || file === 'sources.json') JSON.parse(text);
  if (file === 'index.html') {
    const issues = validateIndexHtmlRules(text);
    if (issues.length) throw new Error(issues.join('; '));
  }
  if (file === 'sketch.js') {
    if (/document\.(?:querySelector|querySelectorAll|createElement)|localStorage|sessionStorage/i.test(text)) {
      throw new Error('sketch.js must not create/query UI DOM or use browser storage');
    }
    const domIds = [...text.matchAll(/document\.getElementById\(\s*['"`]([^'"`]+)['"`]\s*\)/g)].map((m) => m[1]);
    const badId = domIds.find((id) => id !== 'lab');
    if (badId) throw new Error('sketch.js may only read canvas id "lab"; controls/data live in the parent app');
  }
  return text;
}

function contentTypeFor(file) {
  const ext = extname(file);
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

function countManifestEntries(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return 0;
}

function looksLikeNoopAgentText(text) {
  return /^(i checked the lab\.?|ich habe (das )?lab geprueft\.?|checked\.?)$/i.test(String(text || '').trim());
}

function looksLikeBuildRequest(message) {
  return /\b(baue|bau|mach|mache|erstelle|experiment|simulation|simuliere|zeige|reihenschaltung|parallelschaltung|gleichreihenschaltung)\b/i.test(String(message || ''));
}

function buildAgentFinalText(rawText, touchedFiles, verification, manifest, userMessage) {
  if (!touchedFiles.size) {
    const note = String(rawText || '').trim();
    const fallback = looksLikeBuildRequest(userMessage)
      ? 'Ich habe nichts am Lab geaendert, obwohl ein Experiment angefragt wurde. Der Modelllauf hat keine Dateien geschrieben. Bitte sende den Bauauftrag nochmal; wenn es wieder passiert, waehle ein staerkeres Modell.'
      : 'Ich habe nichts am Lab geaendert. Bitte beschreibe direkt, was gebaut werden soll, z.B. "Baue ein Reihenschaltung-und-Parallelschaltung-Experiment".';
    return !note || looksLikeNoopAgentText(note) ? fallback : note;
  }
  const title = manifest?.title || 'Your private lab';
  const controls = countManifestEntries(manifest?.parameters);
  const formulas = countManifestEntries(manifest?.formulas);
  const measurements = countManifestEntries(manifest?.measurements);
  const verifyLine = verification.ok
    ? 'Verifikation: ok.'
    : 'Verifikation: bitte pruefen - ' + verification.issues.join('; ');
  const limits = manifest?.validityLimits?.model || manifest?.validWhen || manifest?.formulas?.find((formula) => formula?.validWhen)?.validWhen;
  const limitLine = limits ? '\nGrenze: ' + limits : '';
  return [
    'Fertig: ' + title + ' wurde aktualisiert.',
    'Controls: ' + controls + ', Formeln: ' + formulas + ', Messwerte: ' + measurements + '.',
    verifyLine + limitLine,
  ].join('\n');
}

async function loadPiSdk() {
  if (piSdkCache) return piSdkCache;
  try {
    const [sdk, typebox] = await Promise.all([
      import('@earendil-works/pi-coding-agent'),
      import('typebox'),
    ]);
    piSdkCache = { sdk, Type: typebox.Type };
    return piSdkCache;
  } catch (err) {
    throw new Error('Pi SDK runtime is not installed. Run npm install and deploy with @earendil-works/pi-coding-agent as a production dependency.');
  }
}

async function runPiAgent({ userId, spaceId, provider, modelId, apiKey, message }) {
  const { sdk, Type } = await loadPiSdk();
  const {
    AuthStorage,
    DefaultResourceLoader,
    ModelRegistry,
    SessionManager,
    SettingsManager,
    createAgentSession,
    defineTool,
  } = sdk;
  const emetExtension = (await import('@black-knight.dev/emet')).default;

  const spaceDir = resolvePrivateSpaceDir(userId, spaceId);
  const authStorage = AuthStorage.inMemory();
  authStorage.setRuntimeApiKey(provider, apiKey);
  const modelRegistry = ModelRegistry.inMemory(authStorage);
  const model = modelRegistry.find(provider, modelId);
  if (!model) throw new Error('Unknown pi provider/model');

  const touchedFiles = new Set();
  let groundingUsed = false;
  let emetUsed = false;
  const getCurrentTool = defineTool({
    name: 'space_get_current',
    label: 'Get current private lab',
    description: 'Read the current private lab files: index.html, sketch.js, experiment.json, and sources.json.',
    parameters: Type.Object({}),
    execute: async () => {
      const files = {};
      ALLOWED_SPACE_FILES.forEach((file) => {
        const p = safeSpaceFilePath(userId, spaceId, file);
        files[file] = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
      });
      return { content: [{ type: 'text', text: JSON.stringify({ spaceId, files }, null, 2) }], details: {} };
    },
  });
  const writeCurrentFileTool = defineTool({
    name: 'space_write_current_file',
    label: 'Write private lab file',
    description: 'Write one private lab file. Allowed files: index.html, sketch.js, experiment.json, sources.json. Keep it safe, local-only, and school physics focused.',
    parameters: Type.Object({
      file: Type.String({ description: 'File name' }),
      content: Type.String({ description: 'Complete file content' }),
    }),
    execute: async (_toolCallId, params) => {
      if (!groundingUsed || !emetUsed) {
        throw new Error('Call both source_search and emet before writing lab files.');
      }
      const file = String(params.file || '');
      const content = validateSpaceFile(file, params.content);
      fs.writeFileSync(safeSpaceFilePath(userId, spaceId, file), content);
      touchedFiles.add(file);
      return { content: [{ type: 'text', text: 'Wrote ' + file }], details: {} };
    },
  });
  const verifyCurrentTool = defineTool({
    name: 'space_verify_current',
    label: 'Verify current private lab',
    description: 'Verify that the current private lab has required files, valid JSON, and no forbidden script/path usage.',
    parameters: Type.Object({}),
    execute: async () => ({
      content: [{ type: 'text', text: JSON.stringify(verifyPrivateSpace(userId, spaceId), null, 2) }],
      details: {},
    }),
  });
  const sourceSearchTool = defineTool({
    name: 'source_search',
    label: 'Search local physics sources',
    description: 'Search local curated physics formulas, source catalog, and source policies before designing or changing a simulation.',
    parameters: Type.Object({
      query: Type.String({ description: 'Physics topic, formula, or source keyword' }),
      limit: Type.Optional(Type.Number({ description: 'Maximum results, default 8' })),
    }),
    execute: async (_toolCallId, params) => {
      groundingUsed = true;
      return {
        content: [{ type: 'text', text: JSON.stringify(searchLocalPhysics(params.query, params.limit), null, 2) }],
        details: {},
      };
    },
  });

  const manifest = readPrivateManifest(userId, spaceId);
  const systemPrompt = `You are flabs, a safe physics-lab builder for a browser demo.

Current private space: ${spaceId} (${manifest?.title || spaceId}).

Architecture:
- The iframe is ONLY the experiment canvas.
- The parent app owns all Controls, Formula, Data, Export, Play, Reset, and Chat UI.
- Controls are generated from experiment.json parameters.
- Formula panel is generated from experiment.json formulas.
- Data panel is generated from postMessage({ type: 'experiment:measurement', payload }).

Rules:
- Work only through these provided tools: emet, web_fetch, source_search, space_get_current, space_write_current_file, space_verify_current.
- No shell, no arbitrary filesystem, no network, no external CDN scripts.
- You may edit only index.html, sketch.js, experiment.json, and sources.json through space_write_current_file.
- index.html must be a minimal shell: canvas#lab plus script src="sketch.js". No inputs, buttons, forms, data panels, formula panels, or inline scripts.
- sketch.js must draw only into canvas#lab and communicate via postMessage. It must not create/query UI DOM except document.getElementById('lab').
- Before building or changing any physics simulation, call source_search and exactly one fast emet search for the topic. Use emet with mode "fast" and authoritative/primary sources where possible. Prefer options such as requirePrimarySource, maxSites <= 3, and official/scientific host allowlists when obvious.
- Do not call web_fetch unless the single emet result is insufficient or points to a specific page that must be read.
- If emet cannot find adequate authoritative sources, label the model as educational/approximate.
- Every built simulation must expose parameters, measurements, formulas, validity limits, and sources.json notes.
- The default simulation must be visibly active immediately after load and must not start in a completed/merged/end state. Default parameters should show at least 20 seconds of motion before any terminal event.
- The canvas may include small labels tied to the experiment, but no duplicate control/data/formula dashboard inside the iframe.
- Keep the main visual readable: no dense full-height stripe fields, no opaque waveform/graph overlays over the experiment objects, and no large dashboard panel inside the canvas. If showing a waveform, keep it small and below or beside the main scene.
- After writing lab files, call space_verify_current and report the result.
- During tool work, do not narrate steps to the user. Use tools silently, repair validation errors silently, and never mention tool names, file-write attempts, validator bugs, or internal retries.
- Keep the final chat response short: only what changed, verification, and model limits.
- Prefer canvas-2d unless the user explicitly asks for p5 or matter.js.
- Never ask for or store API keys.`;

  const settingsManager = SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: true, maxRetries: 1 } });
  const resourceLoader = new DefaultResourceLoader({
    cwd: spaceDir,
    agentDir: join(DATA_DIR, 'pi-agent'),
    settingsManager,
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noThemes: true,
    noContextFiles: true,
    systemPrompt,
    extensionFactories: [
      emetExtension,
      (pi) => {
        pi.on('tool_call', async (event) => {
          if (event.toolName === 'emet' && emetUsed) {
            return { block: true, reason: 'A successful emet research pass already ran. Build with the existing evidence now.' };
          }
          if (event.toolName === 'web_fetch' && emetUsed) {
            return { block: true, reason: 'Use the existing emet evidence; do not fetch more pages for this student build.' };
          }
          return undefined;
        });
        pi.on('tool_result', async (event) => {
          if (event.toolName === 'emet' && !event.isError && event.details?.ok !== false) emetUsed = true;
        });
      },
    ],
  });
  await resourceLoader.reload();
  const { session } = await createAgentSession({
    cwd: spaceDir,
    agentDir: join(DATA_DIR, 'pi-agent'),
    model,
    thinkingLevel: 'off',
    authStorage,
    modelRegistry,
    resourceLoader,
    customTools: [sourceSearchTool, getCurrentTool, writeCurrentFileTool, verifyCurrentTool],
    tools: ['emet', 'web_fetch', 'source_search', 'space_get_current', 'space_write_current_file', 'space_verify_current'],
    sessionManager: SessionManager.inMemory(spaceDir),
    settingsManager,
  });

  let text = '';
  const toolEvents = [];
  const buildRequest = looksLikeBuildRequest(message);
  const promptText = buildRequest
    ? `${String(message || '').slice(0, 7600)}

This is a build request. You must update the lab files for the currently open private space.
Minimum expected writes: experiment.json, sketch.js, sources.json. Write index.html too if it is not already the minimal canvas shell.
Do not finish with only an explanation. Do not say you checked the lab. Use the required research tools, then write files, verify, and keep the final answer short.`
    : String(message || '').slice(0, 8000);
  const unsubscribe = session.subscribe((event) => {
    if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
      text += event.assistantMessageEvent.delta;
    }
    if (event.type === 'tool_execution_start') toolEvents.push({ type: 'start', tool: event.toolName });
    if (event.type === 'tool_execution_end') toolEvents.push({ type: 'end', tool: event.toolName });
  });

  try {
    await session.prompt(promptText);
    if (buildRequest && touchedFiles.size === 0) {
      text = '';
      await session.prompt(`You did not write any lab files. This is a build request, so complete it now.
Call the required research tools if needed, then write experiment.json, sketch.js, sources.json, and index.html if needed.
The user asked: ${String(message || '').slice(0, 1000)}`);
    }
  } finally {
    unsubscribe?.();
    session.dispose();
  }

  const verification = verifyPrivateSpace(userId, spaceId);
  const updatedManifest = readPrivateManifest(userId, spaceId);
  return {
    text: buildAgentFinalText(text, touchedFiles, verification, updatedManifest, message),
    touchedFiles: [...touchedFiles],
    toolEvents,
  };
}

async function main() {
  console.log('flabs — private physics playground');
  console.log('Data dir:', DATA_DIR);
  if (!HAS_PERSISTENT_DISK) {
    console.log('⚠️  No persistent disk — private sessions and spaces are lost on restart.');
    console.log('   Set FLABS_DATA_DIR to a real persistent mount path and FLABS_DATA_PERSISTENT=true for real persistence.');
  }

  const app = express();

  app.use(express.json({ limit: '512kb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '));
    if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (req.path.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      if (origin) {
        const proto = req.get('x-forwarded-proto') || req.protocol;
        const expected = proto + '://' + req.get('host');
        if (origin !== expected) return res.status(403).json({ error: 'Cross-origin request blocked' });
      }
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), providers: PROVIDER_CATALOG.length, dataDir: DATA_DIR, persistent: HAS_PERSISTENT_DISK });
  });

  app.get('/api/providers', (_req, res) => {
    res.json({ providers: PROVIDER_CATALOG });
  });

  app.get('/api/session', (req, res) => {
    const auth = getCurrentUser(req);
    if (!auth) {
      const user = createGuestAccount(res);
      return res.json({ user: userResponse(user), temporary: true });
    }
    res.json({ user: userResponse(auth.user), temporary: true });
  });

  app.get('/api/spaces', (req, res) => {
    const publicSpaces = (readPublicManifest().spaces || []).map((s) => ({ ...s, private: false, path: s.path || publicSpacePath(s.id) }));
    const auth = getCurrentUser(req);
    if (!auth) return res.json({ spaces: publicSpaces });
    const privateSpaces = auth.store.spaces
      .filter((s) => s.ownerId === auth.user.id)
      .map((s) => ({ id: s.id, title: s.title, path: privateSpacePath(s.id), domain: s.domain || 'physics', concepts: s.concepts || ['private lab'], createdAt: s.createdAt, private: true }));
    res.json({ spaces: [...privateSpaces, ...publicSpaces] });
  });

  app.post('/api/spaces', requireUser, (req, res) => {
    const title = String(req.body?.title || '').trim().slice(0, 80);
    if (!title) return res.status(400).json({ error: 'Title required' });
    const store = readStore();
    const user = req.flabsAuth.user;
    const id = ensureUniquePrivateSpaceId(store, user.id, title);
    try {
      createPrivateSpaceFiles(user.id, id, title);
      const space = {
        id,
        title,
        ownerId: user.id,
        domain: 'physics',
        concepts: ['clean slate'],
        createdAt: new Date().toISOString(),
      };
      store.spaces.push(space);
      writeStore(store);
      res.status(201).json({ space: { ...space, ownerId: undefined, private: true, path: privateSpacePath(id) } });
    } catch (err) {
      res.status(500).json({ error: 'Could not create private space' });
    }
  });

  app.get('/api/spaces/:id/manifest', (req, res) => {
    const id = req.params.id;
    if (!isValidSpaceId(id)) return res.status(400).json({ error: 'Invalid space ID' });
    const auth = getCurrentUser(req);
    if (auth && findPrivateSpace(auth.store, auth.user.id, id)) {
      const manifest = readPrivateManifest(auth.user.id, id);
      return manifest ? res.json(manifest) : res.status(404).json({ error: 'Not found' });
    }
    const publicManifest = readJsonFile(join(resolvePublicSpacePath(id), 'experiment.json'), null);
    return publicManifest ? res.json(publicManifest) : res.status(404).json({ error: 'Not found' });
  });

  app.delete('/api/spaces/:id', requireUser, (req, res) => {
    const id = req.params.id;
    if (!isValidSpaceId(id)) return res.status(400).json({ error: 'Invalid space ID' });
    const store = readStore();
    const idx = store.spaces.findIndex((s) => s.ownerId === req.flabsAuth.user.id && s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Private space not found' });
    store.spaces.splice(idx, 1);
    writeStore(store);
    fs.rmSync(resolvePrivateSpaceDir(req.flabsAuth.user.id, id), { recursive: true, force: true });
    res.json({ ok: true });
  });

  app.get('/api/me/spaces/:id/', requireUser, (req, res) => {
    const store = readStore();
    if (!findPrivateSpace(store, req.flabsAuth.user.id, req.params.id)) return res.status(404).send('Not found');
    res.type('text/html').send(fs.readFileSync(safeSpaceFilePath(req.flabsAuth.user.id, req.params.id, 'index.html'), 'utf-8'));
  });

  app.get('/api/me/spaces/:id/:file', requireUser, (req, res) => {
    const store = readStore();
    if (!findPrivateSpace(store, req.flabsAuth.user.id, req.params.id)) return res.status(404).send('Not found');
    const file = String(req.params.file || '');
    if (!ALLOWED_SPACE_FILES.has(file)) return res.status(404).send('Not found');
    const p = safeSpaceFilePath(req.flabsAuth.user.id, req.params.id, file);
    if (!fs.existsSync(p)) return res.status(404).send('Not found');
    res.type(contentTypeFor(file)).send(fs.readFileSync(p, 'utf-8'));
  });

  app.post('/api/agent/chat', requireUser, async (req, res) => {
    const { provider, modelId, apiKey, message, spaceId } = req.body || {};
    if (!provider || !modelId || !apiKey || !message || !spaceId) {
      return res.status(400).json({ error: 'provider, modelId, apiKey, spaceId, and message are required' });
    }
    const store = readStore();
    if (!findPrivateSpace(store, req.flabsAuth.user.id, String(spaceId))) {
      return res.status(403).json({ error: 'Agent can only edit your private spaces' });
    }
    try {
      const result = await runPiAgent({
        userId: req.flabsAuth.user.id,
        spaceId: String(spaceId),
        provider: String(provider),
        modelId: String(modelId),
        apiKey: String(apiKey),
        message: String(message),
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Agent request failed. Check the selected provider, model, and API key.' });
    }
  });

  // Public experiments (demo labs). Paths are validated elsewhere; this only serves
  // the public demo spaces directory.
  app.use('/experiments', express.static(join(__dirname, 'experiments')));

  // Explicit, allow-listed static assets only. We deliberately do NOT serve the
  // repo root (no express.static(__dirname)) so that server.js, package.json,
  // package-lock.json, node_modules/, and any other repo files stay private.
  const PUBLIC_ASSETS = ['css', 'js'];
  PUBLIC_ASSETS.forEach((dir) => {
    app.use('/' + dir, express.static(join(__dirname, dir)));
  });
  app.get(['/index.html', '/'], (_req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });
  app.get('/flabs_logo.png', (_req, res) => {
    res.sendFile(join(__dirname, 'flabs_logo.png'));
  });
  app.get('/SECURITY.md', (_req, res) => {
    res.sendFile(join(__dirname, 'SECURITY.md'));
  });

  // Fallback for any other path: 404 instead of falling through to a directory
  // walk of the repo root.
  app.use((_req, res) => res.status(404).send('Not found'));

  app.listen(PORT, '0.0.0.0', () => {
    console.log('http://localhost:' + PORT);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
