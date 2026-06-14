# flabs — AI Physics Playground

> Interactive physics experiments in the browser. AI runs in your browser. Your API key never touches the server.
> DSH Hacks V1 — AI x STEM Education

---

## One-Liner

> Every student worldwide can have a physics lab in their pocket. No expensive equipment, no chemicals, no risk. Just a browser + AI.

---

## The Problem

- 9 out of 10 schools in developing countries have no physics lab
- A real school lab costs >$5,000
- 85% of students have a smartphone
- Existing solutions are passive — they show what happens but dont explain why

## Our Solution

flabs turns a browser into an interactive physics lab. The AI runs entirely in your browser using your own API key. The server never sees your key — it only serves static files and manages experiment spaces.

### Key Difference: AI as Lab Partner

```
Others: Simulation plays -> Student watches -> Chat box "Ask me anything"
Ours:   AI asks -> Student hypothesizes -> AI tests in simulation -> Together they reflect
```

### Security Model

**Your API key never leaves your browser.** The browser-side AI agent (js/ai/agent.js) calls the LLM API directly via fetch(). The server is a static file server with a REST API for experiment spaces. No WebSocket. No pi SDK on the server. No AI logic on the server.

This is verified by design in SECURITY.md.

---

## Features

### Water Rocket Lab
Realistic physics simulation of a 2-bottle water rocket:
- Parameters: Pressure (1-6 bar), water fill ratio (10-80%), launch angle (10-80 deg)
- Live data: Flight time, max height, range, velocity
- Physics: Thrust from pressure differential, Tsiolkovsky rocket equation, projectile motion

### Wave Interference Lab
Two coherent point sources, visible superposition pattern:
- Parameters: Wavelength, source distance, phase shift, amplitude
- Live data: Max deflection, relative intensity, node count
- Physics: Superposition principle, constructive/destructive interference

### Lab Space System
- Isolated iframes — each experiment is its own HTML page
- postMessage bridge — main app controls params, play/reset, data panel
- Formula panel — shows the math behind the experiment
- Data panel — live measurements with CSV/JSON export
- AI chat — natural language interaction with the lab assistant

### Bring Your Own AI (18+ Providers)
- No API keys hardcoded. No server-side keys.
- Supported providers: OpenAI, Anthropic, DeepSeek, Groq, Google, Together AI, Fireworks, OpenRouter, Mistral, Hugging Face, NVIDIA, xAI, Cerebras, Moonshot AI, Minimax, and more.
- Every user enters their own key in the browser. It stays there.
- Full model catalog at sources/pi-model-catalog.json
- Developed and tested with DeepSeek V4 Flash ($0.14/$0.28 per 1M tokens)

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | HTML/CSS/JS + Canvas 2D | Physics simulation in browser |
| Backend | Node.js + Express | Static files + REST API for spaces |
| AI Agent | js/ai/agent.js (browser-side) | LLM API calls from browser using user key |
| AI Providers | 18+ (OpenAI, Anthropic, DeepSeek, Groq...) | User chooses their model |
| Physics Engine | Pure Canvas 2D | Experiment simulation (no dependencies) |
| Custom Tools | sim_set_param, sim_reset, sim_switch_scene, sim_highlight | AI controls the simulation live |

Zero external frontend dependencies. No React, no Vue, no jQuery. No CDN scripts. All physics is hand-written Canvas 2D.

### Architecture

```
Browser
  |-- js/ai/agent.js calls LLM API directly from browser
  |-- Your API key stays here. Never sent to server.
  |
  | HTTP (REST API for spaces, static files)
  |
Server (Express, static + REST only)
  |-- No pi SDK. No WebSocket. No AI.
  |-- Serves index.html, experiments/, sources/
  |-- REST: GET/POST/DELETE /api/spaces
  |-- Health: GET /api/health
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
Click the key icon in the top bar. Paste your API key. The AI agent runs in your browser using your key. Supported providers:
- OpenAI (sk-...)
- Anthropic (sk-ant-...)
- DeepSeek (sk-...)
- Groq (gsk_...)
- Google (AIza...)
- 13+ more

Without an API key: all physics experiments, controls, data panels, and measurements work. Only the AI chat shows a prompt to enter a key.

---

## How the AI Agent Works

The browser-side AI agent (js/ai/agent.js) is a complete, self-contained LLM client:

1. User enters API key -> stored in localStorage
2. User types a message -> agent constructs the prompt with system instructions + tool definitions
3. Agent calls the LLM API directly from the browser via fetch()
4. LLM responds with text + optional tool calls (sim_set_param, sim_reset, etc.)
5. Agent executes tools locally and sends results back to the LLM
6. Response streams to the chat panel

The server never participates in this loop. It only serves the page and manages experiment spaces.

---

## AI Model Economics

| Model | Input / 1M tok | Output / 1M tok | Best For |
|-------|---------------|----------------|----------|
| DeepSeek V4 Flash | $0.14 | $0.28 | Budget agent tasks |
| Gemini 2.0 Flash | $0.10 | $0.40 | Large context |
| GPT-4o mini | $0.15 | $0.60 | Balanced quality/price |
| Claude Haiku 3.5 | $1.00 | $5.00 | Reliability |
| DeepSeek V4 Pro | $0.32 | $0.64 | Higher quality reasoning |

---

## Included Experiments

| Lab | Parameters | Physics |
|-----|-----------|---------|
| Water Rocket | Pressure (1-6 bar), Water ratio (10-80%), Angle (10-80 deg) | Thrust from pressure differential, rocket equation, projectile motion |
| Wave Interference | Wavelength, Source distance, Phase shift, Amplitude | Superposition, constructive/destructive interference |

---

## Project Structure

```
flabs/
  server.js                  # Express static server + REST API (no AI)
  index.html                 # Main app
  css/style.css              # Dark-theme responsive UI
  js/
    main.js                  # App entry, view switching
    ws/client.js             # WebSocket client
    chat/panel.js            # Chat panel
    experiment/api.js        # Measurement API
    ai/agent.js              # Browser-side AI agent (LLM calls from browser)
  experiments/
    manifest.json            # Space registry
    spaces/
      rocket/                # Water Rocket lab
      wellen/                # Wave Interference lab
  sources/
    pi-model-catalog.json    # Full provider/model catalog
    formulas/                # Physics formula library
  SECURITY.md                # Security model documentation
  render.yaml                # Render deploy configuration
```

---

## Security

Read SECURITY.md for the full security model. Key points:
- Server has no AI dependencies, no WebSocket, no API key storage
- AI agent runs in the browser
- API keys stored in localStorage, sent directly to LLM APIs via fetch()
- Server serves static files and manages experiment spaces only

---

## Deploy to Render

```bash
# Push to GitHub
git push origin main

# Go to https://dashboard.render.com
# New -> Web Service -> Connect GitHub repo
# Render auto-detects render.yaml
# Deploy
```

Live at: https://lab-resurrector.onrender.com

> ⚠️ **Render free tier** spins down after ~15 min of inactivity. The first load after sleep takes 30-60s (cold start).

### 🛌 Prevent cold starts (2 min, free)

Use [cron-job.org](https://cron-job.org) — free, no credit card:

1. Sign up at [cron-job.org](https://cron-job.org)
2. **New Cron Job:**
   - URL: `https://lab-resurrector.onrender.com/api/health`
   - Interval: **every 5 minutes**
   - Save

Done. Your service stays awake permanently.

Alternative: [UptimeRobot](https://uptimerobot.com) (free, 50 monitors, 5 min interval).
