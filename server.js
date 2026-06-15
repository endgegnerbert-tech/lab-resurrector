/**
 * server.js — flabs server
 *
 * Static public labs + private demo accounts + server-side pi SDK agent bridge.
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
const HAS_PERSISTENT_DISK = !!process.env.FLABS_DATA_DIR;
const PRIVATE_SPACES_DIR = join(DATA_DIR, 'spaces');
const STORE_FILE = join(DATA_DIR, 'store.json');
const SESSION_COOKIE = 'flabs_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
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

function sanitizeDisplayName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80) || 'Demo account';
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
    'Max-Age=' + maxAgeSeconds,
  ];
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
  if (!auth) return res.status(401).json({ error: 'Account required' });
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
    concepts: ['private lab'],
    parameters: {
      amplitude: { label: 'Amplitude', min: 10, max: 120, step: 1, default: 60, unit: 'px', meaning: 'Oscillation size' },
      frequency: { label: 'Frequency', min: 0.1, max: 2, step: 0.1, default: 0.8, unit: 'Hz', meaning: 'Cycles per second' },
    },
    measurements: [
      { id: 't', label: 'Time', unit: 's' },
      { id: 'y', label: 'Displacement', unit: 'px' },
    ],
    formulas: [{
      id: 'simple-harmonic-demo',
      name: 'Simple harmonic starting model',
      formula: 'y(t) = A sin(2π f t)',
      variables: { A: 'Amplitude', f: 'Frequency', t: 'Time' },
      validWhen: 'Small-amplitude classroom demo model.',
    }],
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
  const params = { amplitude: 60, frequency: 0.8 };
  let running = true;
  let start = performance.now();

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function emit(payload) {
    if (window.parent) window.parent.postMessage({ type: 'experiment:measurement', payload }, window.location.origin);
  }

  function frame(now) {
    if (running) {
      const t = (now - start) / 1000;
      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      const mid = h / 2;
      const y = params.amplitude * Math.sin(2 * Math.PI * params.frequency * t);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#252540';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();
      ctx.fillStyle = '#7c6cf0';
      ctx.beginPath();
      ctx.arc(w / 2, mid + y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#40d9b8';
      ctx.fillText('y = ' + y.toFixed(1) + ' px', w / 2 + 40, mid + y + 4);
      emit({ t: Number(t.toFixed(2)), y: Number(y.toFixed(2)) });
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    const msg = event.data || {};
    if (msg.type === 'param:set' && Object.prototype.hasOwnProperty.call(params, msg.name)) params[msg.name] = Number(msg.value);
    if (msg.type === 'control:play') running = !!msg.playing;
    if (msg.type === 'control:reset') start = performance.now();
  });

  resize();
  requestAnimationFrame(frame);
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

function readPrivateManifest(userId, id) {
  return readJsonFile(join(resolvePrivateSpaceDir(userId, id), 'experiment.json'), null);
}

function safeSpaceFilePath(userId, spaceId, file) {
  if (!ALLOWED_SPACE_FILES.has(file)) throw new Error('Unsupported file');
  const dir = resolvePrivateSpaceDir(userId, spaceId);
  const resolved = resolve(dir, file);
  if (relative(dir, resolved).startsWith('..')) throw new Error('Forbidden');
  return resolved;
}

function validateSpaceFile(file, content) {
  const text = String(content || '');
  if (text.length > 200_000) throw new Error('File too large');
  if (file === 'experiment.json' || file === 'sources.json') JSON.parse(text);
  if (file === 'index.html') {
    if (/<script\b[^>]*\bsrc=["'](?!\.\/?sketch\.js["'])/i.test(text)) {
      throw new Error('Only local sketch.js script is allowed in private draft HTML');
    }
    if (/\.\.\//.test(text)) throw new Error('Parent paths are not allowed');
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

function createLabResourceLoader(systemPrompt, createExtensionRuntime) {
  return {
    getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
    getSkills: () => ({ skills: [], diagnostics: [] }),
    getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }),
    getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => systemPrompt,
    getAppendSystemPrompt: () => [],
    extendResources: () => {},
    reload: async () => {},
  };
}

async function runPiAgent({ userId, spaceId, provider, modelId, apiKey, message }) {
  const { sdk, Type } = await loadPiSdk();
  const {
    AuthStorage,
    ModelRegistry,
    SessionManager,
    SettingsManager,
    createAgentSession,
    createExtensionRuntime,
    defineTool,
  } = sdk;

  const spaceDir = resolvePrivateSpaceDir(userId, spaceId);
  const authStorage = AuthStorage.inMemory();
  authStorage.setRuntimeApiKey(provider, apiKey);
  const modelRegistry = ModelRegistry.inMemory(authStorage);
  const model = modelRegistry.find(provider, modelId);
  if (!model) throw new Error('Unknown pi provider/model');

  const touchedFiles = new Set();
  const readTool = defineTool({
    name: 'space_read_file',
    label: 'Read private lab file',
    description: 'Read one private lab file. Allowed files: index.html, sketch.js, experiment.json, sources.json.',
    parameters: Type.Object({ file: Type.String({ description: 'File name' }) }),
    execute: async (_toolCallId, params) => {
      const file = String(params.file || '');
      const p = safeSpaceFilePath(userId, spaceId, file);
      return { content: [{ type: 'text', text: fs.readFileSync(p, 'utf-8') }], details: {} };
    },
  });
  const writeTool = defineTool({
    name: 'space_write_file',
    label: 'Write private lab file',
    description: 'Write one private lab file. Allowed files: index.html, sketch.js, experiment.json, sources.json. Keep it safe, local-only, and school physics focused.',
    parameters: Type.Object({
      file: Type.String({ description: 'File name' }),
      content: Type.String({ description: 'Complete file content' }),
    }),
    execute: async (_toolCallId, params) => {
      const file = String(params.file || '');
      const content = validateSpaceFile(file, params.content);
      fs.writeFileSync(safeSpaceFilePath(userId, spaceId, file), content);
      touchedFiles.add(file);
      return { content: [{ type: 'text', text: 'Wrote ' + file }], details: {} };
    },
  });
  const listTool = defineTool({
    name: 'space_list_files',
    label: 'List private lab files',
    description: 'List editable private lab files.',
    parameters: Type.Object({}),
    execute: async () => ({ content: [{ type: 'text', text: [...ALLOWED_SPACE_FILES].join('\n') }], details: {} }),
  });

  const manifest = readPrivateManifest(userId, spaceId);
  const systemPrompt = `You are flabs, a safe physics-lab builder for a browser demo.\n\nCurrent private space: ${spaceId} (${manifest?.title || spaceId}).\n\nRules:\n- Work only through the provided space_* tools. No shell, no network, no external CDN scripts.\n- You may edit only index.html, sketch.js, experiment.json, and sources.json.\n- Keep simulations local, deterministic, educational, and age-appropriate.\n- Every built simulation must expose parameters, measurements, formulas, validity limits, and sources.json notes.\n- Prefer canvas-2d unless the user explicitly asks for p5 or matter.js.\n- If the user asks to build/change the lab, write the needed files, then explain briefly what changed.\n- Never ask for or store API keys.`;

  const settingsManager = SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: true, maxRetries: 1 } });
  const { session } = await createAgentSession({
    cwd: spaceDir,
    agentDir: join(DATA_DIR, 'pi-agent'),
    model,
    thinkingLevel: 'off',
    authStorage,
    modelRegistry,
    resourceLoader: createLabResourceLoader(systemPrompt, createExtensionRuntime),
    customTools: [readTool, writeTool, listTool],
    tools: ['space_read_file', 'space_write_file', 'space_list_files'],
    sessionManager: SessionManager.inMemory(spaceDir),
    settingsManager,
  });

  let text = '';
  const toolEvents = [];
  const unsubscribe = session.subscribe((event) => {
    if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
      text += event.assistantMessageEvent.delta;
    }
    if (event.type === 'tool_execution_start') toolEvents.push({ type: 'start', tool: event.toolName });
    if (event.type === 'tool_execution_end') toolEvents.push({ type: 'end', tool: event.toolName });
  });

  try {
    await session.prompt(String(message || '').slice(0, 8000));
  } finally {
    unsubscribe?.();
    session.dispose();
  }

  return { text: text || 'I updated the lab.', touchedFiles: [...touchedFiles], toolEvents };
}

async function main() {
  console.log('flabs — private physics playground');
  console.log('Data dir:', DATA_DIR);
  if (!HAS_PERSISTENT_DISK) {
    console.log('⚠️  No persistent disk — accounts and private spaces are lost on restart.');
    console.log('   Set FLABS_DATA_DIR to a persistent mount path for real persistence.');
  }

  const app = express();

  app.use(express.json({ limit: '512kb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
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

  app.get('/api/account', (req, res) => {
    const auth = getCurrentUser(req);
    if (!auth) return res.json({ user: null });
    res.json({ user: { id: auth.user.id, displayName: auth.user.displayName, createdAt: auth.user.createdAt } });
  });

  app.post('/api/account/create', (req, res) => {
    const store = readStore();
    const recoveryCode = 'flabs_' + randomToken(32);
    const user = {
      id: 'user_' + randomToken(16),
      displayName: sanitizeDisplayName(req.body?.displayName),
      recoveryHash: sha256(recoveryCode),
      createdAt: new Date().toISOString(),
    };
    const sessionToken = randomToken(32);
    store.users.push(user);
    store.sessions.push({ tokenHash: sha256(sessionToken), userId: user.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() });
    writeStore(store);
    res.setHeader('Set-Cookie', serializeSessionCookie(sessionToken, Math.floor(SESSION_TTL_MS / 1000)));
    res.status(201).json({ user: { id: user.id, displayName: user.displayName, createdAt: user.createdAt }, recoveryCode });
  });

  app.post('/api/account/login', (req, res) => {
    const recoveryCode = String(req.body?.recoveryCode || '').trim();
    if (!recoveryCode) return res.status(400).json({ error: 'Recovery code required' });
    const store = readStore();
    const user = store.users.find((u) => u.recoveryHash === sha256(recoveryCode));
    if (!user) return res.status(401).json({ error: 'Invalid recovery code' });
    const sessionToken = randomToken(32);
    store.sessions = store.sessions.filter((s) => Date.parse(s.expiresAt) > Date.now());
    store.sessions.push({ tokenHash: sha256(sessionToken), userId: user.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() });
    writeStore(store);
    res.setHeader('Set-Cookie', serializeSessionCookie(sessionToken, Math.floor(SESSION_TTL_MS / 1000)));
    res.json({ user: { id: user.id, displayName: user.displayName, createdAt: user.createdAt } });
  });

  app.post('/api/account/logout', (req, res) => {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (token) {
      const store = readStore();
      store.sessions = store.sessions.filter((s) => s.tokenHash !== sha256(token));
      writeStore(store);
    }
    res.setHeader('Set-Cookie', serializeSessionCookie('', 0));
    res.json({ ok: true });
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
        concepts: ['private lab'],
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
      res.status(500).json({ error: err.message || 'Agent failed' });
    }
  });

  app.use('/experiments', express.static(join(__dirname, 'experiments')));
  app.use(express.static(__dirname));

  app.listen(PORT, '0.0.0.0', () => {
    console.log('http://localhost:' + PORT);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
