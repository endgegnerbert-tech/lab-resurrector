# OSS Research Catalog — LabResurrector

> Open‑Source‑Bildungssoftware für AI‑gestützte Virtual Labs
> Stand: 13. Juni 2026

---

## A. Physics Engines & Frameworks

### 1. matter-js ⭐18.249
| Feld | Wert |
|------|------|
| **URL** | https://github.com/liabru/matter-js |
| **Sprache** | JavaScript |
| **Lizenz** | MIT |
| **Letzter Push** | 2024-08-17 |
| **Status** | Stabil, released, minimale Wartung |
| **Beschreibung** | 2D rigid body physics engine for the web. Unterstützt Polygon‑Kollision, Reibung, Federn, Constraints, Sensoren. Extrem weit verbreitet (>35k npm Downloads/Monat). |
| **Verwendung** | **Primäre Physik‑Engine** für LabResurrector Canvas. Alle Simulationen (Pendel, schiefer Wurf, Hebel, Feder) werden auf matter.js aufgesetzt. |
| **API** | `Engine.create()`, `World.add()`, `Body.applyForce()`, `Body.setPosition()`, `Events.on()` für Live‑Updates |

### 2. p5.js ⭐23.738
| Feld | Wert |
|------|------|
| **URL** | https://github.com/processing/p5.js |
| **Sprache** | JavaScript |
| **Lizenz** | LGPL-2.1 |
| **Letzter Push** | 2026-06-12 |
| **Status** | Sehr aktiv |
| **Beschreibung** | Client‑side JS‑Plattform für kreatives Coding. Basiert auf Processing. |
| **Verwendung** | **Alternative Render‑Engine** für einfachere Sims (Wellen, Optik). Wird auch von mehreren OSS‑Sims genutzt (physics-lab, ThePhysicsHub). |

---

## B. Physics Simulations (Unmaintained / "Tot")

### 3. physics-lab ⭐23
| Feld | Wert |
|------|------|
| **URL** | https://github.com/CamGomezDev/physics-lab |
| **Sprache** | JavaScript (p5.js) |
| **Lizenz** | Keine |
| **Letzter Push** | 2026-04-25 (nach Jahren Pause) |
| **Status** | De facto unmaintained — Google Science Fair Projekt |
| **Beschreibung** | 2D Mechanics‑Sim: Masse, Incline, Gravity, Floor. Eigene Physik‑Engine in `public/js/main.js`. |
| **Verwendung** | **RAG‑Corpus + Code‑Inspiration** für eigene Sims. Die p5.js‑basierte Architektur ist ideal für einfache Mechanics‑Szenen. |

### 4. ThePhysicsHub ⭐129
| Feld | Wert |
|------|------|
| **URL** | https://github.com/OpenPsiMu/ThePhysicsHub |
| **Sprache** | JavaScript (p5.js) |
| **Lizenz** | GPL-3.0 |
| **Letzter Push** | 2021-05-13 |
| **Status** | Unmaintained |
| **Beschreibung** | Clear, free, open‑source physics simulations by a global community. Enthält viele p5.js‑Sims. |
| **Verwendung** | **RAG‑Corpus + Code‑Beispiele**. Die Sims sind besonders gut dokumentiert und didaktisch aufbereitet. |

### 5. Physics Simulations (mqurban) ⭐0
| Feld | Wert |
|------|------|
| **URL** | https://github.com/mqurban/Physics-Simulations |
| **Sprache** | HTML, JavaScript |
| **Lizenz** | Keine |
| **Letzter Push** | 2026-02-23 |
| **Status** | Neu, kleine Sammlung |
| **Beschreibung** | Physics Simulation Library mit purem JavaScript + HTML5 Canvas. Echtzeit‑Parameter. |
| **Verwendung** | **Code‑Inspiration** für Canvas‑Rendering ohne externes Framework. |

---

## C. Chemistry Simulations

### 6. ChemLab ⭐2
| Feld | Wert |
|------|------|
| **URL** | https://github.com/thesophile/ChemLab |
| **Sprache** | JavaScript |
| **Lizenz** | GPL-3.0 |
| **Letzter Push** | 2026-05-10 |
| **Status** | Leicht aktiv |
| **Beschreibung** | Virtual Chemistry Lab für Kationen‑Analyse. Simuliert Nachweisreaktionen in der Chemie. |
| **Topics** | chemistry, lab, portfolio, simulation |
| **Verwendung** | **Post‑MVP**: Chemie‑Modul für LabResurrector. Kationen‑Trenngang als interaktive Simulation. |

