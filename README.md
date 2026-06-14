# 🧪 LabResurrector

> **AI-gestütztes Virtual Lab aus vergessenen Open-Source-Projekten**
> DSH Hacks V1 — AI x STEM Education

---

## 📋 Pitch (1 Satz)

> **Jeder Schüler weltweit kann ein Physiklabor in der Tasche haben — keine teuren Geräte, keine Chemikalien, kein Risiko. Nur Browser + AI.**

---

## 🎯 Das Problem

- **9 von 10 Schulen** in Entwicklungsländern haben kein Physiklabor
- Ein echtes Schul-Labor kostet **>$5,000**
- **85% der Schüler** haben aber ein Smartphone
- Bestehende Lösungen (PhET, YouTube) sind **passiv** — sie erklären nicht *warum*

## 💡 Unsere Lösung

**LabResurrector** erweckt vergessene Open-Source-Simulationen zu neuem Leben:

1. Ein **pi-Agent** kuratiert alte, ungepflegte Open-Source-Projekte
2. Ein **turbovec-Vektor-Index** macht ihre Doku + Formeln durchsuchbar (RAG)
3. Eine **matter.js-Physik-Engine** simuliert Experimente live im Browser
4. Ein **Groq-LLM** erklärt wie ein echter Lehrer und steuert die Simulation

### Der entscheidende Unterschied: AI als Experimentleiter

```
❌ Andere:  Simulation läuft → Schüler schaut → Chat-Box rechts "Frag mich was"
✅ Wir:     AI fragt → Schüler hypothetisiert → AI testet in Simulation → Gemeinsame Reflexion
```

**Ohne AI läuft gar nichts.** Die AI steuert alle Parameter, entscheidet was passiert, und führt den Schüler durch den wissenschaftlichen Prozess.

---

## 🧠 Lernmodell: 3 Phasen (Forschungsbasiert)

Basierend auf dem **AIRIS-Konzept** (Pädagogische Hochschule Heidelberg, 2026):

| Phase | Was passiert | Warum es wirkt |
|-------|-------------|----------------|
| **🤔 Hypothese** | Schüler stellt Vermutung auf *bevor* er die Simulation sieht | Kognitive Aktivierung |
| **🔬 Test** | AI führt Experiment gezielt durch, Schüler beobachtet | Inquiry-Based Learning |
| **💡 Reflexion** | Schüler vergleicht Ergebnis mit Hypothese, AI hilft einordnen | Fehlvorstellung korrigieren |

> *„KI-Nutzung, die nur konsumiert ohne eigene Überlegungen anzustellen, führt zu kognitiver Passivität."* — PH Heidelberg

---

## 🔧 Tech Stack

| Komponente | Technologie | Zweck |
|-----------|-------------|-------|
| **Frontend** | HTML/CSS/JS + matter.js | Physik-Simulation im Browser |
| **Backend** | Python FastAPI | Chat-API, RAG-Suche, Sim-Control |
| **RAG** | turbovec (Vector Index) | Physik-Formeln + OSS-Docs |
| **LLM** | Groq (Mixtral/Llama 3) | Erklärungen, Parameter-Steuerung |
| **Agent** | pi (Research-Harness) | OSS-Repos scannen, kuratieren |

---

## 📦 Open-Source-Revival

Wir erwecken **vergessene OSS-Projekte** zu neuem Leben:

### 🏆 MVP (direkt integriert)

