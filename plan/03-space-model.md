# 03 — Space Model

## Definition

Ein **Space** ist ein dauerhaft gespeicherter, isolierter Experiment-Playground.

Er enthält Simulation, Parameter, Formeln, Messdaten und interne Provenance.

## Ziel

Der User kann Spaces im Menü öffnen und weiterverwenden. Spaces beeinflussen sich nicht gegenseitig.

## Ordnerstruktur

```text
experiments/
  manifest.json
  spaces/
    pendulum-period/
      index.html
      sketch.js
      experiment.json
      sources.json
      measurements.json
      assets/
```

## Space-Dateien

| Datei | Pflicht | Zweck |
|---|---:|---|
| `index.html` | ja | isolierte Experiment-App |
| `sketch.js` | ja | Simulation/Visualisierung |
| `experiment.json` | ja | maschinenlesbares Manifest |
| `sources.json` | ja | interne Quellen, Lizenzen, Bausteine |
| `measurements.json` | optional | gespeicherte Beispielmessungen |
| `assets/` | optional | lokale Bilder, Daten, kleine Hilfsdateien |

## Space Registry

`experiments/manifest.json` enthält alle Spaces:

```json
{
  "spaces": [
    {
      "id": "pendulum-period",
      "title": "Pendelperiode untersuchen",
      "path": "/experiments/spaces/pendulum-period/",
      "domain": "physics",
      "concepts": ["Pendel", "Gravitation"],
      "createdAt": "2026-06-14T00:00:00Z"
    }
  ]
}
```

## Isolation

Jeder Space:

- eigener Ordner
- eigenes Manifest
- eigene Parameterdefaults
- eigene Messdaten
- kein Import aus anderem Space ohne explizite Registrierung

## Persistenz

Spaces bleiben erhalten, bis sie gelöscht werden. Das Menü liest die Registry und zeigt sie an.

## Legacy-Szenen

Die aktuellen festen Szenen `pendulum` und `projectile` können migriert werden zu:

```text
experiments/spaces/pendulum-basic/
experiments/spaces/projectile-basic/
```
