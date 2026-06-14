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

Agent darf bei expliziten Implementierungsaufgaben **nur** in diesen Ordnern schreiben/ändern:

```
experiments/spaces/<space-id>/   — vom Menschen angelegte Clean-Slate-Spaces / später ausgearbeitete Experimente
sources/                          — katalogisierte OSS-Quellen
builder/templates/                — Vorlagen für Space-Generierung
builder/schemas/                  — JSON-Schemata
plan/                             — Plan-Dokumentation (nur Agent-Regeln)
```

**Nicht erlaubt:**
- Projektroot überschreiben (`server.js`, `index.html`, `package.json`) ausser bei expliziter Freigabe
- `.env` lesen oder schreiben
- Root-`node_modules/` ändern
- Schreiben ausserhalb des Repos
- Absolute Pfade oder `../`
- Shell-Kommandos ohne Allowlist
- Beliebige CDN-Skripte (nur matter-js/p5.js erlaubt, besser lokales Vendor)
- Ungeprüfte GitHub-Repos direkt kopieren; unbekannte Lizenz bleibt Inspiration/Formel/Pattern

## Experiment-Space Struktur

Jeder Space unter `experiments/spaces/<space-id>/` muss enthalten:

```
experiments/spaces/<space-id>/
├── experiment.json   — Manifest (validierbar gegen builder/schemas/experiment.schema.json)
├── index.html        — Einstiegspunkt
├── sketch.js         — Simulationslogik
└── sources.json      — verbaute Quellen mit Lizenz
```

## Quellen, Grounding und emet

Jeder Eintrag in `sources/catalog.json` muss enthalten:
- name, url, license, version/commit, usage (Dependency | Inspiration | Formula | Template)

Unbekannte Lizenz = keine Codeübernahme. Nur Inspiration/Formel/Pattern erlaubt.

Der App-Agent in `server.js` enthält eigene Physik-Grounding-Tools und nutzt `@black-knight.dev/emet` als normale App-Abhängigkeit aus `package.json`. Es gibt bewusst **kein** projektlokales `.pi/settings.json` und kein `.pi`-Package für emet, damit der Entwickler-CLI-`pi` keine Tool-Konflikte bekommt.

Workflow:

1. Erst lokale Formeln/Quellen prüfen (`physics_formula_lookup`, `physics_source_policy`).
2. Bei unsicheren/aktuellen Fragen `emet` mit autoritativen Quellen nutzen.
3. Vor Space-Dateien `physics_model_plan` nutzen.
4. Jede Simulation muss Parameter, Messwerte, Formeln, Gültigkeitsgrenzen und `sources.json` haben.

PhET/phetsims = didaktischer Goldstandard, aber Code nur nach konkreter Lizenzprüfung übernehmen. CamGomezDev/physics-lab bleibt bis Lizenzprüfung Inspiration-only.

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
4. **Space Lifecycle** → Mensch erstellt neue Clean-Slate-Spaces im Menü/API
5. **Assist** → Agent arbeitet nur im aktuell ausgewählten Space oder erklärt Quick-Sims
6. **Verify** → Space-Verifikation durchlaufen, falls Dateien geändert wurden
7. **Open** → Space im Browser laden

## Runtime-Agent-Tools

Im Schülerflow sollen bevorzugt nur sichere Custom Tools aktiv sein:

- `source_search`
- `space_get_current`
- `space_write_current_file`
- `space_verify_current`
- Simulations-Tools wie `sim_set_param`, `sim_reset`
- App-lokale Physik-Grounding-Tools aus `server.js`
- App-lokales `emet` für aktuelle/unsichere Recherche mit Quellen

Generische `bash/write/edit/read` Tools gehören nicht in den Runtime-Schülerflow.

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
- `sources/` existiert mit Katalog/Formeln
- `builder/` existiert mit Schemas/Templates
- `backend/` fehlt (kein FastAPI)
- Alte `plan/architecture.md` ist historisch, nicht aktuell
