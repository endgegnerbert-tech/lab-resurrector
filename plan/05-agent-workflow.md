# 05 — Agent Workflow

## Prinzip

Für User gibt es nur Chat + Labor. Intern folgt der Agent einem festen Ablauf.

## Hauptablauf

```text
User Message
  ↓
Intent erkennen
  ↓
falls nötig nachfragen
  ↓
Quellen/Bausteine abrufen
  ↓
Experiment planen
  ↓
falls nötig: User bittet im Menü einen neuen Space zu erstellen
  ↓
vorhandenen/ausgewählten Space öffnen oder fachlich ausarbeiten
  ↓
Änderungen verifizieren, falls Code/Manifest geändert wurde
  ↓
Simulation + Daten + Formel erklären
```

## Intent-Klassen

| Intent | Beispiel | Reaktion |
|---|---|---|
| Konzept verstehen | „Warum ist Masse beim Pendel egal?“ | erklären oder Experiment bauen |
| Experiment bauen | „Mach ein Experiment zu Interferenz“ | nachfragen/planen/builden |
| Parameter ändern | „Mach die Masse größer“ | aktuellen Space steuern |
| Daten interpretieren | „Warum ist T fast gleich?“ | Messdaten + Formel erklären |
| Space öffnen | „Zeig mir mein Pendel-Experiment“ | Space aus Registry laden |
| Zu komplex | „Simuliere Turbulenz exakt“ | vereinfachtes Modell anbieten |

## Nachfragen

Die KI fragt nur, wenn es dem Bau hilft:

- „Für welches Niveau?“
- „Willst du eher messen oder nur sehen?“
- „Soll es realistisch oder vereinfacht sein?“
- „Welche Variable möchtest du verändern?“

## Source Retrieval

Der Agent nutzt nicht live GitHub, sondern lokale Quellen:

- `sources/catalog.json`
- `sources/summaries/*.md`
- `sources/formulas/*.json`
- `builder/templates/*`

## Agent-/Space-Tools Zielbild

Tools im Node/pi-Server:

- `source_search(query)` — lokale Quellen/Formeln/Bausteine suchen
- `space_get_current()` — ausgewählten Space lesen
- `space_write_current_file(file, content)` — nur erlaubte Dateien im ausgewählten Space schreiben
- `space_verify_current()` — Pflichtdateien und JSON prüfen

Nicht als Agent-Tool:

- kein autonomes `space_create`; neue Spaces erstellt der Mensch im Menü
- kein autonomes `space_register`; Registrierung passiert über die Space-API nach User-Aktion
- keine generischen `bash/write/edit/read` Runtime-Tools im Schülerflow

## Qualitätsregel

Der Agent muss für jeden neuen Space intern beantworten:

1. Was soll der Schüler lernen?
2. Welche Parameter darf er verändern?
3. Was wird gemessen?
4. Welche Formel spiegelt das Ergebnis?
5. Welche Quellen/Bausteine wurden genutzt?
6. Welche Modellgrenzen gibt es?

## Kein sichtbarer Code

Der Agent kann Code erzeugen, aber die Schüler-UI zeigt nur Labor, Daten und Erklärung.
