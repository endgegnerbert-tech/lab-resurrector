# 14 — Phase 10–12 Execution Notes

Stand: 2026-06-14

## Entscheidung Phase 10

`space_create` ist **kein autonomes Agent-Tool**.

Der Mensch erstellt im UI-Menü einen neuen Clean-Slate-Space. Der Agent arbeitet danach nur im ausgewählten Space.

Begründung:

- Ein Space ist ein bewusst angelegter Arbeitsraum.
- Der User soll Workspace-Lifecycle kontrollieren.
- Der Agent bekommt sichere, begrenzte Werkzeuge statt generische Dateisystemmacht.

## Implementierter Runtime-Flow

1. Mensch klickt `＋ Neuer Space`.
2. Server erstellt `experiments/spaces/<id>/` mit Clean-Slate-Dateien.
3. UI lädt Space im iframe.
4. Browser sendet `space_selected` an Server.
5. Agent kann den aktuellen Space lesen/ausarbeiten.
6. Agent muss nach Dateiänderung `space_verify_current` nutzen.

## Sichere Agent Tools

Aktiv im Schülerflow:

- `source_search`
- `space_get_current`
- `space_write_current_file`
- `space_verify_current`
- Sim-Tools wie `sim_set_param`, `sim_reset`, `sim_ask_question`

Nicht aktiv im Schülerflow:

- generische `bash`
- generische `write`
- generische `edit`
- generische `read`
- autonomes `space_create`

## Phase 11 Proof

`pendulum-period` ist der erste End-to-End-Proof:

- Space ist im Menü registriert.
- Space läuft isoliert unter `/experiments/spaces/pendulum-period/`.
- Parameter: Masse, Länge, Gravitation, Auslenkung.
- Messwerte: Zeit, Geschwindigkeit, Energie, gemessene Periodendauer, Formelperiode.
- Formel: `T = 2π √(L / g)`.
- Bugfix: Periodenmessung nutzt jetzt zwei gleiche Extrema (`crossings[2] - crossings[0]`).
- Bugfix: potentielle Energie wird relativ zum tiefsten Pendelpunkt berechnet.

## Phase 12 Proof

`wave-interference` ist der zweite Bereichs-Proof:

- Space ist im Menü registriert.
- Pure Canvas, kein matter.js-Zwang.
- Parameter: Wellenlänge, Quellabstand, Amplitude, Phase.
- Messwerte: Intensität, Wegdifferenz, Wellenlänge, Phase.
- Formel: Superposition `y_ges = y₁ + y₂` plus konstruktive/destruktive Interferenzregeln.

## DeepSeek V4 Flash Smoke-Test

Mit `PORT=3212 node server.js` wurde verifiziert, dass der Server DeepSeek V4 Flash auswählt und WebSocket-Chat funktioniert.

Testprompts:

1. Pendel: „Erkläre kurz mit Formel, warum die Masse beim Pendel die Periodendauer kaum beeinflusst."
2. Wellen: „Erkläre kurz, wie ich im Interferenz-Space konstruktive und destruktive Interferenz erkenne."

Beobachtung:

- DeepSeek V4 Flash wurde laut Serverlog gewählt.
- Agent-Toolcalls liefen über WebSocket.
- Pendelprompt nutzte Simulationstools und `source_search`.
- Wellenprompt nutzte `space_get_current` und `source_search`.