| Projekt | ⭐ | Lizenz | Status | Unser Use-Case |
|---------|---|--------|--------|---------------|
| [matter-js](https://github.com/liabru/matter-js) | ⭐18k | MIT | Stabil | Physik-Engine für Canvas |
| [physics-lab](https://github.com/CamGomezDev/physics-lab) | ⭐23 | — | Unmaintained | Mechanics-Code + RAG-Corpus |
| [ThePhysicsHub](https://github.com/OpenPsiMu/ThePhysicsHub) | ⭐129 | GPL-3 | Unmaintained (2021) | p5.js-Sims + Didaktik |

### 📚 RAG-Corpus (Wissen für AI)

| Projekt | ⭐ | Lizenz | Inhalt |
|---------|---|--------|--------|
| [PhET Simulations](https://github.com/phetsims) | ⭐18 | GPL/MIT | >160 pädagogische Sims |
| [Open Source Physics](https://github.com/OpenSourcePhysics) | ⭐295 | GPL-3 | Video-Analyse + OSP Core |
| [ChemLab](https://github.com/thesophile/ChemLab) | ⭐2 | GPL-3 | Kationen-Analyse |

### 🗺️ Post-MVP

| Projekt | Domain | Use-Case |
|---------|--------|----------|
| [SkySphere](https://github.com/zonia3000/SkySphere) | Astronomie | Sternkarten |
| [Virtual Biology Lab](https://virtualbiologylab.org) | Biologie | Ökologie-Sims |
| [Molecular Workbench](https://mw.concord.org) | Multi | Molekulare Modelle |

---

## 🚀 Quick Start

### 1. Frontend

Einfach `index.html` im Browser öffnen (oder `npx serve .` für Lokalhost).

```bash
# Im Projektroot
npx serve .
# → http://localhost:3000
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt

# Optional: Groq API Key für echten AI (sonst Mock-Modus)
export GROQ_API_KEY="gsk_..."

python main.py
# → http://localhost:3210
```

### 3. Nutzung

1. Pendel-Simulation im Canvas beobachten
2. Chat: Frage stellen oder Hypothese eingeben
3. AI antwortet + ändert Parameter live in der Simulation
4. 3-Phasen-Lernmodell: Hypothese → Test → Reflexion

---

## 🧪 Demo-Script (2 Minuten)

1. **Start** → Pendel schwingt, Chat sagt Willkommen
2. **Frage**: *"Was passiert wenn ich die Masse verdopple?"*
3. **AI**: Fragt nach Hypothese → Test → Erklärung
4. **Wechsel**: Dropdown → "Schiefer Wurf"
5. **Frage**: *"Bei welchem Winkel fliegt es am weitesten?"*
6. **AI**: Erklärt 45°-Optimum, startet Simulation

---

## 🏗️ Projektstruktur

```
lab-resurrector/
├── index.html            # Frontend Entry
├── css/style.css         # Dark-Theme UI
├── js/
│   ├── main.js           # App-Init, Verbindungen
│   ├── sim/
│   │   ├── engine.js     # matter.js Wrapper
│   │   ├── pendulum.js   # Pendel-Szene
│   │   └── projectile.js # Schiefer Wurf
│   ├── chat/panel.js     # Chat-UI + 3-Phasen-Logik
│   └── api/client.js     # Backend-API + Mock-Fallback
├── backend/
│   ├── main.py           # FastAPI App
│   ├── requirements.txt
│   ├── rag/
│   │   ├── index.py      # turbovec/numpy RAG
│   │   └── seed_data.py  # 50+ Docs + Formeln
│   ├── llm/groq.py       # Groq Client + Fallback
│   └── sim/manager.py    # Sim-State + Validation
└── plan/                 # Pitch, Architektur, Timeline
```

---

## 🎯 Hackathon-Kriterien

| Kriterium | Wie wir es erfüllen |
|-----------|-------------------|
| **AI x STEM Education** | LLM + RAG + Simulation als Lernmotor |
| **Meaningful Technical Product** | Full-Stack: Frontend + Backend + AI |
| **Interactivity** | Echtzeit-Parameter-Manipulation + Live-Chat |
| **Innovation** | OSS-Revival + AI-als-Experimentleiter |
| **Impact** | Globaler Zugang zu Science Education |

---

## 📚 Quellen & Danksagung

- **PhET Interactive Simulations** — University of Colorado Boulder
- **Open Source Physics** — NSF/Davidson College
- **ThePhysicsHub** — OpenPsiMu Community
- **physics-lab** — CamGomezDev
- **ChemLab** — thesophile
- **matter-js** — liabru
- **AIRIS-Konzept** — PH Heidelberg (2026)

---

## 📄 Lizenz

Dieses Projekt nutzt OSS-Komponenten unter MIT, GPL-3.0 und LGPL-2.1 Lizenzen.
Eigener Code: MIT.
