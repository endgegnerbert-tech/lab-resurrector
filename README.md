# 🥼 flabs — AI Physics Playground

> **Interactive physics experiments in the browser — powered by an AI lab assistant**
> DSH Hacks V1 — AI x STEM Education

---

## 📋 One-Liner

> **Every student worldwide can have a physics lab in their pocket. No expensive equipment, no chemicals, no risk. Just a browser + AI.**

---

## 🎯 The Problem

- **9 out of 10 schools** in developing countries have no physics lab
- A real school lab costs **>$5,000**
- **85% of students** have a smartphone
- Existing solutions (PhET, YouTube) are **passive** — they show *what* happens, but don't explain *why*

## 💡 Our Solution

**flabs** turns a browser into an interactive physics lab with an AI lab assistant:

1. A **pi Agent** (Node.js SDK) powers an AI assistant that understands physics
2. **Browser-based spaces** run isolated physics experiments (matter.js / Canvas 2D)
3. The **AI controls the simulation live** — changes parameters, explains concepts, guides inquiry
4. **Every user brings their own AI model** — pi SDK supports 50+ models (DeepSeek, Claude, Gemini, Groq, Ollama…)

### The Key Difference: AI as Lab Partner

```
❌ Others: Simulation plays → Student watches → Chat box on the side "Ask me anything"
✅ Ours:   AI asks → Student hypothesizes → AI tests in simulation → Together they reflect
```

**Without AI, nothing happens.** The AI controls every parameter, decides what to show, and guides the student through the scientific process.

---

## 🧠 Learning Model: 3 Phases (Research-Based)

Based on the **AIRIS concept** (Heidelberg University of Education, 2026):

| Phase | What Happens | Why It Works |
|-------|-------------|--------------|
| **🤔 Hypothesis** | Student makes a prediction *before* seeing the simulation | Cognitive activation |
| **🔬 Test** | AI runs the experiment, student observes | Inquiry-based learning |
| **💡 Reflection** | Student compares result with hypothesis, AI helps interpret | Correct misconceptions |

> *"AI use that only consumes without independent thinking leads to cognitive passivity."* — PH Heidelberg

---

## ✨ Features

### 🚀 Water Rocket Lab
Realistic physics simulation of a 2-bottle water rocket:
- **Parameters:** Pressure (1-6 bar), water fill ratio (10-80%), launch angle (10-80°)
- **Live data:** Flight time, max height, range, velocity
- **Predictions:** Formula-based range/height estimate vs. actual flight
- **Physics:** Thrust from pressure differential, rocket equation for delta-v, projectile motion

### 🌊 Wave Interference Lab
Two coherent point sources, visible superposition pattern:
- **Parameters:** Wavelength, source distance, phase shift, amplitude
- **Live data:** Max deflection, relative intensity, node count
- **Physics:** Superposition principle, constructive/destructive interference

### 🧪 Lab Space System
- **Isolated iframes** — each experiment is its own HTML page
- **postMessage bridge** — main app controls params, play/reset, data panel
- **Formula panel** — shows the math behind the experiment
- **Data panel** — live measurements with CSV/JSON export
- **AI chat** — natural language interaction with the lab assistant

### 🔌 Bring Your Own AI
- No API keys hardcoded — **pi SDK** manages model selection
- Supports **50+ models**: DeepSeek, Claude, Gemini, Groq (Llama/Mixtral), Ollama (local), OpenAI…
- Every user can plug in their **own model** via `pi settings`
- Falls back to **demo mode** with local physics-only interaction if no AI configured

---

