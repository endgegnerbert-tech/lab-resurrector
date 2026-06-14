# 08 — Daten, Formeln und Messungen

## Warum das zentral ist

LabResurrector soll kein passives Animationsspiel sein. Ein Experiment braucht:

- veränderbare Parameter
- beobachtbare Messwerte
- Formelmodell
- Rechnung mit aktuellen Werten
- Interpretation

## Measurement API

Jeder Space soll Messwerte an die Haupt-App senden:

```js
window.ExperimentAPI.emitMeasurement({
  t: 1.25,
  period: 1.42,
  velocity: 3.1,
  energy: 4.8
});
```

## Pflichtanzeigen

### Live-Werte

Beispiel:

```text
Zeit: 4.2 s
Periodendauer: 1.42 s
Energie: 4.8 J
```

### Tabelle

| t | x | y | v | Energie |
|---|---|---|---|---|

### Graph

- x(t)
- v(t)
- Energie(t)
- Intensität(x) bei Wellen/Optik

### Formel

```text
T = 2π√(L/g)
```

### Rechnung

```text
L = 2.0 m, g = 9.81 m/s²
T = 2π√(2.0 / 9.81)
T ≈ 2.84 s
```

## Formelbank

Startstruktur:

```text
sources/formulas/
  mechanics.json
  waves.json
  optics.json
  electricity.json
```

## Beispiele für Messwerte pro Bereich

### Mechanik

- Position
- Geschwindigkeit
- Beschleunigung
- Energie
- Impuls
- Periodendauer
- Reichweite

### Wellen

- Frequenz
- Wellenlänge
- Amplitude
- Phase
- Interferenzintensität

### Optik

- Einfallswinkel
- Ausfallswinkel
- Brechungswinkel
- Brennweite
- Bildweite

### Elektrizität

- Spannung
- Strom
- Widerstand
- Leistung
- Ladung

## Modellgrenzen

Jede Formel kann `validWhen` enthalten:

```json
{
  "formula": "T = 2π√(L/g)",
  "validWhen": "kleine Auslenkung, masseloser Faden, keine Reibung"
}
```

Das verhindert falsche Allwissenheit.

## Agent-Verhalten

Der Agent soll Antworten möglichst auf Messwerte beziehen:

- „Wir sehen in den Daten ...“
- „Die Formel sagt ...“
- „Die Abweichung kommt vom Modell/der numerischen Simulation ...“
