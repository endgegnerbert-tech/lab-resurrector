# 07 — UI/UX Design

## Grundprinzip

Die App ist ein Labor mit Chat, nicht ein Chat mit Mini-Preview.

## Layout-Ziel

```text
┌──────────────────────────────────────┬──────────────────────┐
│ Space / Simulation                   │ AI Experimentleiter   │
│ Canvas, Play, Reset, direkte Controls│ Chat                 │
├──────────────────────────────────────┼──────────────────────┤
│ Daten & Messwerte                    │ Formel & Rechnung     │
│ Tabelle, Graph, Live-Werte           │ Einsetzen, Ergebnis   │
└──────────────────────────────────────┴──────────────────────┘
```

## Hauptbereiche

### 1. Space-Menü

- Liste dauerhafter Spaces
- „Neuen Space per Chat bauen“
- letzte Spaces schnell öffnen

### 2. Simulation

- großer Fokusbereich
- Play/Pause/Reset
- Parameter nah an der Simulation
- unmittelbares visuelles Feedback

### 3. Chat

- AI fragt nach, erklärt, führt durch Experimente
- kurze Antworten
- sokratische Fragen, wenn sinnvoll
- kein Prompt-Engineering vom User nötig

### 4. Datenpanel

- Live-Messwerte
- Tabelle
- kleine Graphen
- Vergleich vorher/nachher

### 5. Formel/Rechnung

- relevante Formel
- Variablen erklärt
- aktuelle Werte eingesetzt
- Ergebnis interpretiert
- Modellgrenzen sichtbar, aber nicht störend

## UX-Regeln aus Recherche

Aus PhET-/Educational-Simulation-Best-Practices:

- einfache Defaults
- intuitive Controls
- direkte Rückmeldung
- Exploration fördern
- wenig schwere Instruktionen
- visuelle Hinweise statt Textwände
- aktive Hypothesenbildung unterstützen
- mobile/responsive Layouts
- Barrierearmut berücksichtigen

## Didaktischer Flow

Nicht hart als Modus sichtbar, aber im Verhalten:

1. Hypothese: „Was erwartest du?“
2. Test: Parameter ändern / Simulation starten
3. Beobachtung: Daten messen
4. Reflexion: Formel + Ergebnis vergleichen

## Design-Ton

- ruhig, modern, wissenschaftlich
- nicht überladen
- Schüler soll sofort experimentieren können
- AI soll nicht dominieren; Experiment ist Hauptobjekt

## Mobile

Auf kleinen Screens:

- Simulation oben
- Chat einklappbar
- Daten/Formel als Tabs

## Anti-Pattern

Nicht machen:

- riesiger Chat als Hauptprodukt
- feste Liste aus 2–3 Sims als Endzustand
- Messdaten verstecken
- Formel ohne Zahlen zeigen
- AI behauptet Ergebnis ohne Experiment/Daten
