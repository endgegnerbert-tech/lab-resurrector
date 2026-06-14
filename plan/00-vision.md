# 00 — Vision

## Ein Satz

**LabResurrector ist ein AI-Lab-Playground, der aus vorbereiteten Open-Source-Physik-Bausteinen dauerhafte, isolierte Browser-Experimente erzeugt — inklusive Simulation, Messdaten, Formel und Rechnung.**

## Warum

Viele Schüler haben kein Physiklabor, keine Geräte, kein Budget und keinen Lehrer, der jederzeit individuell erklären kann. LabResurrector soll Physik-Experimente über Browser + AI zugänglich machen.

## Was der User erlebt

Der User schreibt frei in den Chat:

- „Ich will verstehen, warum Masse beim Pendel egal ist.“
- „Mach mir ein Experiment zu Interferenz.“
- „Zeig mir, wie ein Hebel funktioniert.“
- „Kann ich sehen, was bei mehr Reibung passiert?“

Die KI entscheidet selbst:

1. Muss sie nachfragen?
2. Gibt es schon einen passenden Space?
3. Muss ein neuer Space gebaut werden?
4. Welche Quellen/Bausteine/Formeln braucht sie?
5. Welche Daten müssen gemessen werden?

## Produktversprechen

Nicht: „Wir ersetzen jedes echte Labor perfekt.“

Sondern:

> „Wir geben jedem Schüler ein kostenloses, interaktives Physik-Labor im Browser, das viele schulische Experimente dynamisch bauen, erklären und messbar machen kann.“

## Zielgruppe

- Schüler 12–18
- Lehrer, die schnell digitale Experimente brauchen
- Homeschooler
- Hackathon-/Maker-/STEM-Lernumgebungen
- Schulen ohne Laborbudget

## Fachlicher Scope zuerst

Nur Physik.

Priorität:

1. Mechanik
2. Wellen
3. Optik
4. Elektrizität
5. einfache Thermodynamik
6. einfache moderne Physik

## Nicht-Ziele für MVP

- kein Live-GitHub-Scraping im Schülerfluss
- keine vollständige CFD/FEM/High-Precision-Simulation
- kein Chemie-/Bio-MVP
- kein sichtbarer Code-Editor für Schüler
- keine öffentliche Lizenz-/Quellen-Komplexität in der UI
- kein Wechsel auf FastAPI, solange Node/pi die Runtime trägt
