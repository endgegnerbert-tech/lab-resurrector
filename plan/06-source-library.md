# 06 — Source Library und OSS-Bausteine

## Grundentscheidung

Repos werden **nicht live** im Schülerflow gezogen. Sie werden vorbereitet, lokal katalogisiert und in Bausteine/Summaries/Formeln übersetzt.

## Warum

- schneller
- stabiler
- keine unkontrollierten Lizenz-/Security-Probleme im Live-Flow
- bessere Agent-Qualität, weil Quellen für ihn vorstrukturiert sind

## Zielstruktur

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
    p5.js/
    myphysicslab/
    the-physics-hub/
    physics-lab/
  summaries/
    matter-js.md
    p5-patterns.md
    pendulum-patterns.md
    waves-patterns.md
    optics-patterns.md
  licenses/
    attribution.json
```

## Kandidaten

| Quelle | Nutzen | Status |
|---|---|---|
| matter-js | 2D rigid-body Physik, Constraints, Kollisionen | Kern-Engine, MIT laut Projekt |
| p5.js | schnelle visuelle Simulationen, Wellen/Optik | Kern-Renderer, Lizenz prüfen/speichern |
| myphysicslab | JS/TS Klassen für reale Physik-Simulationen | sehr wertvoll für Mechanik, Apache-2.0 laut Recherche |
| ThePhysicsHub | p5.js Lernsimulationen | Didaktik/Patterns, Lizenz vor Import prüfen |
| physics-lab | p5.js Mechanik-App | Mechanics-Patterns, Lizenz vor Import prüfen |
| physicshub.github.io | Formelvisualisierung | MIT laut Recherche, prüfen |
| mqurban/Physics-Simulations | Canvas Mechanics/Waves | MIT laut Recherche, prüfen |
| SajeelHussain/physics-simulations | p5.js/Three.js Mechanics/Optics | MIT laut Recherche, prüfen |
| hartejnayar/physics-engine-simulator | viele p5.js Konzepte | Lizenz prüfen |
| PhET | didaktischer Goldstandard | eher Konzepte/Design, Lizenz pro Repo prüfen |
| Open Source Physics | Physikdidaktik, Tracker, OSP | später, Lizenz pro Teil prüfen |

## Keine blinde Code-Übernahme

Der Builder soll:

- Konzepte extrahieren
- Formeln nutzen
- Patterns lernen
- eigene Spaces erzeugen

Er soll nicht unkontrolliert fremden Code kopieren.

## Katalogeintrag

```json
{
  "id": "matter-js",
  "name": "matter-js",
  "url": "https://github.com/liabru/matter-js",
  "license": "MIT",
  "localPath": "sources/repos/matter-js",
  "useFor": ["mechanics", "collisions", "constraints"],
  "allowedUse": "runtime-dependency-and-template-reference",
  "notes": "Primary 2D physics engine."
}
```

## Vorbereitungsschritte pro Repo

1. Repo/Release lokal sichern oder relevante Dateien extrahieren.
2. Lizenz prüfen und speichern.
3. README/Doku zusammenfassen.
4. Bausteine markieren: Engine, Parameter, UI, Messung, Formeln.
5. Beispiele in `sources/summaries/` schreiben.
6. Falls unsichere Lizenz: nur als Inspiration/Recherche, nicht als Codequelle.

## Coverage-Ziel

Bausteine sollen möglichst viele schulische Physikbereiche abdecken:

- Mechanik
- Wellen
- Optik
- Elektrizität
- Thermodynamik einfach
- moderne Physik vereinfacht
