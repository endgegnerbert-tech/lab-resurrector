# 09 — Security und Isolation

## Grundsatz

Auch wenn der User keine Modi sieht, braucht das System intern strenge Grenzen.

## Warum

Ein Agent, der Dateien schreibt und Experimente baut, darf nicht beliebig ins Projekt oder System schreiben.

## Best Practices aus Recherche

- isolierte Sandbox/Container oder mindestens Workspace-Grenzen
- Least Privilege
- keine Secrets mounten
- Schreibzugriff nur in erlaubten Ordnern
- Audit Logs
- Rollback/Snapshots
- Verifikation vor Registrierung
- human-review/CI für riskante Änderungen

## MVP-Grenzen

Der Space-Builder darf schreiben nur unter:

```text
experiments/spaces/<space-id>/
```

Nicht erlaubt:

- `.env` lesen
- Projektroot überschreiben
- `server.js` ändern während Schülerflow
- externe Downloads im Liveflow
- Shell-Kommandos ohne Allowlist
- beliebige CDN-Skripte

## Erlaubte Runtime-Ressourcen

Start-Allowlist:

- lokale Dateien aus Space
- lokale vendored Libraries
- bekannte CDNs nur falls explizit erlaubt, z.B. matter-js/p5.js

Besser langfristig: Libraries lokal vendorn.

## Space Verification

Vor Registrierung prüfen:

1. `experiment.json` existiert und ist valide.
2. `index.html` existiert.
3. `sketch.js` existiert.
4. Keine verbotenen Pfade (`../`, `.env`, absolute Pfade).
5. Keine unbekannten externen Skripte.
6. HTTP-Smoke-Test liefert 200.
7. Space-ID ist eindeutig.
8. `sources.json` existiert.

## Audit

Für jeden Build speichern:

```json
{
  "spaceId": "pendulum-period",
  "createdAt": "...",
  "agentModel": "...",
  "sourcesUsed": ["matter-js", "mechanics-formulas"],
  "filesWritten": ["index.html", "sketch.js", "experiment.json"],
  "verification": "passed"
}
```

## Lizenz-Sicherheit

Intern immer speichern:

- Quelle
- URL
- Lizenz
- Version/Commit wenn vorhanden
- Nutzung: Dependency, Inspiration, Formel, Template

Unbekannte Lizenz heißt: nicht als Codequelle übernehmen.
