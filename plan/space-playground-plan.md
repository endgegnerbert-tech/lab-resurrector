# LabResurrector — Fester Plan: AI Space Playground

Stand: 2026-06-14

## 1. Kernvision

LabResurrector ist kein Menü aus starren Simulationen.

Es ist ein **AI-Lab-Playground**:

> Ein Schüler beschreibt frei im Chat, welches Physik-Experiment er verstehen oder bauen will. Die KI fragt nach, nutzt vorbereitete Open-Source-Bausteine und Physik-Wissen, erzeugt einen isolierten Experiment-Space und zeigt Simulation, Messdaten, Formel und Rechnung.

Ziel: Menschen ohne Labor, Geräte oder Geld können Physik experimentell erleben — nur mit Browser + AI.

## 2. Festgelegte Produktentscheidungen

| Frage | Entscheidung |
|---|---|
| Live GitHub-Zugriff? | Nein. Repos werden vorbereitet und lokal als Quellen/Bausteine verfügbar gemacht. |
| Fachbereich MVP | Nur Physik. |
| User Input | Frei. User kann alles schreiben; KI entscheidet, ob sie nachfragt, erklärt oder baut. |
| Spaces | Dauerhaft gespeichert, im Menü wieder öffnbar. |
| Isolation | Jeder Space ist komplett getrennt von anderen Spaces. |
| Code sichtbar? | Nein, erstmal nicht. |
| Experimente | So breit wie möglich aus den vorbereiteten Physik-OSS-Repos. |
| UI | Labor-App mit Chat, nicht ChatGPT mit kleiner Preview. |
| Quellen/Lizenzen in UI | Erstmal nicht sichtbar für Schüler; intern aber gespeichert. |

## 3. Was „jedes Experiment bauen“ realistisch bedeutet

Wenn der Agent gute Bausteine hat, kann er sehr viele Experimente erzeugen — aber nicht magisch jedes beliebige reale Labor.

**Machbar im MVP-Zielraum:**
- Mechanik: Pendel, Wurf, Feder, Hebel, Kollisionen, Reibung, Kreisbewegung
- Wellen: Interferenz, stehende Wellen, Doppler, Resonanz
- Optik: Linsen, Spiegel, Brechung, Strahlenmodell
- Elektrizität: einfache Stromkreise, Ohmsches Gesetz, RC-Ladung
- Thermodynamik/Statistik: einfache Gas-/Teilchenmodelle
- Moderne Physik vereinfacht: Doppelspalt, Photoeffekt-Demo, Bohr-Modell

**Schwer oder später:**
- hochgenaue CFD/FEM-Simulationen
- echte Chemie-Reaktionskinetik mit Sicherheit/Materialien
- komplexe 3D-Labore
- Experimente, die externe Sensoren/Videos brauchen

Produktversprechen daher:

> „AI kann aus vorbereiteten Open-Source-Physik-Bausteinen browserbasierte Lernexperimente erzeugen, erklären und messbar machen.“

Nicht:

> „AI kann jede reale Wissenschaftssimulation physikalisch perfekt ersetzen.“

## 4. Hauptobjekt: Space

Ein **Space** ist ein dauerhaft gespeicherter, isolierter Experiment-Playground.

Beispielstruktur:

```text
experiments/
  spaces/
    pendel-masse-irrelevant/
      index.html
      sketch.js
      experiment.json
      sources.json
      measurements.json
```

Jeder Space enthält:

| Datei | Zweck |
|---|---|
| `index.html` | isolierte Experiment-Seite |
| `sketch.js` | Simulationslogik |
| `experiment.json` | maschinenlesbare Beschreibung |
| `sources.json` | interne Provenance: OSS-Quelle, Lizenz, Commit/Version |
| `measurements.json` | gespeicherte Messwerte / Beispielruns |

## 5. Experiment Contract

Jeder Space muss ein Manifest haben:

```json
{
  "id": "pendulum-period",
  "title": "Pendelperiode untersuchen",
  "domain": "physics",
  "engine": "matter-js",
  "concepts": ["Pendel", "Periodendauer", "Gravitation"],
  "level": "school",
  "parameters": {
    "mass": { "label": "Masse", "min": 1, "max": 10, "default": 2, "unit": "kg" },
    "length": { "label": "Länge", "min": 0.5, "max": 5, "default": 2, "unit": "m" },
    "gravity": { "label": "Gravitation", "min": 1, "max": 20, "default": 9.81, "unit": "m/s²" }
  },
  "measurements": ["period", "amplitude", "energy"],
  "formulas": [
    {
      "name": "Pendelperiode",
      "formula": "T = 2π√(L/g)",
      "variables": { "T": "Periodendauer", "L": "Länge", "g": "Gravitation" }
    }
  ]
}
```