### 7. Chemistry Virtual Lab (ushnak-tech) ⭐0
| Feld | Wert |
|------|------|
| **URL** | https://github.com/ushnak-tech/Chemistry-Virtual-Lab |
| **Sprache** | C++ |
| **Lizenz** | Keine |
| **Letzter Push** | 2021-12-02 |
| **Status** | Unmaintained, C++ macht Integration schwer |
| **Beschreibung** | Virtual Chemistry Lab für Schüler und Lehrer. |
| **Verwendung** | **Nicht direkt nutzbar** (C++), aber Konzepte und Experiment‑Design für RAG‑Corpus. |

---

## D. Astronomy

### 8. SkySphere ⭐17
| Feld | Wert |
|------|------|
| **URL** | https://github.com/zonia3000/SkySphere |
| **Sprache** | JavaScript (Canvas) |
| **Lizenz** | NOASSERTION |
| **Letzter Push** | 2020-08-12 |
| **Status** | Unmaintained |
| **Beschreibung** | Lightweight JavaScript sky map. Zeigt Sterne, Planeten, Konstellationen. |
| **Topics** | astronomy, canvas, javascript, sky |
| **Verwendung** | **Post‑MVP**: Astronomie‑Modul. Schüler klicken auf Sterne → AI erklärt. |

---

## E. Biology

### 9. Virtual Biology Lab (Thomas Jones)
| Feld | Wert |
|------|------|
| **URL** | https://virtualbiologylab.org |
| **Sprache** | HTML5 / JavaScript |
| **Lizenz** | Frei nutzbar |
| **Letzter Update** | Unbekannt |
| **Status** | Online, aber unklar ob maintained |
| **Beschreibung** | Biologie‑Simulationen: Ökologie, Evolution, Genetik, Physiologie. |
| **Verwendung** | **Post‑MVP**: RAG‑Corpus für Biologie‑Module. |

### 10. Molecular Workbench (Concord Consortium)
| Feld | Wert |
|------|------|
| **URL** | https://mw.concord.org |
| **Sprache** | Java (klassisch) / HTML5 (modern) |
| **Lizenz** | Open Source |
| **Status** | Historisch, wird durch andere CC‑Tools ersetzt |
| **Beschreibung** | Interaktive Modelle für Physik, Chemie, Biologie auf Molekularebene. |
| **Verwendung** | **RAG‑Corpus**: Didaktisch wertvolle Beschreibungen von Molekularprozessen. |

---

## F. Education Platforms & Tooling

### 11. PhET Interactive Simulations
| Feld | Wert |
|------|------|
| **URL** | https://github.com/phetsims |
| **Sprache** | TypeScript (SceneryStack) |
| **Lizenz** | GPL-3.0 / MIT |
| **Status** | Sehr aktiv (Uni Colorado) |
| **Beschreibung** | >160 interaktive HTML5‑Sims für Physik, Chemie, Bio, Mathe. Goldstandard für edukative Sims. |
| **Repos** | `phetsims/example-sim` (⭐18, TS), `phetsims/ohms-law`, etc. |
| **Verwendung** | **RAG‑Corpus**: READMEs, Doku, pädagogische Konzepte. **Keine direkte Code‑Übernahme** (SceneryStack ist proprietäres Framework). |

### 12. Open Source Physics (OSP) ⭐295
| Feld | Wert |
|------|------|
| **URL** | https://github.com/OpenSourcePhysics |
| **Sprache** | Java (Core) / JavaScript (Tracker Online) |
| **Lizenz** | GPL-3.0 |
| **Status** | Aktiv (Tracker wird maintained) |
| **Beschreibung** | Internationale NSF‑Initiative. Baut Tools für Physik‑Edukation: Tracker (Video‑Analyse), Easy Java Simulations, OSP Core Library. |
| **Verwendung** | **RAG‑Corpus + Code**: Tracker Online ist HTML5/JS, OSP Core Library für Physik‑Formeln und Algorithmen. |

### 13. Tracker Online
| Feld | Wert |
|------|------|
| **URL** | https://opensourcephysics.github.io/tracker-online/ |
| **Beschreibung** | Video analysis and modeling tool. Läuft im Browser. |
| **Verwendung** | **Post‑MVP**: Schüler filmen echte Experimente, AI analysiert via Tracker. |

---

## G. Hackathon / Active Projects (Relevant)