## 🔧 Tech Stack (Actual — what really runs)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | HTML/CSS/JS + Canvas 2D | Physics simulation in browser |
| **Backend** | Node.js + Express + WebSocket (`ws`) | Server, API, real-time streaming |
| **Agent SDK** | `@earendil-works/pi-coding-agent` | AI agent with custom physics tools |
| **AI Models** | pi-managed (DeepSeek, Claude, Groq, Ollama…) | Student selects their preferred model |
| **Live Research** | `@black-knight.dev/emet` | Cited physics knowledge retrieval |
| **Physics Engine** | Pure Canvas 2D / matter.js | Experiment simulation |
| **Custom Tools** | `sim_set_param`, `source_search`, `physics_model_plan`, … | AI controls the lab directly |

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser                                        │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │  Launchpad    │  │  Space View            │   │
│  │  (Card Grid)  │  │  ┌────────────────┐   │   │
│  │               │  │  │  iframe        │   │   │
│  │  + New Lab ───┼──┼─>│  (experiment)  │   │   │
│  │  Card Click ──┼──┼─>│                │   │   │
│  └──────────────┘  │  │  sketch.js     │   │   │
│                    │  │  (Canvas 2D)   │   │   │
│                    │  └───────┬────────┘   │   │
│                    │          │ postMessage │   │
│                    │  ┌───────┴────────┐   │   │
│                    │  │  Sidebar        │   │   │
│                    │  │  🎛 Controls    │   │   │
│                    │  │  📐 Formula     │   │   │
│                    │  │  📊 Data Panel  │   │   │
│                    │  │  💬 AI Chat     │   │   │
│                    │  └────────────────┘   │   │
│                    └────────────────────────┘   │
│                         ↕ WebSocket (JSON)      │
├─────────────────────────────────────────────────┤
│  Node.js Server                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │  Express (REST API)                        │ │
│  │  • GET/POST/DELETE /api/spaces             │ │
│  │  • Static files (experiments/, sources/)   │ │
│  └──────────────┬──────────────────────────────┘ │
│                 ↕                                │
│  ┌──────────────┴──────────────────────────────┐ │
│  │  pi Agent Session                           │ │
│  │  • Custom Tools: sim_set_param, source_…    │ │
│  │  • Tools: bash, write, edit, read           │ │
│  │  • emet for live cited research             │ │
│  │  • Model-agnostic (user's choice)           │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- (Optional) **pi CLI** installed for model management

### 1. Install & Run

```bash
# Install dependencies
npm install

# Start the server
npm start

# → http://localhost:3210
```

### 2. Connect Your Model (to activate the AI)

flabs works with 50+ AI models. No API key is hardcoded in the server. After opening the app, click the **key icon** in the top bar, then:
- choose your **provider** first (required by the pi SDK)
- choose a **model** for that provider
- paste your **API key**

Examples:
- OpenAI (`sk-...`)
- Anthropic (`sk-ant-...`)
- DeepSeek (`sk-...`)
- Groq (`gsk_...`)
- Google (`AIza...`)
- or another supported pi SDK provider

By default, your key stays only for the current browser session. You can explicitly choose **Remember on this device** to keep it in localStorage. In all cases, the key is sent to the flabs server in memory only and is never written to disk by flabs.

**Without an API key:** The app works in full demo mode. All physics experiments, controls, data panels, measurements and exports work. Only the AI chat stays inactive.

### 3. Use the Lab

1. **Create a lab** → Click "+ New Lab", give it a name
2. **Describe your experiment** → Tell the AI what you want to explore
3. **Tweak controls** → Use the sliders on the right, watch the simulation update live
4. **Track measurements** → See real-time data in the Data panel
5. **Export** → Download measurements as CSV or JSON

---

## Demo Script (2 Minutes)

1. Start -> Open http://localhost:3210
2. Create Lab -> "+ New Lab" -> "Water Rocket"
3. Launch -> Press Play -> Watch the rocket fly with real physics
4. Tweak -> Adjust pressure (3->5 bar) -> Launch again -> See higher flight
5. Switch -> Back to Launchpad -> Open "Wave Interference"
6. Explore -> Change wavelength, watch interference pattern shift

---

## Try It Live

A deployed instance may be running at your Render URL. To deploy your own:

1. Push this repo to GitHub
2. Create a Render account (free tier, no credit card required)
3. Connect your GitHub repo -> Web Service
4. Set: Build Command = `npm install`, Start Command = `node server.js`
5. Deploy (~2 minutes)

Render's free tier puts the server to sleep after 15 minutes of inactivity. The first visit after sleep takes 30-60 seconds to wake up (cold start).

## Project Structure

```
flabs/
├── server.js              # Node.js server (Express + WebSocket + pi Agent)
├── package.json           # Dependencies (ESM module)
├── index.html             # Main app (Launchpad + Space View)
├── css/
│   └── style.css          # Dark theme, responsive UI
├── js/
│   ├── main.js            # App entry, view switching, state management
│   ├── ws/client.js       # WebSocket client with mock fallback
│   ├── chat/panel.js      # AI chat panel (streaming, markdown)
│   └── experiment/api.js  # Measurement API (CSV export, live data)
├── experiments/
│   ├── manifest.json      # Space registry
│   └── spaces/
│       ├── rocket/         # 🚀 Water Rocket lab
│       │   ├── experiment.json  # Parameter definitions, formulas
│       │   ├── index.html       # Isolated iframe entry
│       │   ├── sketch.js        # Physics + rendering
│       │   └── sources.json     # Source attribution
│       └── wellen/         # 🌊 Wave Interference lab
│           ├── experiment.json
│           ├── index.html
│           ├── sketch.js
│           └── sources.json
├── sources/
│   ├── catalog.json       # OSS source registry
│   └── formulas/          # Physics formula library
│       ├── mechanics.json
│       ├── waves.json
│       ├── optics.json
│       └── electricity.json
├── builder/
│   ├── schemas/           # Experiment JSON schemas
│   └── templates/         # Space templates (matter-basic, p5-basic)
└── plan/                  # Architecture docs, pitch, research notes
```

---

## 🧪 How It Works: Custom AI Tools

The AI assistant has direct access to these tools:

| Tool | What it does |
|------|-------------|
| `sim_set_param` | Changes a physics parameter (mass, angle, pressure) live in the browser |
| `sim_switch_scene` | Switches between experiment types (pendulum, projectile, etc.) |
| `sim_reset` | Resets simulation to defaults |
| `sim_highlight` | Highlights elements in the simulation |
| `source_search` | Searches the local physics formula library |
| `physics_formula_lookup` | Returns grounded formulas with validity limits |
| `physics_source_policy` | Checks license/usage policy for OSS physics sources |
| `physics_model_plan` | Plans a complete experiment before building a Space |
| `emet` | Live cited research for current/uncertain physics questions |
| `space_get_current` | Checks which lab space is selected |
| `space_write_current_file` | Writes experiment code (index.html, sketch.js, etc.) |
| `space_verify_current` | Validates space files after editing |

---

## 🎮 How to Try It Yourself

This is a **real, running application**. Here's exactly how to experience it:

### Quick Start (5 minutes)

```bash
# 1. Clone & install
git clone <your-repo-url>
cd flabs
npm install

# 2. Start the server
npm start
# → http://localhost:3210
```

That's it. Open `http://localhost:3210` in your browser.

### What You'll See

**Step 1: The Launchpad** 🚀
A dark-themed grid with lab cards. Click any existing lab or hit **"+ New Lab"** to create your own.

**Step 2: Open a Lab** 🔬
Click "Water Rocket" or "Wave Interference". The view splits into:
- **Left:** A canvas with the physics simulation running live
- **Right sidebar:** Control sliders, formula panel, data panel, and AI chat

**Step 3: Tweak Parameters** 🎛
Drag the sliders (pressure, water ratio, launch angle for the rocket) — the simulation **updates instantly**. Watch the data panel track every measurement.

**Step 4: Chat with the AI** 💬
Type a question or hypothesis in the chat box. The AI responds and can **change parameters live** — for example:
> *"Set pressure to 5 bar and launch at 60°"* → the sliders move, the rocket flies

Note: for browser-provided API keys, you must choose the provider first. pi does **not** safely infer the provider from a raw key string.

### Without an AI Model (Demo Mode)

If you don't have a pi API key configured, the app runs in **demo mode**:
- ✅ All physics experiments work fully
- ✅ Parameters, data panel, formula panel all functional
- ✅ Chat gives friendly generic responses
- ⚡ You can still explore every lab

### With Your Own AI Model

flabs uses the **pi SDK** which supports 50+ model providers. Configure one:

```bash
# List available model providers
pi models available

# Set your preferred model
pi settings set model "claude-sonnet-4-20250514"
# or: pi settings set model "deepseek-chat"
# or: pi settings set model "ollama/llama3"

# Restart flabs
npm start
```

Every user brings their own model. No shared API keys. No vendor lock-in.

### Full Playground: Try Both Labs

| Lab | What to Try | What You'll Learn |
|-----|------------|-------------------|
| 🚀 **Water Rocket** | Vary pressure 2→5 bar at 45° | Thrust ∝ ΔP, range ∝ v²sin(2θ)/g |
| | Compare water ratio 20% vs 50% | Optimal mass ratio for max height |
| | Launch at 30° vs 60° | Trade-off between range and height |
| 🌊 **Wave Interference** | Change wavelength 40→120px | Constructive vs destructive spacing |
| | Adjust source distance | Interference fringe density |
| | Add phase shift | Pattern shifts laterally |

### Create Your Own Lab

Click **"+ New Lab"** → name it → describe what you want in the chat. The AI can help build a custom experiment by writing the space files for you.

### Export Your Data

Every lab session streams live measurements. Click **"Export CSV"** to download the raw data and analyze it yourself.

---

## 🏆 Hackathon Judging Criteria

| Criterion | How We Address It |
|-----------|------------------|
| **AI x STEM Education** | AI lab assistant + adaptive physics experiments + inquiry-based learning |
| **Meaningful Technical Product** | Full-stack: Node.js + WebSocket + pi Agent + Canvas 2D simulations |
| **Interactivity** | Real-time parameter control, live measurements, streaming AI chat |
| **Innovation** | pi-powered AI agent as lab partner, bring-your-own-model architecture |
| **Impact** | Global access to science education — browser-only, free, open source |

### What makes flabs different

| Others | flabs |
|--------|-------|
| GPT chat + quiz → passive | **Interactive simulation** → active learning |
| Learning plan generator → no experiment | **Learning by doing** with live physics |
| Flashcard app → memorization | **Conceptual understanding** through experimentation |
| SaaS-dependent | **Bring your own AI model** — open, not locked in |
| Fixed model provider | **50+ models supported** via pi SDK |

---

## 📚 Sources & Acknowledgments

- **PhET Interactive Simulations** — University of Colorado Boulder (didactic gold standard)
- **matter-js** (MIT) — Physics engine inspiration
- **Open Source Physics** — NSF/Davidson College
- **ThePhysicsHub** (GPL-3.0) — p5.js simulation patterns
- **physics-lab** — CamGomezDev (inspiration)
- **ChemLab** (GPL-3.0) — Chemistry simulation reference
- **AIRIS Concept** — Heidelberg University of Education (2026)

---

## 📄 License

This project uses OSS components under MIT, GPL-3.0, and LGPL-2.1 licenses.
Own code: MIT.

Built with [`@earendil-works/pi-coding-agent`](https://www.npmjs.com/package/@earendil-works/pi-coding-agent) — the SDK for AI agents with custom tools.

---

> **DSH Hacks V1** — AI x STEM Education  
> June 2026
