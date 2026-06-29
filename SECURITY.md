# Security

## Architecture

flabs now uses a **server-side pi SDK agent loop** instead of browser-only LLM calls.

### What changed

- **Before:** Browser sent API keys directly to LLM providers. Server never saw keys.
- **Now:** Browser sends the API key over same-origin HTTPS to `/api/agent/chat`. The server uses it as a **runtime-only pi AuthStorage override** for one agent turn and does **not persist it**.

## Private Browser Sessions

- Every new browser session gets an automatic **temporary private session**.
- The temporary session is stored only in an `HttpOnly` browser-session cookie.
- A starter lab is created for that session and is not listed for other users.
- Session cookies are:
  - `HttpOnly` — not accessible from JavaScript
  - `SameSite=Strict` — protects against CSRF
  - `Secure` in production (HTTPS only)
  - no `Max-Age` — browser-session scoped
- There is no signup, password, email, recovery code, or personal data required.

## API Key Handling

| Storage | Contains | Persistence |
|---------|----------|-------------|
| Page memory (Browser) | Provider + Model + API Key | Current page load only |
| `localStorage` (Browser) | Provider + Model **only** | Across browser restarts, if opted in |
| Server RAM | API Key | **Single agent request, then discarded** |
| Server Disk | **Nothing** | API key is never written to disk |

## Private Spaces

- All new spaces are **private by default**, visible only to the current browser session.
- Temporary sessions can create and edit private spaces without signup.
- Private space files are stored under `FLABS_DATA_DIR/spaces/<userId>/`.
- No other user can read, write, or delete your private spaces.
- Public demo spaces under `experiments/spaces/` are readable by everyone.

## Storage on Render Free

Render Free web services have an ephemeral filesystem. Private browser sessions and labs can work during a live server session, but they are lost when the service spins down, restarts, or redeploys.

For real persistence, run on a paid Render web service with a persistent disk and set:

- `FLABS_DATA_DIR` to the disk mount path, for example `/var/data`
- `FLABS_DATA_PERSISTENT=true`

On Render Free, leave `FLABS_DATA_PERSISTENT=false` so the app shows the temporary-data warning honestly.

## Agent Capabilities

The server-side pi SDK agent runs with **restricted tools**:

- `space_read_file` — read one of 4 allowed files
- `space_write_file` — write one of 4 allowed files (validated for safety)
- `space_list_files` — list allowed files

The agent cannot:
- Execute shell commands
- Access the network
- Read arbitrary files outside the space directory
- Store or exfiltrate API keys
- Load external JavaScript/CDN scripts into your lab
- Read parent-page `localStorage`, `sessionStorage`, cookies, or JavaScript state from generated lab code

## Input Validation

- All paths are validated against directory traversal (`../`)
- Space IDs are sanitized to `[a-z0-9-]+`
- File content is validated:
  - `index.html`: no external scripts, no parent paths
  - JSON files are parsed before writing
  - Maximum file size: 200 KB
- Cross-origin POST requests are rejected with 403

## Dependencies

Production (`npm install`):
- `@earendil-works/pi-coding-agent` — pi SDK (model registry, agent session)
- `express` — HTTP server
- `typebox` — tool parameter schemas

## Reporting a Vulnerability

Open an issue on GitHub. For sensitive reports, email the maintainer directly.
