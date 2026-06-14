# LabResurrector — Project Plan

> **AI-gestütztes Virtual Lab aus vergessenen Open-Source-Projekten**
> DSH Hacks V1 | AI x STEM Education

---

## 1. Elevator Pitch

> **LabResurrector** verwandelt veraltete Open‑Source‑Physik‑ und Chemie‑Simulationen in ein modernes, AI‑gestütztes Lernlabor.
>
> Ein **pi-Agent** kuratiert und kontextualisiert alte Sim‑Repos, ein **turbovec‑Indexer** macht sie durch RAG durchsuchbar, und Schüler interagieren über ein Chat‑Interface, das Experimente live steuert, erklärt und auf ihrem Niveau anpasst.
>
> **Jeder Schüler weltweit kann ein Physiklabor in der Tasche haben — keine teuren Geräte, keine Chemikalien, kein Risiko. Nur Browser + AI.**

---

## 2. Problem & Zielgruppe

| Faktor | Beschreibung |
|--------|-------------|
| **Problem** | Schulen in ärmeren Regionen haben kein Budget für echte Labore. Selbst in reichen Ländern fehlen individualisierte Erklärungen. |
| **Zielgruppe** | Schüler (12–18), Lehrer, Homeschooler |
| **Existierende Lösungen** | PhET (kein AI‑Layer, kein adaptives Lernen), YouTube (passiv), echte Labore (teuer, gefährlich) |
| **Unser Differenzierungs‑Punkt** | **Learning by Doing** — der Schüler macht das Experiment, der AI erklärt warum |

---

## 3. Lösung: LabResurrector

### User Flow

1. **Schüler wählt Thema**: „Gleichförmige Beschleunigung", „Optische Linsen", „Säure‑Base‑Titration"
2. **LabResurrector sucht im turbovec‑Index** nach passenden Simulations‑Modulen + Erklärtexten (aus PhET, Open Source Physics, ChemLab, eigenen Prompts)
3. **Browser zeigt eingebettete Simulation** (matter.js/p5.js Canvas) + Chat‑Panel
4. **Schüler interagiert**: „Was passiert, wenn ich die Masse verdopple?"
   - Agent manipuliert Sim‑Parameter
   - beobachtet Ergebnis
   - erklärt mit Hilfe der RAG‑Kontexte
5. **Agent stellt adaptive Fragen** und gibt Feedback

### Hackathon-Kriterien-Check

| Kriterium | Wie wir es erfüllen |
|-----------|-------------------|
| **AI x STEM Education** | LLM + RAG für Erklärungen, adaptive Fragen, Live‑Sim‑Steuerung |
| **Meaningful Technical Product** | Echtes interaktives Lab mit AI‑Engine |
| **Interaktivität** | Parameter‑Manipulation in Echtzeit, Live‑Canvas |
| **OSS‑Revival‑Story** | Wiederbelebung toter OSS‑Sim‑Projekte als RAG‑Corpus |
| **Technische Tiefe** | pi‑Agent + turbovec + matter.js + FastAPI + Groq |

---

## 4. Tech Stack

| Komponente | Technologie | Zweck |
|-----------|-------------|-------|
| **Frontend** | HTML/JS + matter.js/p5.js Canvas | Physik‑Simulation im Browser |
| **Backend** | Python FastAPI | Chat‑API, RAG‑Search, Sim‑Control |
| **RAG** | turbovec (TurboQuantIndex) | Vektor‑Index für OSS‑Docs + Formeln |
| **LLM** | Groq API (kostenlos, schnell) | Erklärungen, Fragen, Parameter‑Steuerung |
| **Agent‑Harness** | pi (Research‑Agent für Bootstrap) | OSS‑Repos scannen, kuratieren, indexieren |
| **Deployment** | GitHub Pages (Frontend) + Render/Fly (Backend) | Zero‑Cost Hosting |

---

## 5. OSS-Revival: Verwendete Projekte

Siehe [oss-research.md](./oss-research.md) für das vollständige Katalog.

**Kern‑Repos für MVP:**

| Projekt | Sterne | Lizenz | Status | Unser Use Case |
|---------|--------|--------|--------|---------------|
| [matter-js](https://github.com/liabru/matter-js) | ⭐18k | MIT | Aktiv (2024) | Physik‑Engine für Canvas‑Sims |
| [physics-lab](https://github.com/CamGomezDev/physics-lab) | ⭐23 | — | Unmaintained seit 2020 | p5.js Mechanics‑Sims |
| [ThePhysicsHub](https://github.com/OpenPsiMu/ThePhysicsHub) | ⭐129 | GPL-3.0 | Unmaintained seit 2021 | p5.js Physics‑Lib |
| [ChemLab](https://github.com/thesophile/ChemLab) | ⭐2 | GPL-3.0 | Zuletzt 2026 | Cation Analysis Sim |
| [PhET example-sim](https://github.com/phetsims/example-sim) | ⭐18 | GPL-3.0 | Aktiv (2026) | SceneryStack‑Doku |
| [SkySphere](https://github.com/zonia3000/SkySphere) | ⭐17 | — | Unmaintained seit 2020 | Astronomie‑Canvas |
| [Tracker](https://github.com/OpenSourcePhysics/tracker) | ⭐295 | GPL-3.0 | Aktiv | Video‑Analyse (Post‑MVP) |

---

## 6. pi + turbovec Integration

### pi (Bootstrap‑Phase)
- Workflow: `/web_search` nach OSS‑Repos → `/fetch_content` → generiert source‑cited Summaries
- Input für turbovec‑Index

### pi (Runtime‑Phase)
- „Deep Dive"‑Button in UI → pi‑Research‑Call für echte Uni‑Seiten, Hacking STEM Lessons

### turbovec (RAG‑Motor)
- Python‑Service mit `TurboQuantIndex` / `IdMapIndex`
- Dokumente: README/Docs der OSS‑Sims + eigene Lern‑Prompts + Formeln
- Query → Embed (OpenAI/local) → `index.search(q, k=10)` → beste Chunks
- LLM generiert Antwort + Sim‑Aktion

**Pitch‑Satz:** *„Vollständig lokal, high‑performance, open‑source RAG Stack — keine SaaS‑Abhängigkeit."*

---

## 7. MVP Feature Set (1 Tag)

1. **Frontend**: matter.js Canvas (2 Szenen: Pendel + Schiefer Wurf) + Chat‑Panel + Dropdown
2. **Backend**: FastAPI → `/rag-answer` → RAG + Param‑JSON → `/sim-action` → WebSocket
3. **RAG**: 50–200 Chunks aus OSS‑Docs + eigenen Templates
4. **Agent**: Prompt‑Schema → erklären → nächste Aktion → Verständnisfrage

---

## 8. Nächste Schritte

- [x] `plan/` Ordner mit Project‑Plan, OSS‑Research, Architektur
- [ ] Frontend: HTML‑Struktur + matter.js Canvas + Chat‑UI
- [ ] Backend: FastAPI Boilerplate + Groq‑Integration
- [ ] RAG: turbovec Index erstellen + Embedding‑Service
- [ ] Integration: Chat → RAG → LLM → Sim‑Action
- [ ] README + Devpost: Pitch, Story, Screenshots