Dieser Contract ist der Schlüssel: Die UI muss nicht wissen, welches Experiment kommt. Sie liest Parameter, Messwerte und Formeln aus dem Manifest.

## 6. UI-Zielbild

Die App bleibt Labor-App + Chat:

```text
┌──────────────────────────────────────┬──────────────────────┐
│ Experiment Space                     │ AI Experimentleiter   │
│ Canvas / Simulation                  │ Chat                 │
│ Parameter direkt im Space            │ Nachfragen/Erklären   │
├──────────────────────────────────────┼──────────────────────┤
│ Daten & Messwerte                    │ Formel & Rechnung     │
│ Tabelle, Graph, Live-Werte           │ Einsetzen, Ergebnis   │
└──────────────────────────────────────┴──────────────────────┘
```

Wichtig: Der Schüler soll nicht nur „sehen“, sondern messen, vergleichen und rechnen.

## 7. Agent Workflow

Ein Chat, keine sichtbaren Modi.

Intern läuft dieser Ablauf:

1. **Intent verstehen**
   - Will der User ein Konzept erklärt bekommen?
   - Will er ein neues Experiment?
   - Will er einen vorhandenen Space verändern?

2. **Nachfragen, falls nötig**
   - Niveau?
   - Ziel: verstehen, spielen, messen, Aufgabe lösen?
   - gewünschte Variablen?

3. **Quellen/Bausteine abrufen**
   - lokale `sources/catalog.json`
   - vorbereitete Repo-Summaries
   - Formelbank
   - Engine-Templates

4. **Experiment planen**
   - Konzept
   - Parameter
   - Messwerte
   - Formel
   - Visualisierung

5. **Space erzeugen**
   - isolierter Ordner unter `experiments/spaces/<id>/`
   - `experiment.json`
   - `index.html`
   - `sketch.js`
   - `sources.json`

6. **Verifizieren**
   - Dateien vorhanden
   - Manifest valide
   - keine externen gefährlichen Skripte
   - HTTP-Smoke-Test

7. **Space öffnen/registrieren**
   - in Space-Menü anzeigen
   - User kann weiter Fragen stellen und Parameter ändern

## 8. Vorbereitete OSS-Bausteine

Repos werden nicht live aus GitHub gezogen, sondern vorbereitet.

Startkandidaten aus Recherche:

| Quelle | Nutzen | Lizenzhinweis |
|---|---|---|
| `matter-js` | robuste 2D-Physikengine | MIT |
| `p5.js` | einfache Visualisierung, Wellen/Optik | LGPL |
| `myphysicslab/myphysicslab` | JS/TS Simulationsklassen, Mechanik | Apache-2.0 |
| `OpenPsiMu/ThePhysicsHub` | p5.js Physik-Simulationen | prüfen/speichern |
| `CamGomezDev/physics-lab` | p5.js Mechanics-App | prüfen/speichern |
| `physicshub/physicshub.github.io` | Formeln visualisieren, Web-App | MIT laut Recherche |
| `mqurban/Physics-Simulations` | Canvas Mechanics/Waves | MIT laut Recherche |
| `SajeelHussain/physics-simulations` | p5.js/Three.js Mechanics/Optics | MIT laut Recherche |
| `hartejnayar/physics-engine-simulator` | viele p5.js Konzepte | Lizenz prüfen |
| PhET / Open Source Physics | didaktische Referenz, Formeln, Konzepte | Lizenz je Repo prüfen |

Wichtig: Nicht blind Code kopieren. Der Builder soll Patterns, Formeln und Konzepte nutzen und eigene Spaces erzeugen.

## 9. Lokale Source-Struktur

```text
sources/
  catalog.json
  formulas/
    mechanics.json
    waves.json
    optics.json
    electricity.json
  repos/
    matter-js/
    myphysicslab/
    the-physics-hub/
    physics-lab/
  summaries/
    matter-js.md
    pendulum-patterns.md
    projectile-patterns.md
    optics-ray-patterns.md
```

