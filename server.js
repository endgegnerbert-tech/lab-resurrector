/**
 * server.js — LabResurrector pi Agent Server
 * 
 * Verbindet Browser (WebSocket) mit pi SDK.
 * pi hat custom Tools um die Simulation live zu steuern.
 * 
 * Architektur:
 *   Browser (matter.js + Chat UI) 
 *       ↕ WebSocket (JSON)
 *   Node.js Server (Express + WebSocket)
 *       ↕ pi SDK (AgentSession)
 *   pi Agent (custom Tools + bash/write/edit/read)
 * 
 * Wichtig: sim_ask_question BLOCKT bis der Schüler antwortet.
 * Der Schüler kriegt die Frage, tippt Antwort, pi sieht sie.
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';
import { Type } from 'typebox';
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

// ── Globals ────────────────────────────────────
let wss = null;
let currentSession = null;
let isProcessing = false;
let messageQueue = [];
let pendingQuestionResolve = null; // Für blocking sim_ask_question

// ── Simulation State ────────────────────────────
let simState = {
  scene: 'pendulum',
  params: { mass: 2, length: 4, angle: 45, gravity: 9.81 },
};

// ── Broadcast ──────────────────────────────────
function broadcast(data) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { client.send(msg); count++; }
  });
  return count;
}

// ── Custom Tools ───────────────────────────────
function createCustomTools() {
  return [
    // ── Parameter live setzen ──────────────
    defineTool({
      name: 'sim_set_param',
      description: 'Ändert einen Parameter in der live Simulation im Browser.\n' +
        'Pendel: mass(1-10), length(1-8), angle(5-85), gravity(1-20)\n' +
        'Wurf: angle(5-85), speed(5-50), mass(1-10), gravity(1-20)',
      parameters: Type.Object({
        name: Type.String({ description: 'Parametername' }),
        value: Type.Number({ description: 'Neuer Wert' }),
      }),
      execute: async (_tid, p) => {
        simState.params[p.name] = p.value;
        broadcast({ type: 'sim_set_param', name: p.name, value: p.value });
        return { content: [{ type: 'text', text: `✅ ${p.name} = ${p.value}` }], details: {} };
      },
    }),

    // ── Zustand abfragen ──────────────────
    defineTool({
      name: 'sim_get_state',
      description: 'Gibt aktuellen Simulations-Zustand zurück.',
      parameters: Type.Object({}),
      execute: async () => ({
        content: [{ type: 'text', text: JSON.stringify(simState, null, 2) }],
        details: simState,
      }),
    }),

    // ── Szene wechseln ────────────────────
    defineTool({
      name: 'sim_switch_scene',
      description: 'Wechselt die Szene: pendulum (Pendel) oder projectile (Schiefer Wurf).',
      parameters: Type.Object({
        scene: Type.String({ description: 'pendulum oder projectile' }),
      }),
      execute: async (_tid, p) => {
        const defaults = {
          pendulum: { mass: 2, length: 4, angle: 45, gravity: 9.81 },
          projectile: { angle: 45, speed: 20, mass: 2, gravity: 9.81 },
        };
        if (!defaults[p.scene]) {
          return { content: [{ type: 'text', text: `❌ Unbekannt: ${p.scene}` }], isError: true };
        }
        simState = { scene: p.scene, params: defaults[p.scene] };
        broadcast({ type: 'sim_switch_scene', scene: p.scene, params: defaults[p.scene] });
        return { content: [{ type: 'text', text: `✅ Szene: ${p.scene}` }], details: simState };
      },
    }),

    // ── Reset ────────────────────────────
    defineTool({
      name: 'sim_reset',
      description: 'Setzt Simulation auf Standard-Parameter zurück.',
      parameters: Type.Object({}),
      execute: async () => {
        const defaults = {
          pendulum: { mass: 2, length: 4, angle: 45, gravity: 9.81 },
          projectile: { angle: 45, speed: 20, mass: 2, gravity: 9.81 },
        };
        simState.params = { ...defaults[simState.scene] };
        broadcast({ type: 'sim_reset', params: simState.params });
        return { content: [{ type: 'text', text: '✅ Reset' }], details: simState };
      },
    }),

    // ── Highlight ────────────────────────
    defineTool({
      name: 'sim_highlight',
      description: 'Hebt ein Element in der Simulation hervor.',
      parameters: Type.Object({
        element: Type.String({ description: 'bob, rod, ball, ground, velocity_vector' }),
      }),
      execute: async (_tid, p) => {
        broadcast({ type: 'sim_highlight', element: p.element });
        return { content: [{ type: 'text', text: `✅ ${p.element} highlighted` }], details: {} };
      },
    }),

    // ── BLOCKING: Frage an Schüler ──────
    defineTool({
      name: 'sim_ask_question',
      description: '📨 Sendet eine Frage an den Schüler und WARTET auf seine Antwort. ' +
        'Der Schüler sieht die Frage, überlegt, tippt seine Antwort — dann bekommst du sie. ' +
        'NUTZE DIESES TOOL UM MIT DEM SCHÜLER ZU INTERAGIEREN.',
      parameters: Type.Object({
        text: Type.String({ description: 'Die Frage' }),
        type: Type.Optional(Type.String({ description: 'Fragentyp: question, prompt, hint' })),
      }),
      execute: async (_tid, p) => {
        // Sende Frage an Browser
        broadcast({ type: 'sim_ask_question', text: p.text, msgType: p.type || 'question' });
        
        // BLOCKE bis Schüler antwortet
        const answer = await new Promise((resolve) => {
          pendingQuestionResolve = resolve;
        });

        broadcast({ type: 'sim_question_answered' });

        return {
          content: [{ type: 'text', text: `📨 Schüler antwortet: ${answer}` }],
          details: { question: p.text, answer },
        };
      },
    }),

    // ── References research ────────────────
    defineTool({
      name: 'sim_research',
      description: '📚 Durchsucht die references/ Ordner nach Code-Inspiration. ' +
        'Liest READMEs und Schlüsseldateien der OSS-Projekte um zu verstehen ' +
        'wie sie Simulationen aufbauen (Engine, Parameter, UI).\n' +
        'Rufe DIESES TOOL auf, bevor du ein neues Experiment baust!',
      parameters: Type.Object({
        projekt: Type.String({
          description: 'Welches Projekt: physics-lab, phet-example-sim, ThePhysicsHub, ChemLab, matter-js'
        }),
        fokus: Type.String({
          description: 'Was willst du lernen? (z.B. "Wie werden Parameter gesteuert?", "Physik-Engine Setup"})'
        }),
      }),
      execute: async (_tid, p) => {
        broadcast({ type: 'tool_start', tool: 'sim_research', args: p });

        const pfade = {
          'physics-lab': ['README.md', 'public/js/main.js'],
          'phet-example-sim': ['README.md', 'package.json'],
          'ThePhysicsHub': ['README.md'],
          'ChemLab': ['README.md'],
          'matter-js': ['README.md'],
        };

        const dateien = pfade[p.projekt] || ['README.md'];
        let resultat = `## ${p.projekt}\n\n`;

        for (const datei of dateien) {
          const pfad = `references/${p.projekt}/${datei}`;
          try {
            const content = fs.readFileSync(pfad, 'utf-8');
            resultat += `### ${datei}\n\n\`\`\`\n${content.substring(0, 3000)}\n\`\`\`\n\n`;
          } catch (e) {
            resultat += `### ${datei}\n*(nicht gefunden)*\n\n`;
          }
        }

        return {
          content: [{ type: 'text', text: resultat.substring(0, 4000) }],
          details: { projekt: p.projekt, dateien },
        };
      },
    }),

    // ── Neues Experiment bauen ────────────
    defineTool({
      name: 'sim_build_experiment',
      description: '🔧 BAUE EIN NEUES EXPERIMENT als eigenständigen Ordner in experiments/.\n' +
        'VORHER: sim_research aufrufen um Code-Inspiration zu holen!\n' +
        '1. sim_research("physics-lab") — verstehe die Architektur\n' +
        '2. write experiments/<name>/index.html — schreibe das Experiment\n' +
        '3. bash("npx serve . &") — Teste ob es läuft\n' +
        '4. Sag dem Schüler Bescheid',
      parameters: Type.Object({
        name: Type.String({ description: 'Ordnername, z.B. feder-schwinger' }),
        titel: Type.String({ description: 'Titel für Menschen' }),
        konzept: Type.String({ description: 'Physik-Konzept' }),
        engine: Type.String({ description: 'matter-js oder p5.js' }),
      }),
      execute: async (_tid, p) => {
        broadcast({ type: 'sim_build_start', name: p.name, titel: p.titel, engine: p.engine });
        return {
          content: [{ type: 'text', text: `🔧 Baue Experiment "${p.titel}" in experiments/${p.name}/

WORKFLOW:
1. 📚 sim_research("physics-lab") → Code-Inspiration holen (MACH DAS VORHER!)
2. ✍️  write experiments/${p.name}/index.html → mit matter.js/p5.js CDN
3. 📦 write experiments/${p.name}/sketch.js → Physik-Logik
4. 🖥️  bash("npx serve . &") → Server starten
5. ✅ Sag dem Schüler: "Fertig! Schau unter /experiments/${p.name}/"

NUTZE references/ als Code-Inspiration!` }],
          details: { ordner: `experiments/${p.name}` },
        };
      },
    }),
  ];
}

// ── OSS Knowledge ──────────────────────────────
function getOSSKontext() {
  return `
WISSEN AUS OPEN-SOURCE-PHYSIK-PROJEKTEN (nutze als Inspiration):

1. PhET Interactive Simulations (Uni Colorado)
   - 160+ HTML5-Sims, GPL/MIT, https://github.com/phetsims
   - Forschungsbasiert, pädagogisch getestet

2. physics-lab (CamGomezDev)
   - p5.js Mechanics-Sim, https://github.com/CamGomezDev/physics-lab
   - Masse, Incline, Gravity, Floor als Parameter

3. Open Source Physics (OSP, NSF)
   - Tracker Video-Analyse, OSP Core Library
   - https://github.com/OpenSourcePhysics

4. ThePhysicsHub (OpenPsiMu, GPL-3.0)
   - Community p5.js-Simulationen
   - Mechanik, Wellen, Optik

5. ChemLab (thesophile, GPL-3.0)
   - Kationen-Analyse Simulation

PHYSIK-FORMELN:
- Pendel: T = 2π√(L/g) — Masse irrelevant!
- Wurf: R = v₀²sin(2θ)/g, max bei 45°
- Newton: F = m·a
- Energie: E_ges = E_pot + E_kin = konst.

DIDAKTIK (PH Heidelberg 2026):
AIRIS: 1) Kognitive Aktivierung → Hypothese
2) Inquiry → Experiment
3) Reflexion → Ergebnis einordnen

TYPISCHE FEHLVORSTELLUNGEN:
- "Schwere fallen schneller" → FALSCH
- "Masse beeinflusst Pendel" → FALSCH
- "Kraft nötig für Bewegung" → FALSCH
`;
}

// ── Prompt Builder ────────────────────────────
function buildAgentPrompt(message) {
  return `Du bist LabResurrector, AI-Physik-Lehrer und Experimentleiter.

AKTUELLE SIMULATION:
- Szene: ${simState.scene}
- Parameter: ${JSON.stringify(simState.params)}

DEINE WERKZEUGE:
1. **sim_ask_question** — Frage den Schüler (blockt bis Antwort)
   NUTZE DIESES TOOL FÜR JEDE FRAGE!

2. **sim_set_param** — Ändere Parameter LIVE (mass, length, angle, gravity, speed)

3. **sim_switch_scene** — Wechsle Szene (pendulum, projectile)

4. **sim_highlight** — Hebe Element hervor (bob, rod, ball, ground, velocity_vector)

5. **sim_reset** — Standardwerte

6. **sim_research** — 📚 Durchsuche references/ nach Code-Inspiration
   - IMMER VOR sim_build_experiment aufrufen!
   - Beispiel: sim_research("physics-lab", "Wie werden Parameter gesteuert?")

7. **sim_build_experiment** — 🔧 BAUE NEUES EXPERIMENT in experiments/
   - Vorher: sim_research! Dann: write + bash
   - Nutze matter.js CDN für Physik-Engine
   - Struktur: experiments/<name>/index.html + sketch.js

📂 REFERENZEN zum Lernen (nutze sim_research!):
- references/physics-lab/ → p5.js + Mechanics, super für Parameter-Steuerung
- references/phet-example-sim/ → PhET SceneryStack, moderne TS-Struktur
- references/ThePhysicsHub/ → p5.js Community, viele Beispiele
- references/ChemLab/ → Chemie-Simulation, UI-Struktur
- references/matter-js/README.md → matter.js 2D Physics Engine Docs

📂 NEUE EXPERIMENTE in experiments/<name>/

BAUPLAN FÜR EXPERIMENTE:
1. sim_research("physics-lab", "Engine-Setup") → Code-Inspiration
2. write experiments/<name>/index.html → HTML-Struktur mit CDNs
3. write experiments/<name>/sketch.js → Physik-Logik + Parameter
4. bash("npx serve . &") → Test
5. bash("curl http://localhost:3210/experiments/<name>/") → Check
6. sim_set_param → Teste ob Parameter live gehen
7. Sag Schüler Bescheid!

PERSÖNLICHKEIT:
- Begeistert von Physik, will Schüler zum Staunen bringen
- Sokratische Methode: fragen → experimentieren → reflektieren
- Deutsch, einfach, klar (12-18 Jahre)
- Fehlvorstellungen mit EXPERIMENTEN korrigieren, nicht belehren

${getOSSKontext()}

SCHÜLER: ${message}`;
}

// ── Message Queue Verarbeitung ──────────────────
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
      console.error('❌ pi Fehler:', err.message);
      broadcast({ type: 'chat_error', text: `Fehler: ${err.message}` });
    }
  }

  isProcessing = false;
}

// ── Main ────────────────────────────────────────
async function main() {
  console.log('🧪 LabResurrector — pi Agent Server');
  console.log('='.repeat(40));

  // ── Auth & Model ──────────────────────────────
  const authStorage = AuthStorage.create();
  const modelRegistry = ModelRegistry.create(authStorage);
  const available = await modelRegistry.getAvailable();

  // Wähle ein Modell das Tool-Calling unterstützt
  // DeepSeek V4 Flash funktioniert zuverlässig mit openai-completions API
  let selectedModel = null;
  
  // Bevorzugt: DeepSeek (getestet mit custom tools)
  selectedModel = available.find(m => m.provider === 'deepseek' && m.name === 'DeepSeek V4 Flash');
  
  // Fallback: erstes openai-codex Model
  if (!selectedModel) {
    selectedModel = available.find(m => m.provider === 'openai-codex');
  }
  
  // Fallback: beliebiges Model
  if (!selectedModel && available.length > 0) {
    selectedModel = available[0];
  }

  if (!selectedModel) {
    console.log('⚠️  Kein API-Key gefunden!');
    console.log('   Starte im Demo-Modus — nur lokale Mock-Antworten.');
  } else {
    console.log(`✅ Modell: ${selectedModel.name} (${selectedModel.provider}, ${selectedModel.api})`);
  }

  // ── Express + WebSocket ──────────────────────
  const app = express();
  const server = createServer(app);
  wss = new WebSocketServer({ server });

  app.use(express.static(__dirname));
  app.use('/sims', express.static(join(__dirname, 'sims')));
  app.use('/experiments', express.static(join(__dirname, 'experiments')));
  app.use('/references', express.static(join(__dirname, 'references')));

  // ── API Routes ────────────────────────────────
  const EXPERIMENTS_DIR = join(__dirname, 'experiments');

  // GET /api/spaces — Liste aller Spaces aus dem Manifest
  app.get('/api/spaces', (_req, res) => {
    const manifestPath = join(EXPERIMENTS_DIR, 'manifest.json');
    try {
      const data = fs.readFileSync(manifestPath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.json({ spaces: [] });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // GET /api/spaces/:id/manifest — Manifest eines einzelnen Space
  app.get('/api/spaces/:id/manifest', (req, res) => {
    const spaceId = req.params.id;

    // Path traversal protection: nur kebab-case erlaubt
    if (!/^[a-z][a-z0-9-]*$/.test(spaceId)) {
      return res.status(400).json({ error: 'Invalid space ID' });
    }

    const spaceDir = join(EXPERIMENTS_DIR, 'spaces', spaceId);
    const manifestPath = join(spaceDir, 'experiment.json');

    // Sicherstellen, dass der Pfad innerhalb von EXPERIMENTS_DIR bleibt
    const resolved = resolve(manifestPath);
    if (!resolved.startsWith(EXPERIMENTS_DIR)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const data = fs.readFileSync(manifestPath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.status(404).json({ error: 'Space not found' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // ── pi Session ───────────────────────────────
  const { session } = await createAgentSession({
    model: selectedModel,
    thinkingLevel: 'off',
    authStorage,
    modelRegistry,
    customTools: createCustomTools(),
    tools: [
      'read', 'bash', 'write', 'edit', 'grep', 'find', 'ls',
      'sim_set_param', 'sim_get_state', 'sim_switch_scene',
      'sim_reset', 'sim_highlight', 'sim_ask_question',
      'sim_research', 'sim_build_experiment',
    ],
    sessionManager: SessionManager.inMemory(),
    settingsManager: SettingsManager.inMemory({
      compaction: { enabled: false },
      retry: { enabled: true, maxRetries: 2 },
    }),
  });
  currentSession = session;

  console.log('✅ pi Agent Session gestartet');
  if (session.model) {
    console.log(`   Modell: ${session.model.name || session.model.id}`);
  }

  // ── pi Events → Browser ──────────────────────
  session.subscribe((event) => {
    switch (event.type) {
      case 'message_update': {
        const d = event.assistantMessageEvent;
        if (d.type === 'text_delta') broadcast({ type: 'chat_delta', text: d.delta });
        if (d.type === 'thinking_delta' && d.delta) {
          broadcast({ type: 'chat_thinking', text: d.delta });
        }
        break;
      }
      case 'tool_execution_start':
        broadcast({ type: 'tool_start', tool: event.toolName, args: event.args });
        break;
      case 'tool_execution_end':
        broadcast({ type: 'tool_end', tool: event.toolName, isError: event.isError });
        break;
      case 'agent_start': broadcast({ type: 'agent_start' }); break;
      case 'compaction_start':
        broadcast({ type: 'tool_start', tool: 'compaction' });
        break;
      case 'compaction_end':
        broadcast({ type: 'tool_end', tool: 'compaction' });
        break;
    }
  });

  // ── WebSocket Handler ────────────────────────
  wss.on('connection', (ws) => {
    console.log('🔌 Browser verbunden');
    ws.send(JSON.stringify({ type: 'sim_state', state: simState }));
    ws.send(JSON.stringify({ type: 'info', text: 'Verbunden mit pi Agent Server' }));

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'chat_message': {
            const text = msg.text.trim();
            if (!text) return;

            // Wenn eine Frage vom Agenten wartet → antworten
            if (pendingQuestionResolve) {
              const resolve = pendingQuestionResolve;
              pendingQuestionResolve = null;
              resolve(text);
              broadcast({ type: 'chat_user', text });
              return;
            }

            // Normale Nachricht → in die Queue
            broadcast({ type: 'chat_user', text });
            messageQueue.push(text);
            processQueue();
            break;
          }

          case 'sim_state_update':
            if (msg.state) Object.assign(simState.params, msg.state);
            break;

          case 'sim_scene_changed':
            if (msg.scene) simState.scene = msg.scene;
            break;
        }
      } catch (err) {
        console.error('❌ WS Fehler:', err.message);
      }
    });

    ws.on('close', () => console.log('🔌 Browser getrennt'));
  });

  // ── Start ─────────────────────────────────────
  server.listen(PORT, () => {
    console.log('='.repeat(40));
    console.log(`🚀  http://localhost:${PORT}`);
    console.log(`🤖  ${session.model?.name || 'Demo-Modus'}`);
    console.log(`🔧  Tools: sim_set_param, sim_ask_question, + bash/write/edit`);
    console.log(`📡  WebSocket: ws://localhost:${PORT}`);
    console.log('='.repeat(40));
  });
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
