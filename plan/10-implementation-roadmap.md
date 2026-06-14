# 10 — Implementation Roadmap

## Phase 0 — Plan konsolidieren

Status: gestartet.

- modulare Plan-Dateien unter `plan/`
- aktuelle Repo-Wahrheit dokumentieren
- alte FastAPI-Doku als historisch markieren

## Phase 1 — Ordnerstruktur und Registry

Anlegen:

```text
sources/
experiments/spaces/
experiments/manifest.json
builder/templates/
builder/schemas/
```

Erstellen:

- `builder/schemas/experiment.schema.json`
- `experiments/manifest.json`
- `sources/catalog.json`

## Phase 2 — Space-Menü

- Dropdown/Selector ersetzt starre Szenen durch Space-Liste
- bestehende Pendel/Wurf als erste Spaces registrieren oder migrieren
- Space in iframe oder isolierter Route laden

## Phase 3 — Experiment Contract Renderer

- Parameterpanel aus `experiment.json`
- Formelpanel aus `experiment.json`
- Datenpanel über Measurement API
- generische Graph/Tabelle-Komponente

## Phase 4 — Builder Templates

Templates:

```text
builder/templates/matter-basic/
builder/templates/p5-basic/
builder/templates/wave-basic/
builder/templates/ray-optics-basic/
```

Jedes Template unterstützt:

- Play/Pause/Reset
- Parameter
- Messwerte
- Formel-Metadaten

## Phase 5 — Space Lifecycle + Agent Assist

Entscheidung nach Review: **Der Mensch erstellt neue Spaces im Menü.**

Warum: Ein Space ist ein neuer sauberer Arbeitsraum; der User soll bewusst entscheiden, wann ein neuer Arbeitsraum entsteht. Der Agent soll nicht autonom neue Projekte anlegen.

In `server.js`:

- `GET /api/spaces` — Space-Liste
- `POST /api/spaces` — Mensch erstellt Clean-Slate-Space aus dem Menü
- `GET /api/spaces/:id/manifest` — Space-Manifest
- Agent-Tool `source_search` — lokale Quellen/Formeln/Bausteine finden

Nicht als Agent-Tool:

- kein autonomes `space_create`
- kein autonomes `space_register`

Später möglich: Agent darf **innerhalb des aktuell ausgewählten Space** Änderungen vorschlagen/ausführen, aber nur nach User-Bestätigung und Verify Gate.

## Phase 6 — Source Library vorbereiten

- OSS-Kandidaten lokal sammeln oder zusammenfassen
- Lizenzen speichern
- Formelbank bauen
- Summaries pro Physikbereich

## Phase 7 — Erster echter End-to-End Proof

User schreibt:

> „Ich will verstehen, warum die Masse beim Pendel egal ist.“

System soll:

1. Space erzeugen
2. Parameter Masse/Länge/g bieten
3. Periodendauer messen
4. Formel zeigen
5. Rechnung mit aktuellen Zahlen zeigen
6. Space dauerhaft speichern

## Phase 8 — Zweiter Proof anderer Bereich

User schreibt:

> „Mach mir ein Experiment zu Interferenz von Wellen.“

System soll einen p5/canvas-Wellen-Space erzeugen, nicht nur matter.js wiederverwenden.

## Phase 9 — Breite Physik-Coverage

Bausteinpakete:

1. Mechanik Pack
2. Wellen Pack
3. Optik Pack
4. Elektrizität Pack
5. Thermo Pack
6. Moderne Physik Pack

## Phase 10 — Später

- echter Vektorindex/RAG
- Lehrer-Accounts
- Space-Sharing
- Export als HTML
- Aufgaben/Worksheets
- mehrsprachige UI
