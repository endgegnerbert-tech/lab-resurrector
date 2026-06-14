# LabResurrector — Agent-Regeln

## Stack (festgelegt, nicht verhandelbar)

| Komponente | Technologie | Status |
|-----------|-------------|--------|
| **Runtime** | Node.js (ESM) | existiert in `server.js` |
| **Agent SDK** | `@earendil-works/pi-coding-agent` | existiert |
| **Server** | Express + WebSocket (`ws`) | existiert in `server.js` |
| **Frontend** | HTML/CSS/JS + matter.js | existiert in `index.html`, `js/`, `css/` |
| **Physik-Engines** | matter-js, p5.js, canvas-2d | MVP-Allowlist |

**Nicht FastAPI. Nicht turbovec. Nicht Groq.**  
Die alte `plan/architecture.md` ist historisch. Die aktuelle Architektur ist `server.js` (Node/pi/WebSocket).

## Erlaubte Ordner (Schreibgrenzen)

Agent darf **nur** in diesen Ordnern schreiben/ändern:

```
experiments/spaces/<space-id>/   — generierte Experiment-Spaces
sources/                          — katalogisierte OSS-Quellen
builder/templates/                — Vorlagen für Space-Generierung
builder/schemas/                  — JSON-Schemata
plan/                             — Plan-Dokumentation (nur Agent-Regeln)
```

**Nicht erlaubt:**
- Projektroot überschreiben (`server.js`, `index.html`, `package.json`)
- `.env` lesen oder schreiben
- `node_modules/` ändern
- Schreiben ausserhalb des Repos
- Absolute Pfade oder `../`
- Shell-Kommandos ohne Allowlist
- Beliebige CDN-Skripte (nur matter-js/p5.js erlaubt, besser lokales Vendor)

## Experiment-Space Struktur

Jeder Space unter `experiments/spaces/<space-id>/` muss enthalten:

```
experiments/spaces/<space-id>/
├── experiment.json   — Manifest (validierbar gegen builder/schemas/experiment.schema.json)
├── index.html        — Einstiegspunkt
├── sketch.js         — Simulationslogik
└── sources.json      — verbaute Quellen mit Lizenz
```

## Quellen (sources/)

Jeder Eintrag in `sources/catalog.json` muss enthalten:
- name, url, license, version/commit, usage (Dependency | Inspiration | Formula | Template)

Unbekannte Lizenz = keine Codeübernahme. Nur Inspiration/Formel/Pattern erlaubt.

## Verifikation (vor Abschluss jeder Änderung)

Nach jeder Codeänderung:

1. **Syntax-Check** für geänderte JS-Dateien:
   ```bash
   node --check server.js        # falls server.js geändert
   node --check js/<datei>.js    # falls andere JS-Dateien
   node --check builder/...      # falls Builder-Dateien
   ```

2. **LSP Diagnostics** prüfen (via `lsp_diagnostics`).

3. **Smoke-Test** (nur wenn der Server läuft oder gestartet wird):
   ```bash
   npm start &                    # start im Hintergrund
   sleep 2 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3210/
   # → Erwartet: 200
   ```

4. **Keine unbeabsichtigten Nebenwirkungen**: Vor/nach Diff checken mit `git diff --stat` oder `find ... -newer`.

## Sicherheitsgrenzen (Safety Gates)

- Space-Verifikation vor Registrierung in `experiments/manifest.json`:
  - `experiment.json` existiert und valide
  - `index.html` existiert
  - `sketch.js` existiert
  - Keine verbotenen Pfade (`../`, `.env`, absolute Pfade)
  - Keine unbekannten externen Skripte
  - Space-ID eindeutig
  - `sources.json` existiert

- Audit-Log pro Build speichern (spaceId, createdAt, agentModel, sourcesUsed, filesWritten, verification).

## Agent-Workflow (Phasen)

1. **Chat** → User-Anfrage verstehen
2. **Nachfragen** → wenn unklar, erst fragen
3. **Retrieval** → Quelle aus `sources/catalog.json` oder `builder/templates/`
4. **Build** → Space unter `experiments/spaces/` generieren
5. **Verify** → Space-Verifikation durchlaufen
6. **Register** → in `experiments/manifest.json` eintragen
7. **Open** → Space im Browser laden

## Nicht-Ziele

- Kein FastAPI-Backend bauen
- Keine echte Container-Sandbox (später)
- Kein Vektorindex/RAG als MVP (später)
- Kein sichtbarer Code für Schüler (später als Teacher View)
- Keine Three.js oder weitere Engines (nur matter-js, p5.js, canvas-2d)

## Offene Fragen (bei Ambiguity immer fragen, nicht raten)

- Sollen vorbereitete Repos komplett unter `sources/repos/` oder nur Summaries?
- Soll die App offline funktionieren?
- Sollen Spaces versioniert werden?
- Soll später ein Teacher-Review vor Freigabe kommen?

## Aktuelle Repo-Wahrheit (verifiziert 2026-06-14)

- `server.js` existiert (Node/Express/WebSocket/pi SDK)
- `index.html`, `js/`, `css/` existieren
- `experiments/` existiert (leer)
- `sources/` fehlt noch
- `builder/` fehlt noch
- `backend/` fehlt (kein FastAPI)
- Alte `plan/architecture.md` ist historisch, nicht aktuell
