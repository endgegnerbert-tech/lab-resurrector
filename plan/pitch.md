# Pitch — flabs

> DSH Hacks V1 | AI x STEM Education
> June 2026

---

## One-Liner

> *"Every student worldwide can have a physics lab in their pocket. No expensive equipment, no chemicals, no risk. Just a browser + AI."*

---

## Elevator Pitch (60 seconds)

**Problem:** Millions of students worldwide have no access to physics labs. Real labs are expensive, dangerous, and space-intensive. Existing digital solutions like PhET are passive — they show *what* happens but don't explain *why*.

**Our Solution:** **flabs** turns a browser into an interactive physics lab with an AI lab assistant. An AI agent (pi SDK) with custom physics tools controls simulations live — changing parameters, explaining concepts, and guiding students through the scientific process. Every user can bring their own AI model (DeepSeek, Claude, Groq, Ollama…).

**Tech Stack:** Node.js + Express + WebSocket for the server, pi SDK for the AI agent, pure Canvas 2D for physics simulation. All open source, all in the browser.

**Impact:** Learning by Doing — the student makes the experiment, sees what happens, and the AI explains *why*. That's the difference between understanding and memorizing.

---

## Problem & Solution

| Problem | Our Solution |
|---------|-------------|
| 🏫 9/10 schools in developing countries have no physics lab | 🌐 Browser-only, no installation |
| 💰 Real lab costs >$5,000 | 🆓 Free, open source |
| 📱 85% of students have a smartphone | 📱 Runs on any device |
| 🧠 Existing solutions are passive | 🤖 AI guides active learning |

---

## Architecture (Live System)

```
Browser (Canvas UI + Chat)
       ↕ WebSocket (JSON)
Node.js Server (Express + pi SDK)
       ↕ pi Agent Session
Custom Tools (sim_set_param, source_search, physics_formula_lookup, emet…)
       ↕ AI Model (user's choice: DeepSeek, Claude, Groq, Ollama…)
```

### Key Design Decision: Bring Your Own AI

Instead of hardcoding a single model provider, flabs uses the **pi SDK** which supports 50+ models. The user configures their preferred model once, and flabs uses it for all AI interactions. No vendor lock-in, no shared API keys.

---

## Current Labs

### 🚀 Water Rocket (fully implemented)
- Realistic 2-bottle rocket physics: pressure thrust, rocket equation, projectile motion
- Parameters: Pressure (1-6 bar), water ratio, launch angle
- Live: height, range, velocity, flight time
- Formula prediction vs. actual flight

### 🌊 Wave Interference (fully implemented)
- Two coherent point sources, visible superposition
- Parameters: Wavelength, source distance, phase shift, amplitude
- Shows constructive/destructive interference in real-time

### 🧪 Lab Space System
- Each experiment runs in an isolated iframe
- Main app provides controls, data panel, formula panel, AI chat
- postMessage bridge for communication
- Export measurements as CSV/JSON

---

## Demo Script (2 minutes)

1. **Start** → Browser opens, Launchpad shows lab cards
2. **Open Lab** → Click "Water Rocket"
3. **Launch** → Press Play → Rocket flies with real physics
4. **Tweak** → Adjust pressure from 3→5 bar → Launch again → Higher flight
5. **Data** → See live measurements: height, range, velocity
6. **Switch** → Back → Open "Wave Interference" → Adjust wavelength → Pattern shifts

### With AI:
7. **Chat** → "Why does the rocket go higher with more pressure?" → AI explains thrust formula
8. **Experiment** → "Show me 45° vs 30° launch" → AI adjusts angle, compares results

---

## Judging Criteria

| Criterion | How We Address It |
|-----------|------------------|
| **AI x STEM Education** | AI lab assistant + interactive physics + inquiry-based learning |
| **Meaningful Technical Product** | Full-stack: Node.js + WebSocket + pi Agent + Canvas 2D |
| **Interactivity** | Real-time parameter control, live data, streaming AI chat |
| **Innovation** | pi-powered AI agent, bring-your-own-model, space isolation |
| **Impact** | Global science access: browser-only, free, open source |

---

## Links

- **GitHub:** [your-repo-url]
- **Devpost:** https://dsh-hacks-v1.devpost.com
- **Built with:** [pi-coding-agent](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)

---

## Sources

- [PhET Interactive Simulations](https://phet.colorado.edu) — didactic gold standard
- [matter-js](https://github.com/liabru/matter-js) — MIT, physics engine
- [Open Source Physics](https://github.com/OpenSourcePhysics) — GPL-3.0
- [pi coding agent SDK](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
- AIRIS Concept — Heidelberg University of Education (2026)
