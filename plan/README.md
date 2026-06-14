# LabResurrector Plan Index

Dieser Ordner enthält den festgezogenen, modularisierten Produkt- und Technikplan für LabResurrector.

## Neuer Master-Plan

1. [00-vision.md](./00-vision.md) — Produktvision, Zielgruppe, Nicht-Ziele
2. [01-product-decisions.md](./01-product-decisions.md) — festgelegte Entscheidungen
3. [02-system-architecture.md](./02-system-architecture.md) — Zielarchitektur im bestehenden Node/pi-Repo
4. [03-space-model.md](./03-space-model.md) — dauerhafte isolierte Spaces
5. [04-experiment-contract.md](./04-experiment-contract.md) — Manifest/schema für generische Experimente
6. [05-agent-workflow.md](./05-agent-workflow.md) — Chat → Nachfrage → Retrieval → Build → Verify → Space
7. [06-source-library.md](./06-source-library.md) — vorbereitete OSS-Quellen und Bausteine
8. [07-ui-ux-design.md](./07-ui-ux-design.md) — Labor-App UX, Layout, Interaktion
9. [08-data-formula-measurement.md](./08-data-formula-measurement.md) — Messdaten, Formeln, Rechnung
10. [09-security-isolation.md](./09-security-isolation.md) — Sandbox, Schreibgrenzen, Safety Gates
11. [10-implementation-roadmap.md](./10-implementation-roadmap.md) — konkrete Umsetzungsschritte
12. [11-risks-blindspots.md](./11-risks-blindspots.md) — bekannte Risiken, offene Fragen, Anti-Blindspots
13. [12-research-notes.md](./12-research-notes.md) — externe Recherche und Referenzen

## Bestehende historische Plan-Dateien

Diese Dateien bleiben als Kontext erhalten, sind aber nicht mehr die aktuelle Architektur-Wahrheit:

- [architecture.md](./architecture.md) — alte FastAPI/turbovec-orientierte Architektur
- [project.md](./project.md) — ursprünglicher Projektplan
- [timeline.md](./timeline.md) — ursprüngliche Hackathon-Timeline
- [oss-research.md](./oss-research.md) — frühere OSS-Recherche
- [pitch.md](./pitch.md) — Pitch-Material
- [space-playground-plan.md](./space-playground-plan.md) — erster zusammenhängender Masterplan

## Aktueller Repo-Stand, verifiziert am 2026-06-14

- `server.js` existiert und ist die echte Runtime-Basis.
- `experiments/` existiert.
- `sources/` fehlt noch.
- `references/` fehlt noch.
- `backend/` fehlt; die aktuelle Implementierung ist nicht FastAPI-basiert.

Daraus folgt: Die neue Umsetzung baut auf **Node + pi SDK + WebSocket + Browser/matter.js** auf.
