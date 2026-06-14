# 02 — System Architecture

## Aktuelle Repo-Wahrheit

Verifiziert am 2026-06-14:

- `server.js` existiert und startet Node/Express/WebSocket/pi SDK.
- `index.html`, `js/`, `css/` existieren.
- `experiments/` existiert.
- `sources/`, `references/`, `backend/` fehlen noch.

Daraus folgt: Die neue Architektur nutzt die vorhandene Node/pi-Basis.

## Zielarchitektur

```text
Browser Lab App
├── Space Canvas / iframe
├── Chat Panel
├── Space Menu
├── Parameter Panel
├── Data Panel
└── Formula/Calculation Panel
        │
        ▼ WebSocket / HTTP
Node server.js
├── pi Agent Session
├── Space Registry API
├── Source Library API
├── Builder Tools
├── Verification Tools
└── Static serving for experiments/spaces
        │
        ├── experiments/spaces/<space-id>/
        ├── sources/
        └── builder/templates/
```

## Kernmodule

### 1. Lab UI

Die UI ist nicht an Pendel/Wurf gebunden. Sie lädt Spaces aus `experiments/manifest.json`.

### 2. Space Runtime

Jeder Space läuft isoliert, idealerweise per iframe oder eigenständiger Seite.

### 3. Agent Orchestrator

Der Agent entscheidet aus Chat-Kontext:

- erklären
- nachfragen
- Space öffnen
- Space verändern
- neuen Space bauen

### 4. Source Library

Vorbereitete Quellen und Bausteine:

- OSS-Repos lokal oder als extrahierte Summaries
- Formeldatenbank
- Engine-Templates
- didaktische Patterns

### 5. Builder

Erzeugt aus Templates + Quellen einen neuen Space.

### 6. Verification Gate

Kein Space wird registriert, bevor er validiert wurde.

## Warum kein FastAPI jetzt

Die alte Doku spricht von FastAPI/turbovec/Groq. Im Repo ist aber Node/pi bereits lauffähig. Ein Architekturwechsel würde mehr Fragmentierung erzeugen. Daher:

- Node bleibt Orchestrator.
- RAG startet als lokale Source-Library.
- Vektorindex kann später ergänzt werden.

## Spätere Erweiterung

Wenn nötig:

```text
Node server.js
  └── calls optional local RAG service
        ├── embeddings
        ├── vector DB
        └── reranking
```

Aber nicht als MVP-Voraussetzung.
