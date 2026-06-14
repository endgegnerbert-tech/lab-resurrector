# Pitch — LabResurrector

> DSH Hacks V1 | AI x STEM Education
> Stand: 13. Juni 2026

---

## One‑Liner

> *"Jeder Schüler weltweit kann ein Physiklabor in der Tasche haben — keine teuren Geräte, keine Chemikalien, kein Risiko. Nur Browser + AI."*

---

## Elevator Pitch (60 Sekunden)

**Problem:** Millionen Schüler weltweit haben keinen Zugang zu Physik‑ und Chemielaboren. Echte Labore sind teuer, gefährlich und platzintensiv. Bestehende digitale Lösungen wie PhET sind passiv — sie erklären nicht *warum* etwas passiert.

**Unsere Lösung:** **LabResurrector** erweckt vergessene Open‑Source‑Simulationen zu neuem Leben. Ein AI‑Agent (pi) kuratiert alte, ungepflegte Open‑Source‑Projekte aus Physik und Chemie, indiziert sie in einem lokalen Vektor‑Speicher (turbovec) und macht sie interaktiv — mit einem Chat‑Interface, das Schülern erklärt, was im Experiment passiert, Parameter live steuert und adaptives Feedback gibt.

**Tech‑Stack:** matter.js für die Physik‑Engine, FastAPI als Backend, Groq für schnelle, kostenlose LLM‑Antworten, turbovec als lokalen RAG‑Index — alles Open Source, alles datenschutzfreundlich.

**Impact:** Learning by Doing — der Schüler macht das Experiment, sieht was passiert, und der AI erklärt *warum*. Das ist der Unterschied zwischen Verstehen und Auswendiglernen.

---

## Pitch Deck (Slides)

### Slide 1: Titel
- **LabResurrector**
- AI‑gestütztes Virtual Lab aus toten OSS‑Projekten
- DSH Hacks V1

### Slide 2: Das Problem
- 🏫 9 von 10 Schulen in Entwicklungsländern haben kein Physiklabor
- 💰 Ein Schul‑Labor kostet >$5000
- 📱 Aber: 85% der Schüler haben ein Smartphone
- 🧠 Bestehende Lösungen (PhET, YouTube) sind *passiv*

### Slide 3: Unsere Lösung
```
┌─────────────────────────────────────┐
│  🎮 Interaktive Simulation          │
│  ┌────────────────┐ ┌─────────────┐ │
│  │  Pendel-Sim    │ │ 💬 Chat AI │ │
│  │  [●●○○○○○]     │ │ "Warum     │ │
│  │  Masse: 2kg    │ │  schwingt  │ │
│  │  Länge: 1.5m   │ │  es immer  │ │
│  └────────────────┘ │  gleich?"  │ │
│                      │ → Erklärung│ │
│                      │ + Parameter│ │
│                      │ ändern ✓  │ │
│                      └─────────────┘ │
└─────────────────────────────────────┘
```

### Slide 4: Die OSS‑Revival‑Story
Wir erwecken tote Open‑Source‑Projekte wieder:
- **physics-lab** (⭐23, unmaintained seit 2020) → Mechanics‑Sim
- **ThePhysicsHub** (⭐129, unmaintained seit 2021) → p5.js‑Sammlung
- **ChemLab** (⭐2, GPL-3.0) → Cation Analysis

→ Ihre READMEs, Doks und Formeln werden zum RAG‑Corpus

### Slide 5: Der AI‑Stack
```
User: "Was passiert wenn ich die Masse verdopple?"

  ↓ turbovec (lokal, schnell) 
  → findet relevante Formeln + Doku

  ↓ Groq (kostenlos, <100ms)
  → generiert Erklärung + Steuerbefehle

  ↓ matter.js (Browser)
  → Simulation läuft mit neuen Werten

  ↓ pi Agent (für Bootstrap)
  → scannt OSS‑Repos → befüllt Index
```

### Slide 6: Warum gewinnen wir?
| Andere Teams | Wir |
|-------------|-----|
| GPT‑Chat + Quiz → passiv | **Interaktive Simulation** → aktiv |
| Lernplan‑Generator → kein Experiment | **Learning by Doing** |
| Flashcard‑App → Auswendiglernen | **Konzept‑Verständnis** |
| SaaS‑abhängig | **Open Source + lokal** |

### Slide 7: 1‑Tag MVP
- ✅ matter.js Canvas mit 2 Szenen (Pendel, Schiefer Wurf)
- ✅ Chat‑Panel + Agent mit RAG
- ✅ 50+ Dokument‑Chunks in turbovec
- ✅ Groq LLM für Erklärungen
- ✅ pi‑Agent für OSS‑Kuration

### Slide 8: Vision
**LabResurrector** als Plattform:
1. **Physik** → Pendel, Optik, Elektromagnetismus
2. **Chemie** → Kationen‑Analyse, Moleküle
3. **Biologie** → Evolution, Genetik
4. **Astronomie** → Sternkarten, Planeten

Alles AI‑gestützt, alles Open Source, für jeden zugänglich.

---

## Judging Criteria Mapping

| Kriterium | Wie wir es adressieren |
|-----------|----------------------|
| **AI x STEM Education** | LLM + RAG für Adaptive Learning + Simulation |
| **Meaningful Technical Product** | Full‑Stack: Frontend (Canvas) + Backend (FastAPI) + AI (Groq + RAG) |
| **Interactivity** | Echtzeit‑Parameter‑Manipulation, Live‑Canvas, Chat |
| **Innovation** | OSS‑Revival + Local‑RAG + Agent‑gesteuerte Kuration |
| **Impact** | Globaler Zugang zu Science Education, kein Budget nötig |

---

## Demo Script

### 1. Start (10s)
- Seite laden → Pendel-Simulation im Canvas
- Chat Panel: "Willkommen bei LabResurrector!"

### 2. Erste Frage (20s)
- User tippt: "Was passiert wenn ich die Masse verdopple?"
- Canvas zeigt Pendel mit Masse m=1kg
- AI antwortet + setzt m=2kg + Pendel schwingt langsamer ✓

### 3. Zweite Interaktion (20s)
- User: "Und bei kürzerem Seil?"
- AI: Erklärt T = 2π√(L/g) → setzt L=1m → Pendel schwingt schneller ✓

### 4. Themenwechsel (10s)
- Dropdown → "Schiefer Wurf"
- Neue Simulation im Canvas
- Chat: "Welchen Winkel für maximale Weite?"

---

## Quellen

- [DSH Hacks V1 Devpost](https://dsh-hacks-v1.devpost.com)
- [PhET Interactive Simulations](https://phet.colorado.edu)
- [matter.js GitHub](https://github.com/liabru/matter-js)
- [Open Source Physics](https://github.com/OpenSourcePhysics)
- [turbovec](https://www.youtube.com/watch?v=ZEPeSIJQXTE)
- [pi research tools](https://github.com/drsh4dow/pi-web-minimal/)
