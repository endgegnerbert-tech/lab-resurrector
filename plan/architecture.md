# Architecture — LabResurrector

> System‑Design für das AI‑gestützte Virtual Lab
> Stand: 13. Juni 2026

---

## 1. High‑Level Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Frontend)                     │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │  Canvas (matter.js)│  │       Chat Panel            │  │
│  │  Physics Sim      │  │  ┌─────────────────────────┐ │  │
│  │  ┌──────────────┐ │  │  │ User: "Was passiert    │ │  │
│  │  │ Pendel       │ │  │  │ wenn ich m verdopple?"  │ │  │
│  │  │ Schiefer Wurf│ │  │  ├─────────────────────────┤ │  │
│  │  │ Feder        │ │  │  │ AI: "Die Periodendauer │ │  │
│  │  └──────────────┘ │  │  │ wird länger, weil...   │ │  │
│  └──────────────────┘  │  │ [ Parameter geändert ✓ ]│ │  │
│                         │  └─────────────────────────┘ │  │
│  ┌──────────────────┐  │                               │  │
│  │  Experiment      │  │  ┌────────────────────────┐   │  │
│  │  Selector        │  │  │ Deep Dive (pi) Button│   │  │
│  └──────────────────┘  │  └────────────────────────┘   │  │
│  ┌──────────────────┐  │                               │  │
│  │  Parameter       │  │  ┌────────────────────────┐   │  │
│  │  Sliders         │  │  │ Live Parameter Display │   │  │
│  └──────────────────┘  │  └────────────────────────┘   │  │
└──────────┬───────────────────────┬──────────────────────┘
           │ WebSocket / Fetch     │ Fetch
           ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                     │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ /chat       │  │ /rag-answer  │  │ /sim-action      │ │
│  │ POST        │  │ POST         │  │ POST             │ │
│  ├─────────────┤  ├──────────────┤  ├──────────────────┤ │
│  │ Orchestrator│  │ RAG + LLM   │  │ Sim-State Manager│ │
│  └──────┬──────┘  └──────┬───────┘  └──────────────────┘ │
│         │                │                               │
│         ▼                ▼                               │
│  ┌─────────────────────────────────────────┐              │
│  │          Groq API (LLM)                 │              │
│  │  Mistral / Llama 3 / Gemma2             │              │
│  └─────────────────────────────────────────┘              │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────────────────────────────────┐              │
│  │       turbovec RAG Index                 │              │
│  │  ┌──────────┬──────────┬──────────────┐ │              │
│  │  │ OSS Docs │ Formeln  │ Lern-Prompts │ │              │
│  │  │ (50-200  │ (Physik  │ (Lehrer-     │ │              │
│  │  │  Chunks) │ Formeln) │  Templates)  │ │              │
│  │  └──────────┴──────────┴──────────────┘ │              │
│  └─────────────────────────────────────────┘              │
│                                                           │
│  ┌─────────────────────────────────────────┐              │
│  │  pi Agent (Bootstrap)                    │              │
│  │  /web_search → /fetch_content           │              │
│  │  → generate source-cited summaries      │              │
│  │  → feed into turbovec index             │              │
│  └─────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## 2. API Definition

### POST `/chat`
```
Request:
{
  "message": "Was passiert wenn ich die Masse verdopple?",
  "sim_id": "pendulum",
  "sim_state": {"mass": 1, "length": 2, "angle": 30}
}

Response:
{
  "reply": "Wenn du die Masse verdoppelst...",
  "sim_actions": [
    {"type": "setParam", "name": "mass", "value": 2.0},
    {"type": "resetSim"}
  ],
  "rag_sources": ["phet_pendulum.md", "formel_T.png"]
}
```

### POST `/rag-answer`
```
Request:
{
  "query": "Was ist die Formel für Periodendauer eines Pendels?",
  "top_k": 5
}

Response:
{
  "answer": "T = 2π √(L/g)",
  "chunks": [
    {"id": "formel_T", "text": "T = 2π √(L/g)...", "score": 0.92},
    {"id": "phet_pendulum", "text": "...", "score": 0.87}
  ]
}
```

### POST `/sim-action`
```
Request:
{
  "sim_id": "pendulum",
  "actions": [
    {"type": "setParam", "name": "mass", "value": 2.0},
    {"type": "setParam", "name": "gravity", "value": 9.81},
    {"type": "resetSim"}
  ]
}

Response:
{
  "success": true,
  "sim_state": {"mass": 2.0, "gravity": 9.81, "angle": 0}
}
```

---

## 3. Datenfluss: Chat → Aktion

