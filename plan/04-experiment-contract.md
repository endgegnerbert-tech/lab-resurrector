# 04 — Experiment Contract

## Warum ein Contract nötig ist

Die App soll nicht wissen müssen, welches Experiment gebaut wird. Daher muss jedes Experiment maschinenlesbar beschreiben:

- Titel
- Physik-Konzept
- Engine
- Parameter
- Messwerte
- Formeln
- UI-Hinweise

## Minimaler Contract

```json
{
  "schemaVersion": 1,
  "id": "pendulum-period",
  "title": "Pendelperiode untersuchen",
  "domain": "physics",
  "engine": "matter-js",
  "level": "school",
  "concepts": ["Pendel", "Periodendauer", "Gravitation"],
  "parameters": {
    "mass": {
      "label": "Masse",
      "min": 1,
      "max": 10,
      "step": 0.5,
      "default": 2,
      "unit": "kg"
    }
  },
  "measurements": [
    {
      "id": "period",
      "label": "Periodendauer",
      "unit": "s"
    }
  ],
  "formulas": [
    {
      "id": "pendulum-period",
      "name": "Pendelperiode",
      "formula": "T = 2π√(L/g)",
      "variables": {
        "T": "Periodendauer",
        "L": "Länge",
        "g": "Gravitation"
      }
    }
  ]
}
```

## Pflichtfelder

- `schemaVersion`
- `id`
- `title`
- `domain: physics`
- `engine`
- `concepts`
- `parameters`
- `measurements`
- `formulas`

## Engines

Erlaubte Start-Engines:

- `matter-js` für Mechanik/Kollision/Constraints
- `p5.js` für Wellen, Optik, Felder, einfache Visualisierungen
- `canvas-2d` für sehr einfache eigene Renderer

## Parameter-Regeln

Jeder Parameter braucht:

- Label
- min/max
- default
- unit
- didaktische Bedeutung optional

Beispiel:

```json
"length": {
  "label": "Länge",
  "min": 0.5,
  "max": 5,
  "default": 2,
  "unit": "m",
  "meaning": "Längere Pendel schwingen langsamer."
}
```

## Formel-Regeln

Formeln müssen nicht nur Text sein. Sie brauchen:

- Namen
- Formelstring
- Variablenbeschreibung
- optional Beispielrechnung
- optional Gültigkeitsbereich

Beispiel Gültigkeitsbereich:

```json
"validWhen": "Kleine Auslenkung, idealisiertes Pendel, Luftwiderstand vernachlässigt"
```

## Builder-Verantwortung

Der Agent darf keinen Space registrieren, wenn das Manifest fehlt oder nicht validiert.
