<p align="center">
  <img src="flabs_logo.png" alt="flabs" width="300">
</p>

<h1 align="center">flabs — AI Physics Playground</h1>

<p align="center">
  <b>Interactive physics experiments in your browser. AI runs in your browser. Your API key never touches the server.</b>
</p>

<p align="center">
  <a href="https://github.com/endgegnerbert-tech/lab-resurrector/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-22%2B-339933" alt="Node"></a>
  <a href="https://github.com/endgegnerbert-tech/lab-resurrector"><img src="https://img.shields.io/github/stars/endgegnerbert-tech/lab-resurrector?style=flat" alt="Stars"></a>
  <a href="https://lab-resurrector.onrender.com"><img src="https://img.shields.io/badge/demo-live-40d9b8" alt="Live Demo"></a>
  <a href="https://dsh-hacks-v1.devpost.com"><img src="https://img.shields.io/badge/hackathon-DSH%20Hacks%20V1-7c6cf0" alt="Hackathon"></a>
</p>

<p align="center">
  <a href="#try-it-now">Try It Now</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#features">Features</a> •
  <a href="#security">Security</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#supported-providers">Supported Providers</a> •
  <a href="#quick-start">Quick Start</a>
</p>

---

## Try It Now

**https://lab-resurrector.onrender.com**

Open in any browser. Two experiments included (Water Rocket, Wave Interference). Create your own lab. Enter your API key to activate the AI assistant. Your key stays in your browser.

*No signup. No install. No cost.*

---

## The Problem

9 out of 10 schools in developing countries have no physics lab. Real labs cost over $5,000. Existing digital solutions are passive — they show what happens but don't explain why.

**85% of students have a smartphone. What if the phone was the lab?**

## The Solution

flabs turns any browser into an interactive physics lab with an AI assistant. The AI runs entirely in your browser using your own API key. The server never sees your key.

| Others | flabs |
|--------|-------|
| Simulation plays, student watches | AI asks, student hypothesizes, together they test |
| API keys stored on server | Keys stay in your browser, always |
| Locked to one AI provider | 18+ providers, you choose |
| Requires signup | Zero signup, open in browser |

---

## How It Works

```
                          YOUR BROWSER
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  js/ai/agent.js ────── fetch() ──────> LLM API          │
  │  (your API key here)           OpenAI, Anthropic,       │
  │                                 DeepSeek, Groq...       │
  │       │                                                │
  │       │ tool calls (sim_set_param, sim_reset...)        │
  │       ▼                                                │
  │  Canvas 2D Physics   Chat UI   Data Panel               │
  │                                                         │
  └──────────────────────┬──────────────────────────────────┘
                         │ HTTP (static files + REST)
                         ▼
                     SERVER (Express)
  ┌─────────────────────────────────────────────────────────┐
  │  No pi SDK. No WebSocket. No AI logic.                  │
  │  Serves index.html, experiments/, sources/              │
  │  REST: /api/spaces, /api/health                         │
  └─────────────────────────────────────────────────────────┘
```

**Key property: the server has zero AI dependencies.** It serves static files and manages experiment spaces. The AI agent lives in `js/ai/agent.js` and calls LLM APIs directly from the browser using your key. Your key is never transmitted to the server.

---

## Features

### Water Rocket Lab
Realistic 2-bottle water rocket simulation with real physics:
- **Parameters:** Pressure (1-6 bar), water fill ratio (10-80%), launch angle (10-80 deg)
- **Live data:** Flight time, max height, range, velocity
- **Physics:** Thrust from pressure differential, Tsiolkovsky rocket equation, projectile motion

### Wave Interference Lab
Two coherent point sources with visible superposition:
- **Parameters:** Wavelength, source distance, phase shift, amplitude
- **Live data:** Max deflection, relative intensity, node count
- **Physics:** Superposition principle, constructive/destructive interference

### Lab Space System
- Isolated iframes — each experiment is its own sandboxed HTML page
- postMessage bridge — main app controls params, play/reset, data panel
- Formula panel — shows the math behind the experiment
- Data panel — live measurements with CSV/JSON export
- AI chat — natural language interaction with the lab assistant

---

## AI Tools

The browser-side AI agent exposes these tools to the LLM:

| Tool | What It Does |
|------|-------------|
| `sim_set_param` | Change any physics parameter live (mass, angle, pressure, etc.) |
| `sim_reset` | Reset simulation to defaults |
| `sim_switch_scene` | Switch between experiment types |
| `sim_highlight` | Highlight elements in the simulation |

The agent constructs tool definitions dynamically for each provider's API format (OpenAI-compatible or Anthropic). It handles the full tool-calling round-trip: parse tool calls from the LLM response, execute them locally, and send results back.

---

## Security

**Zero server secrets.** This is not a claim — it is an architectural fact.

