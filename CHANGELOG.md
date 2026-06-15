# Changelog

## v1.0.0 — pi SDK rewrite / pi SDK Neuentwicklung (2026-06-15)

**EN:** Complete architecture rewrite from browser-only agent to server-side pi SDK agent loop.
**DE:** Komplette Architektur-Neuentwicklung vom Browser-Agent hin zum serverseitigen pi SDK Agent-Loop.

---

### Security & Accounts / Sicherheit & Konten

**EN:**
- **Private demo accounts** — Create an account with a one-time recovery code. No email required.
- **Recovery code login** — Code is stored only as a sha256 hash.
- **HttpOnly session cookie** — `HttpOnly`, `SameSite=Strict`, `Secure` in production. No auth token in `localStorage`.
- **API key never in localStorage** — Provider/model are optionally remembered; the key lives only in `sessionStorage`.
- **Cross-origin protection** — POST requests to `/api/*` are validated against the expected origin.

**DE:**
- **Private Demo-Konten** — Account-Erstellung mit einmaligem Recovery-Code. Keine E-Mail nötig.
- **Recovery-Code-Login** — Code wird nur als sha256-Hash gespeichert.
- **HttpOnly Session-Cookie** — `HttpOnly`, `SameSite=Strict`, in Production `Secure`. Kein Auth-Token in `localStorage`.
- **API-Key nie in localStorage** — Provider/Model werden optional gemerkt; der Key lebt nur in `sessionStorage`.
- **Cross-Origin-Schutz** — POST-Requests auf `/api/*` werden gegen die erwartete Origin geprüft.

---

### Private Spaces / Private Labore

**EN:**
- All new spaces are **private by default**, visible only to the creator account.
- Private space files stored under `FLABS_DATA_DIR/users/<id>/spaces/`.
- Public demo spaces remain under `experiments/spaces/`.
- `/api/spaces` returns private + public spaces when logged in.

**DE:**
- Alle neuen Spaces sind **standardmäßig privat**, nur für den Ersteller sichtbar.
- Private Space-Dateien liegen unter `FLABS_DATA_DIR/users/<id>/spaces/`.
- Öffentliche Demo-Spaces bleiben unter `experiments/spaces/`.
- `/api/spaces` liefert private + öffentliche Spaces, wenn eingeloggt.

---

### pi SDK Agent Loop (Server-Side / Serverseitig)

**EN:**
- Browser `agent.js` is now a thin bridge to `/api/agent/chat`.
- Provider list comes from pi SDK `ModelRegistry`.
- Agent loop runs server-side via `createAgentSession()` with restricted custom tools:
  - `space_read_file` — read one of 4 allowed files
  - `space_write_file` — write one of 4 allowed files (validated)
  - `space_list_files` — list allowed file names
- Agent has no shell, no network, no external CDN access.

**DE:**
- Browser-`agent.js` ist jetzt nur noch eine dünne Bridge zu `/api/agent/chat`.
- Provider-Liste kommt aus dem pi SDK `ModelRegistry`.
- Agent-Loop läuft serverseitig via `createAgentSession()` mit eingeschränkten Custom Tools:
  - `space_read_file` — lese eine von 4 erlaubten Dateien
  - `space_write_file` — schreibe eine von 4 erlaubten Dateien (validiert)
  - `space_list_files` — liste erlaubte Dateinamen auf
- Agent hat kein Shell, kein Netzwerk, keine externen CDN-Skripte.

---

### Bugfixes / Fehlerbehebungen

**EN:**
- Fixed double `<body>` tag in `index.html`.
- Fixed duplicate `"scripts"` keys in `package.json`.
- Removed unsupported browser-side provider list (all providers now come from pi SDK).

**DE:**
- Doppelter `<body>`-Tag in `index.html` gefixt.
- Doppelte `"scripts"`-Keys in `package.json` bereinigt.
- Nicht unterstützte Browser-Provider-Liste entfernt (alle Provider kommen jetzt aus dem pi SDK).

---

### Documentation / Dokumentation

- `CHANGELOG.md` added / hinzugefügt.
- `SECURITY.md` rewritten to reflect new architecture / neu geschrieben.

---

### Dependencies / Abhängigkeiten

**EN:**
- `@earendil-works/pi-coding-agent` moved from `devDependencies` → `dependencies`.
- `typebox@1.1.38` added as dependency (required for pi SDK custom tools).

**DE:**
- `@earendil-works/pi-coding-agent` von `devDependencies` → `dependencies` verschoben.
- `typebox@1.1.38` als Dependency hinzugefügt (benötigt für pi SDK Custom Tools).

---

### Deployment

**EN:**
- `render.yaml` updated to Node `>=22.19.0` and `FLABS_DATA_DIR=/var/data`.
- **Important:** Attach a **Render Persistent Disk** at `/var/data` in the Render Dashboard for real persistence.
- Render CLI (install via Homebrew or binary download): `brew tap render-oss/render && brew install render`

**DE:**
- `render.yaml` auf Node `>=22.19.0` und `FLABS_DATA_DIR=/var/data` aktualisiert.
- **Wichtig:** Eine **Render Persistent Disk** bei `/var/data` im Render Dashboard anhängen für echte Persistenz.
- Render CLI (Installation via Homebrew oder Binary): `brew tap render-oss/render && brew install render`
