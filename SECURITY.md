# Security

## Architecture

flabs now uses a **server-side pi SDK agent loop** instead of browser-only LLM calls.

### What changed

- **Before:** Browser sent API keys directly to LLM providers. Server never saw keys.
- **Now:** Browser sends the API key over same-origin HTTPS to `/api/agent/chat`. The server uses it as a **runtime-only pi AuthStorage override** for one agent turn and does **not persist it**.

## Private Demo Accounts

- Accounts are created via **recovery code** (a random bearer token shown once).
- The recovery code is stored **only as a sha256 hash**.
- The actual token is never logged or stored.
- Session cookies are:
  - `HttpOnly` — not accessible from JavaScript
  - `SameSite=Strict` — protects against CSRF
  - `Secure` in production (HTTPS only)
  - `Max-Age=14 days`
- There is no password, no email, no personal data required.

## API Key Handling

| Storage | Contains | Persistence |
|---------|----------|-------------|
| `sessionStorage` (Browser) | Provider + Model + API Key | Current browser tab session only |
| `localStorage` (Browser) | Provider + Model **only** | Across browser restarts, if opted in |
| Server RAM | API Key | **Single agent request, then discarded** |
| Server Disk | **Nothing** | API key is never written to disk |

## Private Spaces

- All new spaces are **private by default**, visible only to the creating account.
- Private space files are stored under `FLABS_DATA_DIR/users/<userId>/spaces/`.
- No other user can read, write, or delete your private spaces.
- Public demo spaces under `experiments/spaces/` are readable by everyone.

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