### 14. Double Slit Simulation ⭐10
| Feld | Wert |
|------|------|
| **URL** | https://github.com/emineugurlu/double-slit-simulation |
| **Sprache** | TypeScript/JavaScript |
| **Lizenz** | — |
| **Letzter Push** | 2026-06-06 |
| **Beschreibung** | Interactive Quantum Physics simulation (Doppelspalt). |
| **Verwendung** | **Post‑MVP**: Quantenphysik‑Modul. |

### 15. Visualize-Physics-Math ⭐0
| Feld | Wert |
|------|------|
| **URL** | https://github.com/BANG644/Visualize-Physics-Math |
| **Sprache** | — |
| **Lizenz** | — |
| **Letzter Push** | 2025-11-24 |
| **Beschreibung** | Physik/Mathe Aufgaben → prompts → HTML5 Sim (Multi‑LLM). IPF‑Projekt. |
| **Verwendung** | **Konzeptuell verwandt**: Nutzt LLM zur Sim‑Generierung. Inspiration für Prompt‑Design. |

---

## H. Technologie: pi + turbovec

### pi‑research / pi‑web‑minimal
| Aspekt | Details |
|--------|---------|
| **Zweck** | Web‑Research + Content‑Fetching für OSS‑Repo‑Kuration |
| **Nutzung** | `/web_search` → `/fetch_content` → source‑cited Summaries → turbovec Index |
| **Doku** | https://pi.dev/packages/pi-browse |

### turbovec
| Aspekt | Details |
|--------|---------|
| **Zweck** | Lokaler Vektor‑Index mit TurboQuant. Komprimiert 31GB FP32 auf ~4GB. |
| **API** | `TurboQuantIndex`, `IdMapIndex`, `index.search(q_vec, k=10)` |
| **Framework** | Python‑Bindings, LangChain / LlamaIndex Integration |
| **Nutzung** | RAG für OSS‑Docs + Formeln + Lern‑Prompts |

---

## I. Vergleichstabelle: Alle Kandidaten

| # | Projekt | Domain | ⭐ | Lizenz | Aktiv? | Unser Use‑Case | Priorität |
|---|---------|--------|---|--------|--------|----------------|-----------|
| 1 | matter-js | Physics Engine | 18k | MIT | 2024 | **Primäre Engine** | 🔥 MVP |
| 2 | p5.js | Rendering | 24k | LGPL | Aktiv | **Render‑Engine** | 🔥 MVP |
| 3 | physics-lab | Physics Sim | 23 | — | Unmaintained | **Code + RAG** | 🔥 MVP |
| 4 | ThePhysicsHub | Physics Sim | 129 | GPL-3 | 2021 | **Code + RAG** | 🔥 MVP |
| 5 | PhET (example-sim) | Physics Sim | 18 | GPL | Aktiv | **RAG‑Corpus** | ✅ |
| 6 | OSP / Tracker | Physics Tool | 295 | GPL | Aktiv | **RAG + Code** | ✅ |
| 7 | ChemLab | Chemistry | 2 | GPL | Schwach | **Post‑MVP** | 📌 |
| 8 | SkySphere | Astronomy | 17 | — | 2020 | **Post‑MVP** | 📌 |
| 9 | Virtual Biology Lab | Biology | — | Frei | Unklar | **Post‑MVP** | 📌 |
| 10 | Molecular Workbench | Multi‑Domain | — | OSS | Historisch | **RAG‑Corpus** | 📌 |
| 11 | Double Slit | Quantum | 10 | — | 2026 | **Post‑MVP** | 📌 |

**Legende:** 🔥 MVP = Muss für Day‑1 Demo | ✅ = Nützlich für RAG | 📌 = Post‑MVP

---

## Quellen

- [matter-js GitHub](https://github.com/liabru/matter-js)
- [p5.js GitHub](https://github.com/processing/p5.js)
- [physics-lab GitHub](https://github.com/CamGomezDev/physics-lab)
- [ThePhysicsHub GitHub](https://github.com/OpenPsiMu/ThePhysicsHub)
- [PhET GitHub Org](https://github.com/phetsims)
- [Open Source Physics GitHub Org](https://github.com/OpenSourcePhysics)
- [ChemLab GitHub](https://github.com/thesophile/ChemLab)
- [SkySphere GitHub](https://github.com/zonia3000/SkySphere)
- [Virtual Biology Lab](https://virtualbiologylab.org)
- [Molecular Workbench](https://mw.concord.org)
- [Tracker Online](https://opensourcephysics.github.io/tracker-online/)