```
User: "Was passiert wenn ich die Masse verdopple?"

  ↓
  
1. Backend empfängt Chat + sim_state
  
2. RAG Search:
   - Embed query → turbovec.search(k=5)
   - Chunks: Formeln, Pendel-Doku, verwandte Konzepte

3. LLM Prompt (Groq):
   """
   Kontext:
   {rag_chunks}
   
   Sim-Status: mass=1.0, length=2.0, angle=30°
   User: "Was passiert wenn ich die Masse verdopple?"
   
   Antworte als Physik-Lehrer. Gib:
   1. Erklärung (deutsch, einfach)
   2. sim_actions (JSON-Liste von Parameter-Änderungen)
   """

4. Response:
   - reply Text → Chat Panel
   - sim_actions → WebSocket → matter.js Engine

5. matter.js Engine updated Parameter:
   - setze mass = 2.0
   - reset Simulation (oder Live-Update)
   - beobachte neues Verhalten
```

---

## 4. Prompt Engineering (Agent Schema)

### System Prompt
```
Du bist LabResurrector, ein AI-Physik-Lehrer.
Du interagierst mit Schülern über ein interaktives Physik-Labor.

VERHALTEN:
- Erkläre Physik-Konzepte einfach und intuitiv
- Beziehe dich auf die aktuelle Simulation
- Formuliere 1-2 Verständnisfragen am Ende
- Gib präzise sim_actions um Parameter zu ändern

sim_actions FORMAT:
[
  {"type": "setParam", "name": "<param>", "value": <number>},
  {"type": "setParam", "name": "<param>", "value": <number>},
  {"type": "resetSim"}
]
```

### Chat Loop Prompt
```
RAG Kontext:
{chunks}

Simulations-Status:
{sim_state}

Letzte Nachrichten:
{history}

Schüler: {message}

--- 
Antworte als JSON:
{
  "reply": "(deine Antwort)",
  "sim_actions": [...]
}
```

---

## 5. RAG Index Struktur

```
turbovec/
├── documents/
│   ├── physics/
│   │   ├── formeln_pendel.txt        # T = 2π √(L/g)
│   │   ├── formeln_wurf.txt          # s = v₀t + ½at²
│   │   ├── formeln_optik.txt         # 1/f = 1/g + 1/b
│   │   └── ...
│   ├── oss_docs/
│   │   ├── phet_pendulum_readme.md
│   │   ├── physics_lab_docs.md
│   │   ├── the_physics_hub_docs.md
│   │   └── ...
│   ├── tutorials/
│   │   ├── lehrer_prompt_vorlagen.md
│   │   └── konzept_erklaerungen.md
│   └── sim_states/
│       ├── pendulum_default.json
│       ├── projectile_default.json
│       └── spring_default.json
```

---

## 6. Frontend Komponenten

```
lab-resurrector/
├── index.html          # Main entry
├── css/
│   ├── style.css       # Layout, Chat, Canvas
│   └── sim-theme.css   # Sim-spezifische Styles
├── js/
│   ├── main.js         # App-Init, Router
│   ├── sim/
│   │   ├── engine.js   # matter.js Setup + Loop
│   │   ├── pendulum.js # Pendel-Szene
│   │   ├── projectile.js # Schiefer Wurf
│   │   └── spring.js   # Feder-Schwinger
│   ├── chat/
│   │   ├── panel.js    # Chat-UI
│   │   └── actions.js  # Parameter-Commits
│   └── api/
│       └── client.js   # Fetch → Backend
└── backend/
    ├── main.py          # FastAPI App
    ├── rag/
    │   ├── index.py     # turbovec Wrapper
    │   └── embed.py     # Embedding Service
    ├── llm/
    │   └── groq.py      # Groq Client
    └── sim/
        └── manager.py   # Sim-State Logic
```

---

## 7. Deployment

| Komponente | Hosting | Kosten |
|-----------|---------|--------|
| Frontend (HTML/JS) | GitHub Pages / Vercel | Kostenlos |
| Backend (FastAPI) | Render / Fly.io | Kostenlos (Hobby Plan) |
| RAG (turbovec) | Embedded im Backend | — |
| LLM | Groq API | Kostenlos (Rate Limited) |
| pi-Agent | Lokal (Dev) | — |

---

## 8. Sicherheit & Limits

- **Rate Limiting**: 10 Requests/min pro User (Groq Free Tier)
- **Input Sanitization**: Keine direkte Code‑Ausführung aus Chat
- **Sim-Sandboxing**: matter.js läuft im Browser — keine Server‑Side Rendering
- **CORS**: Nur Frontend‑Domain erlaubt
- **RAG‑Fallback**: Wenn turbovec keine Treffer → LLM erklärt aus eigenem Wissen

---

## 9. Post‑MVP Erweiterungen

- **Multi‑User**: WebSocket‑Räume für Klassen
- **Chemie‑Modul**: ChemLab‑Integration + Molekül‑Viewer (Three.js)
- **Astronomie‑Modul**: SkySphere‑Integration
- **Bio‑Modul**: Virtual Biology Lab Sim‑Embeds
- **pi‑Deep‑Dive**: Research‑Button für echte externe Quellen
- **Sprach‑Support**: Mehrsprachige Erklärungen
- **Progress‑Tracking**: Lernfortschritt pro Schüler
