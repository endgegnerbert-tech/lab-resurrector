# Security

## API Keys Stay in Your Browser

**flabs never stores, sees, or transmits API keys to its server.**

- Your API key lives only in your browser's `sessionStorage` (or `localStorage` if you opt in)
- The browser sends your API key **directly** to the LLM provider (OpenAI, Anthropic, Groq, etc.)
- The flabs server (`server.js`) is pure static files + space CRUD — it has **zero** knowledge of your AI configuration

## What the Server Knows

The server knows only:
- Which experiment spaces exist (names and IDs stored in `experiments/manifest.json`)
- That someone is browsing the site

It never receives:
- API keys
- Chat messages
- Model selections
- Any user-identifiable data

## Code Running in Your Browser

The AI logic (`js/ai/agent.js`) is open source and runs entirely client-side. You can:

1. Open your browser's DevTools (`F12`)
2. Inspect every outgoing `fetch()` call — they go directly to `api.openai.com`, `api.anthropic.com`, etc.
3. Verify no data is sent to the flabs server

## Dependencies

Production (`npm install --omit=dev`):
- `express` — HTTP server
- That's it (3.9 MB)

The pi SDK (`@earendil-works/pi-coding-agent`) is a **dev dependency only** — used once to generate the model catalog at build time. It is not present at runtime.

## Reporting a Vulnerability

If you find a security issue, please open an issue on GitHub.