- The server has no AI dependencies, no WebSocket, no API key storage
- The AI agent runs entirely in the browser (`js/ai/agent.js`)
- API keys are stored in localStorage and sent directly to LLM APIs via `fetch()`
- The server never receives, stores, or transmits API keys
- Full security model documented in [`SECURITY.md`](SECURITY.md)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Backend | Node.js, Express |
| Frontend | HTML5, CSS3, Canvas 2D API |
| AI Agent | `js/ai/agent.js` (browser-side, fetch-based LLM client) |
| AI Providers | 18+ (OpenAI, Anthropic, DeepSeek, Groq, Google, Together...) |
| Storage | localStorage (API keys), JSON files (experiments, formulas) |
| Deploy | Render (free tier), render.yaml |
| Formats | JSON, CSV |

Zero external frontend dependencies. No React, no Vue, no jQuery. No CDN scripts. All physics is hand-written Canvas 2D.

---

## Supported Providers

| Provider | Format | Models |
|----------|--------|-------|
| OpenAI | OpenAI | GPT-4o, GPT-4o mini, o3, o4-mini |
| Anthropic | Anthropic | Claude Sonnet 4, Haiku 3.5, Opus 4 |
| DeepSeek | OpenAI | V4 Flash ($0.14/$0.28 per 1M tok), V4 Pro |
| Groq | OpenAI | Llama, Mixtral (free tier available) |
| Google | Google | Gemini 2.0 Flash, Pro |
| Together AI | OpenAI | Open-source models |
| Fireworks AI | OpenAI | Fast inference |
| OpenRouter | OpenAI | Meta-provider, 200+ models |
| Mistral | OpenAI | Mistral Large, Small |
| Hugging Face | OpenAI | Community models |
| NVIDIA | OpenAI | NIM inference |
| xAI | OpenAI | Grok |
| Cerebras | OpenAI | Fast, cheap inference |
| Moonshot AI | OpenAI | Kimi models |
| Minimax | OpenAI | MiniMax models |
| Ant-Ling | OpenAI | Code-specialized |

Full provider/model catalog at [`sources/pi-model-catalog.json`](sources/pi-model-catalog.json).

### AI Model Economics

| Model | Input / 1M tok | Output / 1M tok | Best For |
|-------|---------------|----------------|----------|
| DeepSeek V4 Flash | $0.14 | $0.28 | Budget agent tasks |
| Gemini 2.0 Flash | $0.10 | $0.40 | Large context (1M tokens) |
| GPT-4o mini | $0.15 | $0.60 | Balanced quality/price |
| Claude Haiku 3.5 | $1.00 | $5.00 | Reliability |
| DeepSeek V4 Pro | $0.32 | $0.64 | Higher quality reasoning |

*Developed and tested with DeepSeek V4 Flash — the cheapest model with reliable tool calling.* Every user can choose their own price/quality balance.

*Developed and tested with DeepSeek V4 Flash — the cheapest model with reliable tool calling.* Every user can choose their own price/quality balance.

---

## Project Structure

```
flabs/
├── server.js                  # Express static server + REST API
├── index.html                 # Main app (Launchpad + Space View)
├── flabs_logo.png             # Project logo
├── SECURITY.md                # Security model documentation
├── render.yaml                # Render deploy configuration
├── css/
│   └── style.css              # Dark-theme responsive UI
├── js/
│   ├── main.js                # App entry, view switching, API key management
│   ├── ai/agent.js            # Browser-side AI agent (LLM calls from browser)
│   └── experiment/api.js      # Measurement API (live data, CSV/JSON export)
├── experiments/
│   ├── manifest.json          # Space registry
│   └── spaces/
│       ├── rocket/            # Water Rocket lab
│       └── wellen/            # Wave Interference lab
└── sources/
    ├── pi-model-catalog.json  # Full provider/model catalog
    └── formulas/              # Physics formula library
```

---

## Quick Start

### Prerequisites
- Node.js 18+

### Run

```bash
npm install
npm start
# -> http://localhost:3210
```

### Enter Your API Key
Click the key icon in the top bar. Paste your API key. Supported: OpenAI, Anthropic, DeepSeek, Groq, Google, 13+ more.

*Without an API key:* All physics experiments, controls, data panels, and measurements work. Only the AI chat shows a prompt to enter a key.

### Deploy to Render

```bash
git push origin main
# Go to https://dashboard.render.com
# New -> Web Service -> Connect GitHub repo
# Render auto-detects render.yaml
```

---

## Project Status

Built for **[DSH Hacks V1](https://dsh-hacks-v1.devpost.com)** — AI x STEM Education hackathon.

**What works:**
- Two complete physics experiments (Water Rocket, Wave Interference)
- Browser-side AI agent with tool calling (18+ providers)
- Live measurement streaming, data panel, CSV export
- Zero-server-secrets security architecture
- One-click Render deploy

**What is being built:**
- More experiments (pendulum, optics, electricity)
- Experiment builder via AI chat
- Community-contributed experiment spaces

---

## Links

- **Live Demo:** https://lab-resurrector.onrender.com
- **GitHub:** https://github.com/endgegnerbert-tech/lab-resurrector
- **Devpost:** https://dsh-hacks-v1.devpost.com
- **Security:** [SECURITY.md](SECURITY.md)

---

## License

MIT
