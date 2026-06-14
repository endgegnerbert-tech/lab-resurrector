# Timeline — 1‑Tag Build Plan

> **Tag: Samstag, 13. Juni 2026**
> Von 09:00 bis 23:00 (14h)

---

## Phase 1: Foundation (09:00–11:00) 🏗️

### Frontend Boilerplate
- [ ] `index.html` — Grundstruktur: Canvas + Chat Panel + Dropdown
- [ ] `css/style.css` — Layout (Split‑View, Responsive)
- [ ] `js/sim/engine.js` — matter.js Setup (World, Engine, Render)
- [ ] `js/sim/pendulum.js` — Pendel‑Szene (Bob, Rod, Pivot)
- [ ] `js/sim/projectile.js` — Schiefer Wurf (Ball, Ground, Vector)
- [ ] `js/chat/panel.js` — Chat UI (Messages, Input, Send)
- [ ] `js/api/client.js` — Fetch‑Wrapper für Backend

### Backend Boilerplate
- [ ] `backend/main.py` — FastAPI App + CORS
- [ ] `backend/llm/groq.py` — Groq Client
- [ ] `backend/rag/index.py` — turbovec Wrapper (leer)
- [ ] `backend/sim/manager.py` — Sim‑State Logic
- [ ] `requirements.txt` — FastAPI, uvicorn, turbovec, groq, openai

### Deliverable
- ✅ Canvas zeigt Pendel (gravitationsgetrieben)
- ✅ Chat Panel sichtbar, kann POST an Backend
- ✅ Backend antwortet auf `/chat`

---

## Phase 2: RAG + LLM (11:00–14:00) 🧠

### RAG Index befüllen
- [ ] OSS‑Docs scrapen / manuell einpflegen (50–200 Chunks)
- [ ] `backend/rag/seed_data.py` — Seed‑Skript für turbovec
- [ ] Embedding Service (OpenAI `/v1/embeddings` oder lokal)

#### Chunk‑Quellen:
| Quelle | Chunks | Inhalt |
|--------|--------|--------|
| physics‑lab README + Code | 10 | Mechanics Docs |
| ThePhysicsHub Docs | 15 | Physics Tutorials |
| ChemLab README | 5 | Chemistry Basics |
| PhET Doku (example‑sim) | 10 | SceneryStack Konzepte |
| Eigene Formeln | 15 | T=2π√(L/g), s=v₀t+½at², ... |
| Eigene Lehrer‑Prompts | 10 | Didaktische Templates |
| OSP Core Docs | 10 | Formel‑Algorithmen |

### Chat Logic
- [ ] POST `/chat` → Embed → turbovec.search → Groq → Response
- [ ] Prompt‑Schema: Kontext + Sim‑State → Erklärung + Actions
- [ ] JSON‑Parsing der LLM‑Response (Actions extrahieren)

### Deliverable
- ✅ Chat beantwortet "Was ist ein Pendel?" mit RAG‑Context
- ✅ Chat gibt sim_actions zurück

---

## Phase 3: Integration (14:00–17:00) 🔗

### Simulation ← → Chat
- [ ] WebSocket oder Polling für Sim‑Aktionen
- [ ] Chat‑Actions → matter.js Parameter ändern
- [ ] Sim‑State → Chat Context senden

### Experiment Selector
- [ ] Dropdown: Pendel / Schiefer Wurf / Feder
- [ ] Scene‑Switch: Engine clear + neue Bodies
- [ ] Default‑Parameter pro Scene

### UI Polish
- [ ] Loading States (RAG Search, LLM)
- [ ] Error Handling (API Down, No Results)
- [ ] "Typing..." Indicator

### Deliverable
- ✅ Chat ändert Canvas live (z.B. Masse → Pendel langsamer)
- ✅ Scene‑Switch funktioniert

---

## Phase 4: Polish + Pitch Prep (17:00–20:00) ✨

### README & Devpost
- [ ] `README.md` — Full Pitch, OSS‑Revival‑Story, Screenshots
- [ ] Devpost Submission Text
- [ ] Video‑Demo Script

### Testing
- [ ] Flow: Pendel → Frage → Antwort → Parameter → neue Frage
- [ ] Flow: Scene‑Wechsel → Frage → Antwort
- [ ] Edge Cases: Leere Query, Offline, Rate Limit

### (Optional) Chemie‑Modul
- [ ] Wenn Zeit: ChemLab‑Inspirierte "Cation Analysis" Scene
- [ ] Simple HTML‑Canvas Chemistry Sim

### Deliverable
- ✅ README.md mit vollständiger Story
- ✅ Devpost Submission ready
- ✅ Demo stabil

---

## Phase 5: Final Cut (20:00–23:00) 🚀

### Deployment
- [ ] Frontend → GitHub Pages / Vercel
- [ ] Backend → Render / Fly.io
- [ ] CORS + Environment Variables
- [ ] SSL / HTTPS

### Video
- [ ] Screen Recording (2 Minuten)
- [ ] Voiceover oder Text‑Overlay
- [ ] Upload to YouTube / Devpost

### Letzter Check
- [ ] Alle Links funktionieren
- [ ] Demo auf frischem Browser getestet
- [ ] README + Devpost Text final

### Deliverable
- ✅ **Live Demo online**
- ✅ **Devpost Submission complete**
- ✅ **OSS‑Revival‑Story dokumentiert**

---

## Zeitpuffer

| Puffer | Für |
|--------|-----|
| 2h | Unerwartete Bugs (turbovec setup, CORS, Groq Rate Limits) |
| 1h | Kaffee / Pausen / Essen |

---

## Risiken & Mitigation

| Risiko | Mitigation |
|--------|-----------|
| Groq API Rate Limit | Fallback auf einfache Template‑Antworten |
| turbovec Setup zu komplex | Ersatz: Faiss + einfaches Embedding |
| matter.js Physics bugs | Fallback auf p5.js (einfachere API) |
| Deployment Backend | Render Auto‑Deploy von GitHub |
| Zu wenig Zeit für Bio/Astro | Nur Physik + Chemie im MVP |

---

## MVP Scope: YES / NO

| Feature | MVP? |
|---------|------|
| matter.js Pendel | ✅ JA |
| matter.js Schiefer Wurf | ✅ JA |
| Chat Panel | ✅ JA |
| RAG (turbovec) | ✅ JA |
| Groq LLM | ✅ JA |
| Sim‑Action via Chat | ✅ JA |
| Scene‑Selector | ✅ JA |
| Chemie‑Sim | ❌ Post‑MVP |
| Astronomie‑Sim | ❌ Post‑MVP |
| Bio‑Sim | ❌ Post‑MVP |
| pi Runtime‑Deep‑Dive | ❌ Post‑MVP |
| Multi‑User | ❌ Post‑MVP |
