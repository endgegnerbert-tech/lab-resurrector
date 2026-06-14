# 11 — Risiken, Blindspots und offene Fragen

## 1. „Jedes Experiment“ ist zu absolut

Risiko: Versprechen wirkt überzogen.

Lösung: klarer Scope:

> Viele schulische Physikexperimente aus vorbereiteten Bausteinen.

Nicht:

> Jede reale Wissenschaftssimulation perfekt.

## 2. Physikalische Korrektheit

Risiko: Agent baut schöne, aber falsche Experimente.

Gegenmaßnahmen:

- Formelbank
- Modellgrenzen pro Experiment
- Tests für einfache bekannte Fälle
- Messwert/Formel-Abgleich

## 3. Lizenzprobleme

Risiko: Code aus unklar lizenzierten Repos wird übernommen.

Gegenmaßnahmen:

- `sources/catalog.json`
- `sources.json` pro Space
- unbekannte Lizenz = keine Codeübernahme
- nur Inspiration/Formel/Pattern, wenn rechtlich okay geprüft

## 4. Security

Risiko: Agent schreibt/verändert falsche Dateien.

Gegenmaßnahmen:

- Schreibgrenzen
- keine Secrets
- Verify Gate
- Audit Log
- später Container/Sandbox

## 5. UX-Überladung

Risiko: Chat + Canvas + Daten + Formel wird zu voll.

Gegenmaßnahmen:

- Laborfläche priorisieren
- Daten/Formel als klare Panels oder Tabs
- kurze AI-Antworten
- progressive disclosure

## 6. RAG-Halluzinationen

Risiko: Agent behauptet Quellen/Formeln falsch.

Gegenmaßnahmen:

- strukturierte Source-Summaries
- Metadaten pro Chunk
- Retrieval-Evaluation später
- Antworten auf Messdaten/Formeln stützen

## 7. Performance

Risiko: generierte Spaces laufen langsam auf Schul-Laptops/Phones.

Gegenmaßnahmen:

- einfache Canvas/matter/p5 Modelle
- Parameterlimits
- FPS beobachten
- mobile Design

## 8. Zu viele Engines

Risiko: matter.js, p5.js, Three.js, eigene Engines fragmentieren.

Gegenmaßnahme:

Start nur:

- matter-js
- p5.js
- canvas-2d

## 9. Kein sichtbarer Code

Risiko: Fortgeschrittene wollen Code sehen.

Entscheidung: erstmal nicht. Später optional „Advanced/Teacher View“.

## 10. Repo-Doku widerspricht Code

Risiko: Alte FastAPI/turbovec-Doku verwirrt.

Gegenmaßnahme:

- `plan/README.md` als Plan-Index
- alte Dateien als historisch markieren
- README später aktualisieren

## Offene Fragen

1. Sollen vorbereitete Repos komplett unter `sources/repos/` liegen oder nur extrahierte Summaries?
2. Soll die App offline funktionieren, wenn Sources vorbereitet sind?
3. Soll ein Lehrer Spaces teilen/exportieren können?
4. Sollen Spaces versioniert werden?
5. Soll später eine „Teacher Review“ vor Freigabe eines Space kommen?
