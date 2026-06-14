# flabs -- AI Physics Playground

**DSH Hacks V1 | AI x STEM Education**
**Demo:** https://lab-resurrector.onrender.com
**GitHub:** https://github.com/endgegnerbert-tech/lab-resurrector

---

## How It Works

No server-side AI. The AI agent runs entirely in the browser. Your API key never leaves your machine.

1. Student requests an experiment via the AI chat
2. The browser-side AI agent (js/ai/agent.js) calls the LLM API directly using the user's own key
3. The agent controls simulation parameters via tool calls (sim_set_param, sim_reset, sim_switch_scene)
4. The server is static-only: Express serves files and provides a REST API for experiment spaces
5. No AI logic, no API keys, no WebSocket on the server

API keys stay in your browser. The server never sees them. This is verified by design in SECURITY.md.

---

## Security Model

- Zero server secrets. The server has no AI dependencies, no WebSocket, no API keys.
- Users enter their key in the browser. The browser calls the LLM API directly via fetch().
- localStorage stores the key. It is never transmitted to the server.

---

## AI Tools (Browser-Side Agent)

| Tool | What It Does |
|------|-------------|
| sim_set_param | Change any physics parameter live (mass, angle, pressure) |
| sim_reset | Reset simulation to defaults |
| sim_switch_scene | Switch between experiment types |
| sim_highlight | Highlight elements in the simulation |

---

## Supported AI Providers (18+)

OpenAI, Anthropic, DeepSeek, Groq, Google, Together AI, Fireworks AI, OpenRouter, Mistral, Hugging Face, NVIDIA, xAI, Cerebras, Moonshot AI, Minimax, Coding (Ant-Ling)

Full provider/model catalog at sources/pi-model-catalog.json.

---

## AI Model Economics

| Model | Input / 1M tok | Output / 1M tok | Best For |
|-------|---------------|----------------|----------|
| DeepSeek V4 Flash | $0.14 | $0.28 | Budget agent tasks |
| Gemini 2.0 Flash | $0.10 | $0.40 | Large context (1M tokens) |
| GPT-4o mini | $0.15 | $0.60 | Balanced quality/price |
| Claude Haiku 3.5 | $1.00 | $5.00 | Reliability |
| DeepSeek V4 Pro | $0.32 | $0.64 | Higher quality reasoning |

---

## Architecture

```
Browser (Canvas UI + Chat + AI Agent)
  |-- js/ai/agent.js calls LLM API directly from browser
  |-- Your API key stays here. Never sent to server.
  |
  | HTTP (REST API for spaces, static files)
  |
Server (Express, static + REST only)
  |-- No pi SDK. No WebSocket. No AI.
  |-- Serves index.html, experiments/, sources/
  |-- REST: /api/spaces, /api/health
```

---

## Included Experiments

- **Water Rocket:** Realistic 2-bottle rocket with pressure thrust, Tsiolkovsky rocket equation, projectile motion. Parameters: pressure (1-6 bar), water ratio (10-80%), launch angle (10-80 deg).
- **Wave Interference:** Two coherent point sources with visible superposition. Parameters: wavelength, source distance, phase shift, amplitude.

---

## Tech Stack

Node.js, Express, Canvas 2D API, HTML5/CSS3, localStorage, Fetch API (browser AI agent), Render, GitHub, DeepSeek V4 Flash, JSON/CSV

Zero external frontend dependencies. No React, no Vue, no jQuery. No CDN scripts. All physics is hand-written Canvas 2D.

---

## Live Demo

https://lab-resurrector.onrender.com

Open in any browser. Two experiments included. Create your own lab. Enter your own API key to activate the AI assistant. Your key stays in your browser.
