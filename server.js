/**
 * server.js -- flabs pi agent server
 *
 * Express + WebSocket server that bridges browser with pi SDK.
 * Custom physics tools, experiment spaces, live AI chat.
 *
 * No hardcoded API keys. Each browser user brings their own.
 * Keys are set via authStorage.setRuntimeApiKey() (pi SDK pattern).
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';
import { Type } from 'typebox';
import emetExtension from '@black-knight.dev/emet';
import {
  createAgentSession,
  defineTool,
  AuthStorage,
  ModelRegistry,
  SessionManager,
  SettingsManager,
} from '@earendil-works/pi-coding-agent';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3210;

let wss = null;
let currentSession = null;
let messageQueue = [];
let isProcessing = false;

const EXPERIMENTS_DIR = join(__dirname, 'experiments');
const SPACES_DIR = join(EXPERIMENTS_DIR, 'spaces');
const SOURCES_DIR = join(__dirname, 'sources');

let simState = {
  scene: 'pendulum',
  currentSpaceId: null,
  params: { mass: 2, length: 4, angle: 45, gravity: 9.81 },
};

function readJsonFile(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, 'utf-8')); }
  catch (_) { return fallback; }
}

function writeJsonFile(path, data) {
  fs.mkdirSync(dirname(path), { recursive: true });
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

function sanitizeSpaceId(value) {
  return String(value || '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 48) || 'new-space';
}

function ensureUniqueSpaceId(baseId) {
  let id = sanitizeSpaceId(baseId);
  let c = 2;
  while (fs.existsSync(join(SPACES_DIR, id))) id = sanitizeSpaceId(baseId) + '-' + (c++);
  return id;
}

function resolveSpacePath(spaceId) {
  if (!/^[a-z][a-z0-9-]*$/.test(spaceId)) throw new Error('Invalid space ID');
  const r = resolve(SPACES_DIR, spaceId);
  if (!r.startsWith(resolve(SPACES_DIR) + '/')) throw new Error('Forbidden');
  return r;
}

function escapeHtml(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createCleanSlateSpaceFiles(spaceId, title) {
  const dir = resolveSpacePath(spaceId);
  const ht = escapeHtml(title);
  fs.mkdirSync(dir, { recursive: true });
  writeJsonFile(join(dir, 'experiment.json'), {
    schemaVersion: 1, id: spaceId, title, domain: 'physics', engine: 'canvas-2d',
    level: 'school', concepts: ['free lab'],
    parameters: { timeScale: { label: 'Time scale', min: 0.1, max: 3, step: 0.1, default: 1, unit: 'x', meaning: 'Scales simulation speed.' } },
    measurements: [{ id: 't', label: 'Time', unit: 's' }],
    formulas: [{ id: 'free-space-model', name: 'Free lab model', formula: 'Model is set via chat', variables: { t: 'Time (s)' }, validWhen: 'No physics model selected yet.' }]
  });
  writeJsonFile(join(dir, 'sources.json'), { schemaVersion: 1, spaceId, sources: [], notes: 'Clean slate.' });
  fs.writeFileSync(join(dir, 'index.html'), '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>' + ht + ' -- flabs</title><style>*{box-sizing:border-box;margin:0;padding:0}body{height:100vh;background:#0a0a14;color:#e8e8f0;font-family:system-ui,sans-serif;overflow:hidden}#space{height:100%;display:grid;place-items:center;padding:2rem;text-align:center}.card{max-width:720px;padding:2rem;border:1px solid #2a2a45;border-radius:18px;background:rgba(26,26,46,0.86);box-shadow:0 10px 40px rgba(0,0,0,0.35)}h1{font-size:1.6rem;margin-bottom:0.8rem;color:#40d9b8}p{color:#8888aa;line-height:1.55;margin:0.4rem 0}canvas{display:none}</style></head><body><main id="space"><section class="card"><h1>' + ht + '</h1><p>This is a fresh, empty lab workspace.</p><p>Tell the lab assistant what experiment you want to build.</p><p>Controls are in the sidebar. Measurements show in the data panel.</p></section><canvas id="sim-canvas"></canvas></main><script src="sketch.js"></script></body></html>');
  fs.writeFileSync(join(dir, 'sketch.js'), '// flabs space: ' + spaceId + '\n(function(){"use strict";window.addEventListener("message",function(e){if(e.origin!==window.location.origin)return;if(e.data.type==="param:set")console.log("[' + spaceId + '] param:",e.data.name,e.data.value);});console.log("[' + spaceId + '] ready");})();\n');
}

function readSpacesManifest() {
  return readJsonFile(join(EXPERIMENTS_DIR, 'manifest.json'), { spaces: [] }) || { spaces: [] };
}

function writeSpacesManifest(m) { writeJsonFile(join(EXPERIMENTS_DIR, 'manifest.json'), m); }

const SPACE_WRITABLE = new Set(['index.html', 'sketch.js', 'experiment.json', 'sources.json']);

function loadFormulaEntries() {
  const dir = join(SOURCES_DIR, 'formulas');
  if (!fs.existsSync(dir)) return [];
  const r = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) {
    const doc = readJsonFile(join(dir, f), null);
    for (const fm of doc?.formulas || []) r.push({ topic: doc.topic || f.replace(/\.json$/, ''), file: f, ...fm });
  }
  return r;
}

function verifySpace(spaceId) {
  const required = ['experiment.json', 'index.html', 'sketch.js', 'sources.json'];
  const files = {};
  for (const f of required) files[f] = fs.existsSync(join(resolveSpacePath(spaceId), f));
  const errs = Object.entries(files).filter(([, e]) => !e).map(([f]) => f + ' missing');
  const m = readJsonFile(join(resolveSpacePath(spaceId), 'experiment.json'), null);
  if (!m) errs.push('experiment.json not valid JSON');
  if (m && m.id !== spaceId) errs.push('experiment.json id mismatch');
  if (!readJsonFile(join(resolveSpacePath(spaceId), 'sources.json'), null)) errs.push('sources.json not valid JSON');
  return { ok: errs.length === 0, errors: errs, files };
}

function broadcast(data) {
  if (!wss) return;
  const m = JSON.stringify(data);
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(m); });
}

// ── Custom Tools ───────────────────────────────
function createCustomTools() {
  return [
    defineTool({ name: 'sim_set_param', description: 'Changes a parameter in the live simulation. pendulum: mass(1-10), length(1-8), angle(5-85), gravity(1-20). projectile: angle(5-85), speed(5-50), mass(1-10), gravity(1-20)', parameters: Type.Object({ name: Type.String(), value: Type.Number() }), execute: async (_tid, p) => { simState.params[p.name] = p.value; broadcast({ type: 'sim_set_param', name: p.name, value: p.value }); return { content: [{ type: 'text', text: p.name + ' = ' + p.value }], details: {} }; } }),
    defineTool({ name: 'sim_get_state', description: 'Returns current simulation state.', parameters: Type.Object({}), execute: async () => ({ content: [{ type: 'text', text: JSON.stringify(simState, null, 2) }], details: simState }) }),
    defineTool({ name: 'sim_switch_scene', description: 'Switches scene: pendulum or projectile.', parameters: Type.Object({ scene: Type.String() }), execute: async (_tid, p) => { const d = { pendulum: { mass: 2, length: 4, angle: 45, gravity: 9.81 }, projectile: { angle: 45, speed: 20, mass: 2, gravity: 9.81 } }; if (!d[p.scene]) return { content: [{ type: 'text', text: 'Unknown: ' + p.scene }], isError: true }; simState = { scene: p.scene, currentSpaceId: null, params: d[p.scene] }; broadcast({ type: 'sim_switch_scene', scene: p.scene, params: d[p.scene] }); return { content: [{ type: 'text', text: 'Scene: ' + p.scene }], details: simState }; } }),
    defineTool({ name: 'sim_reset', description: 'Resets simulation to default parameters.', parameters: Type.Object({}), execute: async () => { const d = { pendulum: { mass: 2, length: 4, angle: 45, gravity: 9.81 }, projectile: { angle: 45, speed: 20, mass: 2, gravity: 9.81 } }; simState.params = { ...d[simState.scene] }; broadcast({ type: 'sim_reset', params: simState.params }); return { content: [{ type: 'text', text: 'Reset' }], details: simState }; } }),
    defineTool({ name: 'sim_highlight', description: 'Highlights an element: bob, rod, ball, ground, velocity_vector.', parameters: Type.Object({ element: Type.String() }), execute: async (_tid, p) => { broadcast({ type: 'sim_highlight', element: p.element }); return { content: [{ type: 'text', text: p.element + ' highlighted' }], details: {} }; } }),
    defineTool({ name: 'source_search', description: 'Searches the local formula/source library for physics concepts.', parameters: Type.Object({ query: Type.String() }), execute: async (_tid, p) => { const scored = loadFormulaEntries().map(e => ({ entry: e, score: JSON.stringify(e).toLowerCase().includes(p.query.toLowerCase()) ? 1 : 0 })).filter(e => e.score > 0); return { content: [{ type: 'text', text: scored.length ? 'Local matches:\n' + scored.slice(0, 5).map(s => '- ' + (s.entry.name || s.entry.formula || s.entry.id)).join('\n') : 'No local matches. Use emet.' }], details: scored.slice(0, 5) }; } }),
    defineTool({ name: 'physics_formula_lookup', description: 'Looks up grounded physics formulas from the local library by concept.', parameters: Type.Object({ concept: Type.String() }), execute: async (_tid, p) => { const m = loadFormulaEntries().filter(f => JSON.stringify(f).toLowerCase().includes(p.concept.toLowerCase())); return { content: [{ type: 'text', text: m.length ? 'Local physics grounding found.\n' + JSON.stringify(m.slice(0, 5), null, 2) : 'No local formula found. Use emet.' }], details: m.slice(0, 5) }; } }),
    defineTool({ name: 'physics_source_policy', description: 'Checks the usage/license policy for an OSS physics source.', parameters: Type.Object({ sourceName: Type.String() }), execute: async (_tid, p) => { return { content: [{ type: 'text', text: 'Check sources/catalog.json for license details. Use emet if uncertain.' }], details: {} }; } }),
    defineTool({ name: 'physics_model_plan', description: 'Plans a physics model: parameters, measurements, formulas, limits.', parameters: Type.Object({ concept: Type.String() }), execute: async (_tid, p) => { const m = loadFormulaEntries().filter(f => JSON.stringify(f).toLowerCase().includes(p.concept.toLowerCase())); return { content: [{ type: 'text', text: 'Model plan for "' + p.concept + '": ' + m.length + ' matching formulas.' }], details: m.slice(0, 3) }; } }),
    defineTool({ name: 'space_get_current', description: 'Checks the currently selected space.', parameters: Type.Object({}), execute: async () => { if (!simState.currentSpaceId) return { content: [{ type: 'text', text: 'No space selected.' }], isError: true }; const m = readJsonFile(join(resolveSpacePath(simState.currentSpaceId), 'experiment.json'), null); return { content: [{ type: 'text', text: 'Current space: ' + simState.currentSpaceId + ' / ' + (m?.title || 'unknown') }], details: { spaceId: simState.currentSpaceId, manifest: m } }; } }),
    defineTool({ name: 'space_write_current_file', description: 'Writes content to a file in the current space. Allowed: index.html, sketch.js, experiment.json, sources.json.', parameters: Type.Object({ file: Type.String(), content: Type.String() }), execute: async (_tid, p) => { if (!simState.currentSpaceId) return { content: [{ type: 'text', text: 'No space selected.' }], isError: true }; if (!SPACE_WRITABLE.has(String(p.file))) return { content: [{ type: 'text', text: 'File not writable for spaces.' }], isError: true }; try { const target = join(resolveSpacePath(simState.currentSpaceId), String(p.file)); if (String(p.file).endsWith('.json')) JSON.parse(p.content); fs.writeFileSync(target, p.content); broadcast({ type: 'space_updated', spaceId: simState.currentSpaceId, file: p.file }); return { content: [{ type: 'text', text: p.file + ' written.' }], details: { spaceId: simState.currentSpaceId, file: p.file } }; } catch (err) { return { content: [{ type: 'text', text: err.message }], isError: true }; } } }),
    defineTool({ name: 'space_verify_current', description: 'Verifies the current space.', parameters: Type.Object({}), execute: async () => { if (!simState.currentSpaceId) return { content: [{ type: 'text', text: 'No space selected.' }], isError: true }; const r = verifySpace(simState.currentSpaceId); return { content: [{ type: 'text', text: r.ok ? 'Space verified.' : 'Space errors:\n' + r.errors.join('\n') }], details: r, isError: !r.ok }; } }),
  ];
}

const etools = (() => { try { const t = []; emetExtension({ on() {}, registerTool(tool) { t.push(tool); } }); return t; } catch (_) { return []; } })();

// ── Prompt Builder ─────────────────────────────
function buildAgentPrompt(msg) {
  return 'You are flabs -- AI physics lab assistant.\n\nCURRENT CONTEXT:\n- Space: ' + (simState.currentSpaceId || 'none selected') + '\n- Params: ' + JSON.stringify(simState.params) + '\n\nTOOLS: sim_set_param, sim_get_state, sim_switch_scene, sim_reset, sim_highlight, source_search, physics_formula_lookup, physics_source_policy, physics_model_plan, space_get_current, space_write_current_file, space_verify_current\n\nRULES:\n- No sliders/buttons in space HTML. Main app controls via postMessage.\n- Parameters go in experiment.json. Control bar auto-renders them.\n- Send measurements via window.parent.postMessage every ~10 frames.\n- state.running boolean. control:play toggles. resetSim() resets.\n- Pure Canvas 2D preferred unless collisions needed.\n\nBUILD PLAN: confirm space -> physics_formula_lookup + physics_model_plan -> write files -> space_verify_current -> explain results.\n\nPERSONALITY: Enthusiastic, Socratic, clear language. Correct misconceptions via experiments.\n\nCOMMON MISCONCEPTIONS: "Heavier falls faster" = FALSE. "Mass affects pendulum period" = FALSE. "Force required for constant motion" = FALSE.\n\nSTUDENT: ' + msg;
}

async function processQueue() {
  if (isProcessing || messageQueue.length === 0) return;
  isProcessing = true;
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    try {
      broadcast({ type: 'agent_thinking' });
      await currentSession.prompt(buildAgentPrompt(msg));
      broadcast({ type: 'agent_done' });
    } catch (err) {
      console.error('pi error:', err.message);
      broadcast({ type: 'chat_error', text: 'Error: ' + err.message });
      messageQueue.length = 0;
      broadcast({ type: 'agent_done' });
    }
  }
  isProcessing = false;
}

// ── Create a per-browser agent session with the user's own API key ──
async function createUserSession(apiKey) {
  try {
    // pi SDK pattern: AuthStorage.setRuntimeApiKey() for ephemeral keys
    const authStorage = AuthStorage.create();
    const modelRegistry = ModelRegistry.create(authStorage);
    authStorage.setRuntimeApiKey('*', apiKey);

    const available = await modelRegistry.getAvailable();
    const model = available[0] || null;

    const { session } = await createAgentSession({
      model,
      authStorage,
      modelRegistry,
      customTools: createCustomTools(),
      tools: ['sim_set_param', 'sim_get_state', 'sim_reset', 'sim_highlight',
              'source_search', 'space_get_current', 'space_write_current_file', 'space_verify_current',
              'emet', 'physics_formula_lookup', 'physics_source_policy', 'physics_model_plan'],
      sessionManager: SessionManager.inMemory(),
      settingsManager: SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: true, maxRetries: 2 } }),
    });

    session.subscribe((event) => {
      switch (event.type) {
        case 'message_update': {
          const d = event.assistantMessageEvent;
          if (d.type === 'text_delta') broadcast({ type: 'chat_delta', text: d.delta });
          if (d.type === 'thinking_delta' && d.delta) broadcast({ type: 'chat_thinking', text: d.delta });
          break;
        }
        case 'tool_execution_start': broadcast({ type: 'tool_start', tool: event.toolName, args: event.args }); break;
        case 'tool_execution_end': broadcast({ type: 'tool_end', tool: event.toolName, isError: event.isError }); break;
        case 'agent_start': broadcast({ type: 'agent_start' }); break;
        case 'compaction_start': broadcast({ type: 'tool_start', tool: 'compaction' }); break;
        case 'compaction_end': broadcast({ type: 'tool_end', tool: 'compaction' }); break;
      }
    });

    return session;
  } catch (err) {
    console.error('Session creation failed:', err.message);
    return null;
  }
}

// ── Main ────────────────────────────────────────
async function main() {
  console.log('flabs -- pi physics lab');
  console.log('No API keys hardcoded. Users bring their own via browser.');

  const app = express();
  const server = createServer(app);
  wss = new WebSocketServer({ server });

  app.use(express.json({ limit: '64kb' }));
  app.use(express.static(__dirname));
  app.use('/experiments', express.static(join(__dirname, 'experiments')));
  app.use('/sources', express.static(join(__dirname, 'sources')));

  // Health check for Render keep-alive
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), sessionActive: currentSession !== null });
  });

  // Space API
  app.get('/api/spaces', (_req, res) => res.json(readSpacesManifest()));

  app.post('/api/spaces', (req, res) => {
    const title = String(req.body?.title || '').trim().slice(0, 80);
    if (!title) return res.status(400).json({ error: 'Title required' });
    const id = ensureUniqueSpaceId(title);
    try {
      createCleanSlateSpaceFiles(id, title);
      const manifest = readSpacesManifest();
      const space = { id, title, path: '/experiments/spaces/' + id + '/', domain: 'physics', concepts: ['free lab'], createdAt: new Date().toISOString() };
      manifest.spaces = [...(manifest.spaces || []).filter(s => s.id !== id), space];
      writeSpacesManifest(manifest);
      res.status(201).json({ space });
    } catch (err) {
      res.status(500).json({ error: 'Could not create space' });
    }
  });

  app.delete('/api/spaces/:id', (req, res) => {
    const id = req.params.id;
    if (!/^[a-z][a-z0-9-]*$/.test(id)) return res.status(400).json({ error: 'Invalid space ID' });
    try {
      const manifest = readSpacesManifest();
      const idx = (manifest.spaces || []).findIndex(s => s.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Space not found' });
      manifest.spaces.splice(idx, 1);
      writeSpacesManifest(manifest);
      fs.rmSync(resolveSpacePath(id), { recursive: true, force: true });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'Could not delete space' });
    }
  });

  app.get('/api/spaces/:id/manifest', (req, res) => {
    const id = req.params.id;
    if (!/^[a-z][a-z0-9-]*$/.test(id)) return res.status(400).json({ error: 'Invalid space ID' });
    try {
      res.json(JSON.parse(fs.readFileSync(join(resolveSpacePath(id), 'experiment.json'), 'utf-8')));
    } catch (err) {
      res.status(err.code === 'ENOENT' ? 404 : 500).json({ error: 'Not found' });
    }
  });

  // ── WebSocket ────────────────────────────────
  wss.on('connection', (ws) => {
    console.log('Browser connected');
    let hasKey = false;

    ws.send(JSON.stringify({ type: 'sim_state', state: simState }));
    ws.send(JSON.stringify({ type: 'needs_api_key', message: 'Enter your API key in the browser to activate the AI lab assistant.' }));
    ws.send(JSON.stringify({ type: 'info', text: 'Connected to flabs. Enter your API key (key icon in top bar) to activate the AI.' }));

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {

          case 'set_api_key': {
            const key = String(msg.apiKey || '').trim();
            if (!key) {
              ws.send(JSON.stringify({ type: 'chat_error', text: 'API key is required.' }));
              return;
            }
            ws.send(JSON.stringify({ type: 'chat_system', text: 'Connecting with your API key...' }));
            const session = await createUserSession(key);
            if (session) {
              if (currentSession) { try { currentSession.dispose(); } catch (_) {} }
              currentSession = session;
              hasKey = true;
              const modelName = session.model?.name || session.model?.id || 'connected';
              ws.send(JSON.stringify({ type: 'api_key_ready', model: modelName }));
              ws.send(JSON.stringify({ type: 'chat_system', text: 'AI lab assistant activated with model: ' + modelName }));
              console.log('Session created: ' + modelName);
              messageQueue = [];
            } else {
              ws.send(JSON.stringify({ type: 'chat_error', text: 'Could not create session. Check your API key and provider. The pi SDK supports OpenAI, Anthropic, DeepSeek, Groq, Google, Ollama and more.' }));
            }
            break;
          }

          case 'chat_message': {
            const text = msg.text.trim();
            if (!text) return;
            if (!hasKey || !currentSession) {
              ws.send(JSON.stringify({ type: 'chat_system', text: 'Enter your API key first (tap the key icon in the top bar).' }));
              return;
            }
            broadcast({ type: 'chat_user', text });
            messageQueue.push(text);
            processQueue();
            break;
          }

          case 'sim_state_update':
            if (msg.state) Object.assign(simState.params, msg.state);
            break;

          case 'space_selected':
            if (msg.spaceId) {
              simState.currentSpaceId = String(msg.spaceId);
              const m = readJsonFile(join(resolveSpacePath(simState.currentSpaceId), 'experiment.json'), null);
              broadcast({ type: 'chat_system', text: 'Switched to space: "' + (m?.title || simState.currentSpaceId) + '"' });
            }
            break;
        }
      } catch (err) {
        console.error('WS error:', err.message);
      }
    });

    ws.on('close', () => console.log('Browser disconnected'));
  });

  // ── Start ────────────────────────────────────
  server.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(40));
    console.log('http://localhost:' + PORT);
    console.log('Model: user-provided (set API key in browser)');
    console.log('WebSocket: ws://localhost:' + PORT);
    console.log('='.repeat(40));
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
