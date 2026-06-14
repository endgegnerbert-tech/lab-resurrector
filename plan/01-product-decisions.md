# 01 — Festgelegte Produktentscheidungen

| Thema | Entscheidung |
|---|---|
| Produktform | Labor-App + Chat, nicht ChatGPT mit Preview. |
| Input | User schreibt frei. Keine starren Prompts nötig. |
| AI-Rolle | Experimentleiter + Space-Builder + Tutor. |
| GitHub | Nicht live im Userfluss. Quellen werden vorbereitet. |
| Quellen | OSS-Repos, Formeln, Templates, didaktische Patterns lokal aufbereitet. |
| Fachbereich | Nur Physik für MVP. |
| Spaces | Dauerhaft gespeichert. |
| Space-Isolation | Jeder Space getrennt von allen anderen. |
| Code sichtbar | Nein, erstmal nicht. |
| Quellen sichtbar | Für Schüler erstmal nicht prominent; intern immer gespeichert. |
| Messdaten | Pflichtbestandteil jedes Experiments. |
| Formeln/Rechnung | Pflichtbestandteil jedes Experiments. |
| Bestehende feste Szenen | Pendel/Wurf werden zu Beispiel-Spaces oder Legacy-Szenen. |
| Backend-Wahrheit | Aktuell Node `server.js`, nicht FastAPI. |
| RAG | Erst lokal/leichtgewichtig; Vektorindex später möglich. |

## User darf alles schreiben

Die KI soll flexibel reagieren:

- Wenn unklar: kurz nachfragen.
- Wenn klar: direkt Space bauen oder vorhandenen öffnen.
- Wenn zu komplex: vereinfachtes Modell vorschlagen.
- Wenn physikalisch unmöglich/ungeeignet: erklären und Alternative anbieten.

## Kein sichtbarer Moduswechsel

Intern gibt es Workflows und Safety-Gates. Für User gibt es nur:

- Chat
- Laborfläche
- Space-Menü
- Parameter
- Daten/Formeln/Rechnung

## Erfolgsdefinition

Ein Schüler ohne Equipment kann ein Experiment starten, Parameter verändern, Messwerte sehen und mit einer Formel verstehen, warum das Ergebnis passiert.
