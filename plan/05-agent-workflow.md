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
Space erzeugen oder vorhandenen Space öffnen/verändern
  ↓
Space verifizieren
  ↓
Space registrieren
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

## Builder Tools Zielbild

Neue Tools im Node/pi-Server:

- `source_search(query)`
- `source_get(id)`
- `space_create(id, title)`
- `space_write_file(spaceId, path, content)`
- `space_register(spaceId)`
- `space_verify(spaceId)`
- `space_open(spaceId)`

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
