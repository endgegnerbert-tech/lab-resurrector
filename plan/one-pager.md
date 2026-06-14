# flabs -- AI Physics Playground

**DSH Hacks V1 | AI x STEM Education**
**Student:** endgegnerbert-tech
**Demo:** https://lab-resurrector.onrender.com
**GitHub:** https://github.com/endgegnerbert-tech/lab-resurrector

---

## The Core Idea

flabs turns any browser into an interactive physics lab with an AI assistant. No hardware, no installation, no server-side secrets. The AI does not just chat -- it builds experiments, controls parameters, and explains physics using grounded formulas and live cited research.

### How It Works (No Phases, Direct Build)

When a student describes an experiment, the agent acts immediately:

1. Student request reaches the AI agent over WebSocket
2. Agent calls `physics_formula_lookup` + `physics_model_plan` (grounded against a local library of 30+ verified physics formulas from sources like myphysicslab, OSP, matter-js)
3. Agent calls `emet` if the local library is insufficient -- emet fetches cited, authoritative physics knowledge from live sources (arXiv, physics papers, educational databases)
4. Agent writes four files directly into the experiment space: `experiment.json` (parameters + measurements), `index.html` (sandboxed iframe), `sketch.js` (Canvas 2D render loop + physics engine), `sources.json` (license-safe source attribution)
5. Agent calls `space_verify_current` to validate all files before declaring success
6. The experiment is live in the browser immediately -- student adjusts parameters, watches real-time data, and asks follow-up questions

The entire pipeline from student request to running simulation takes seconds. No templates, no pre-built scenes, no multi-phase workflow.

---

## Custom AI Tools (12 tools, all physics-focused)

| Tool | Purpose |
|------|---------|
| `sim_set_param` | Change any physics parameter live (mass, angle, pressure, etc.) |
| `sim_get_state` | Read current simulation state |
| `sim_switch_scene` | Switch between experiment types |
| `sim_reset` | Reset to defaults |
| `sim_highlight` | Highlight elements in the simulation |
| `source_search` | Search the local physics formula library |
| `physics_formula_lookup` | Get grounded formulas with validity limits and units |
| `physics_source_policy` | Check license/usage policy for OSS physics sources |
| `physics_model_plan` | Plan parameters, measurements, and model limits for a concept |
| `emet` | Live cited research (arXiv, papers, educational sources) |
| `space_write_current_file` | Write experiment files (index.html, sketch.js, etc.) |
| `space_verify_current` | Validate all space files after editing |

The agent also has access to built-in pi SDK tools: `bash`, `write`, `edit`, `read`.

---

## Built-in Physics Library

Local formula files in `sources/formulas/`:

- **mechanics.json**: Pendulum period (small + large angle), Hooke's law, Newton's laws, projectile motion, conservation of energy, conservation of momentum, friction, spring oscillation
- **waves.json**: Wave equation, superposition, standing waves, Doppler effect, double-slit interference, single-slit diffraction
- **optics.json**: Snell's law, lens equation, magnification, Brewster's angle, total internal reflection
- **electricity.json**: Ohm's law, Coulomb's law, Kirchhoff's rules, RC circuits, power equation

Each entry includes: formula, variables with units, validity conditions, example calculation, and source IDs with verified license status.

---

## AI Model Economics

The server was built and tested using **DeepSeek V4 Flash**:

- **Input:** $0.14 per million tokens
- **Output:** $0.28 per million tokens
- **Feature support:** function_calling, structured_output (required for tool-using agents)
- **Cached input:** $0.0028 per million tokens (dramatic savings for repeated tool definitions)

DeepSeek V4 Flash is the cheapest model that supports reliable tool calling for agent workflows. **However, the user can choose any model** via the pi SDK:

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|-----------------------|----------|
| DeepSeek V4 Flash | $0.14 | $0.28 | Budget agent tasks |
| Gemini 2.0 Flash | $0.10 | $0.40 | Large context (1M tokens) |
| GPT-4o mini | $0.15 | $0.60 | Balanced quality/price |
| Claude Haiku 3.5 | $1.00 | $5.00 | Reliability |
| DeepSeek V4 Pro | $0.32 | $0.64 | Higher quality reasoning |

The pi SDK supports 50+ providers including OpenAI, Anthropic, DeepSeek, Groq, Google, Ollama (local), Together AI, and more. Every user brings their own API key and picks their preferred price/quality balance.

---

## Architecture

```
Browser (Canvas UI + Chat + Controls)
       | WebSocket (JSON streaming)
Node.js Server (Express + ws + REST API)
       | pi SDK AgentSession
12 Custom Physics Tools + emet + pi built-in tools
       | User's AI Model (DeepSeek, Claude, Gemini, Ollama...)
```

**Key property:** The server holds zero secrets. API keys are set via `authStorage.setRuntimeApiKey()` per browser session -- ephemeral, in-memory, never written to disk.

---

## AI x STEM Education (Judging Criterion)

The agent does not just answer questions. It:

- **Builds experiments from scratch**: writes real Canvas 2D simulation code with correct physics
- **Grounds every claim**: uses local formula library for well-known physics, emet for current/uncertain facts
- **Corrects misconceptions through experiments**: "Mass affects pendulum period?" -- the agent changes mass in the simulation, the student sees the period stays the same, then the agent explains why
- **Adapts to the student's model choice**: the same experiment works with cheap models (DeepSeek Flash for budget) or premium models (Claude Sonnet for deeper explanations)

---

## Unique Architecture: Bring Your Own API Key

No other hackathon project at DSH Hacks V1 does this. The server:

1. Does not store any API keys
2. Does not require users to sign up
3. Does not share keys between users
4. Lets each user decide which model provider they trust

The key is stored in the browser's localStorage, sent over the WebSocket, used ephemerally by the pi SDK, and discarded when the page closes.

---

## Tech Stack

- **pi-coding-agent SDK** -- AI agent with custom tools, session management, model abstraction
- **emet** -- live cited research retrieval for grounded physics answers
- **Node.js 26** -- server runtime
- **Express 4.21** -- HTTP server, REST API
- **ws 8.18** -- WebSocket real-time communication
- **TypeBox** -- runtime type validation for tool parameters
- **Canvas 2D API** -- all physics rendering (zero external engines)
- **HTML5 / CSS3** -- responsive dark-theme UI (zero frameworks)
- **localStorage** -- user API key persistence
- **Render** -- one-click deploy (free tier, render.yaml)
- **DeepSeek V4 Flash** -- development/testing model ($0.14/$0.28 per 1M tokens)

---

## Live Demo

**https://lab-resurrector.onrender.com**

Open in any browser. Two experiments included (Water Rocket, Wave Interference). Create your own lab and describe what you want. Enter your own API key to activate the AI (or explore without AI -- all physics works in demo mode).

---

## Links

- GitHub: https://github.com/endgegnerbert-tech/lab-resurrector
- Render: https://lab-resurrector.onrender.com
- Devpost: https://dsh-hacks-v1.devpost.com
- pi SDK: https://www.npmjs.com/package/@earendil-works/pi-coding-agent
- emet: https://www.npmjs.com/package/@black-knight.dev/emet