`catalog.json` speichert intern:

```json
{
  "id": "matter-js",
  "name": "matter-js",
  "url": "https://github.com/liabru/matter-js",
  "license": "MIT",
  "localPath": "sources/repos/matter-js",
  "useFor": ["mechanics", "collisions", "constraints"]
}
```

## 10. Engine-Bausteine

Der Agent braucht nicht nur Wissen, sondern wiederverwendbare Templates:

```text
builder/templates/
  matter-basic/
    index.html
    sketch.js
  p5-basic/
    index.html
    sketch.js
  ray-optics-basic/
    index.html
    sketch.js
  graph-panel/
  measurement-api/
```

Jedes Template unterstützt:

- Parameter setzen
- Messwerte emitten
- Reset
- Play/Pause
- Formel-Metadaten

## 11. Measurement API

Jeder Space sendet Messwerte an die App:

```js
window.ExperimentAPI.emitMeasurement({
  t: 1.25,
  period: 1.42,
  velocity: 3.1,
  energy: 4.8
});
```

Die Haupt-App zeigt daraus automatisch:

- Live-Werte
- Tabelle
- einfache Graphen
- Rechnung mit Formel

## 12. Sicherheit und Grenzen

Auch ohne sichtbare Modi braucht es interne Gates:

- Agent schreibt nur unter `experiments/spaces/<id>/`
- kein Zugriff auf `.env`
- keine beliebigen externen Skripte außer erlaubten CDNs oder lokalen Vendor-Dateien
- jedes Space-Manifest wird validiert
- jede Quelle bekommt interne Provenance
- unbekannte Lizenz wird intern markiert

## 13. Umsetzung im bestehenden Repo

Aktuelles Repo ist Node/pi-basiert. Daher wird nicht auf FastAPI umgebaut.

### Schritt 1 — Struktur festziehen

- `sources/` anlegen
- `experiments/spaces/` anlegen
- `experiments/manifest.json` anlegen
- `builder/templates/` anlegen
- `plan/space-playground-plan.md` als Masterplan nutzen

### Schritt 2 — Space-Menü

- bestehendes starres Dropdown ersetzen/erweitern
- Space-Liste aus `experiments/manifest.json`
- Pendel/Wurf können als erste Spaces migriert werden

### Schritt 3 — Space Contract + Renderer

- App kann beliebige `experiment.json` laden
- Parameterpanel generisch aus Manifest
- Formelpanel generisch aus Manifest
- Datenpanel generisch aus Measurement API

### Schritt 4 — Builder Tooling im pi-Agent

Neue interne Tools:

- `source_search`
- `space_create`
- `space_write_file`
- `space_register`
- `space_verify`
- `space_open`

### Schritt 5 — Quellen vorbereiten

- ausgewählte GitHub-Repos lokal unter `sources/repos/` ablegen
- Summaries/Formeldateien erzeugen
- Lizenzstatus speichern

### Schritt 6 — Breite Physik-Abdeckung

Priorität nach Baustein-Wert:

1. Mechanik
2. Wellen
3. Optik
4. Elektrizität
5. Thermodynamik einfach
6. moderne Physik vereinfacht

## 14. MVP-Kriterium

Der MVP ist erfolgreich, wenn ein User frei schreibt:

> „Ich will verstehen, warum die Masse beim Pendel egal ist.“

und die App:

1. ggf. eine Rückfrage stellt,
2. einen dauerhaften Space erzeugt,
3. Simulation zeigt,
4. Parameter Masse/Länge/g anbietet,
5. Periodendaten misst,
6. Formel `T = 2π√(L/g)` zeigt,
7. Rechnung mit aktuellen Zahlen zeigt,
8. Space im Menü speichert.

Danach zweiter Proof:

> „Mach mir ein Experiment zu Interferenz von Wellen.“

Dann muss der Builder einen anderen Space-Typ aus anderen Bausteinen erzeugen.

## 15. Offene Detailfragen

Diese Fragen sind später wichtig, blockieren aber den Plan nicht:

1. Soll `sources/repos/` echte geklonte Repos enthalten oder nur extrahierte Summaries/Templates?
2. Soll die App offline funktionieren, wenn alle Quellen vorbereitet sind?
3. Sollen Schüler Spaces exportieren/teilen können?
4. Soll ein Lehrer später eigene Aufgaben/Worksheets aus Spaces machen können?
