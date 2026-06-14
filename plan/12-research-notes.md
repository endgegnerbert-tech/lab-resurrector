# 12 — Research Notes und Referenzen

Diese Datei sammelt externe Recherche, die in den modularen Plan eingeflossen ist.

## Educational Simulation UX

Recherche-Ergebnis:

- Simulationen sollen leicht zugänglich, einladend und explorativ sein.
- Gute Defaults und intuitive Controls sind wichtig.
- Direkte Rückmeldung und visuelle Hinweise helfen mehr als lange Instruktionen.
- Hypothesen, Exploration, Feedback und Messdaten unterstützen aktives Lernen.
- UI soll clean, responsive und barrierearm sein.

Referenzen:

- PhET: Research-Based Design Features of Web-based Simulations — https://phet.colorado.edu/publications/Simulation%20Design%20AAPT%2004.pdf
- PhET Interactive Simulations — https://phet.colorado.edu/

## AI Agent Sandboxing

Recherche-Ergebnis:

- AI Coding Agents sollten in isolierten Workspaces/Sandboxes laufen.
- Least Privilege: nur nötige Dateien lesen/schreiben.
- Keine Secrets mounten.
- Audit Logs und Rollback sind wichtig.
- AGENTS.md/Repo-Instructions helfen Agenten, korrekt zu arbeiten.

Referenzen:

- Docker AI Sandboxes — https://docs.docker.com/ai/sandboxes/
- NVIDIA: Sandboxing Agentic Workflows — https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/
- AGENTS.md Best Practices — https://gist.github.com/0xfauzi/7c8f65572930a21efa62623557d83f6e

## OSS License / Provenance / SBOM

Recherche-Ergebnis:

- Komponenten, Lizenzen, Versionen, Quellen und Dependency-Beziehungen sollten maschinenlesbar erfasst werden.
- SPDX/CycloneDX/SBOM-ähnliche Datenstrukturen sind Best Practice.
- Attribution sollte Paket, Version, Lizenz, URL, Autoren/Notices und Dependency-Pfad enthalten.
- CI/Verification sollte problematische Lizenzen markieren oder blocken.

Referenzen:

- SBOM Observer License Compliance — https://docs.sbom.observer/how-to/license-compliance
- Qt SBOM Docs — https://doc.qt.io/qt-6/sbom.html
- FOSSA Attribution Docs — https://docs.fossa.com/docs/generating-attributions
- Yocto SBOM Docs — https://docs.yoctoproject.org/dev/dev-manual/sbom.html

## RAG / Grounding

Recherche-Ergebnis:

- Dokumente sollten semantisch sinnvoll gechunked werden.
- Chunks brauchen Metadaten: Quelle, Abschnitt, Lizenz, Thema, Parent-ID.
- Hybrid Search + Reranking verbessert Qualität.
- Evaluation sollte Retrieval und Generation getrennt prüfen: Relevanz, Genauigkeit, Faithfulness, Groundedness, Citation Accuracy.

Referenzen:

- Evaluation of Retrieval-Augmented Generation: A Survey — https://arxiv.org/abs/2405.07437
- AWS Prescriptive Guidance: Documentation Best Practices for RAG — https://docs.aws.amazon.com/prescriptive-guidance/latest/writing-best-practices-rag/best-practices.html
- Microsoft RAG Solution Design and Evaluation Guide — https://github.com/MicrosoftDocs/architecture-center/blob/main/docs/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide.md

## OSS Physics Candidate References

Bereits identifizierte Kandidaten:

- matter-js — https://github.com/liabru/matter-js
- p5.js — https://github.com/processing/p5.js
- myphysicslab — https://github.com/myphysicslab/myphysicslab
- ThePhysicsHub — https://github.com/OpenPsiMu/ThePhysicsHub
- physics-lab — https://github.com/CamGomezDev/physics-lab
- physicshub.github.io — https://github.com/physicshub/physicshub.github.io
- mqurban/Physics-Simulations — https://github.com/mqurban/Physics-Simulations
- SajeelHussain/physics-simulations — https://github.com/SajeelHussain/physics-simulations
- hartejnayar/physics-engine-simulator — https://github.com/hartejnayar/physics-engine-simulator
- PhET simulations — https://github.com/phetsims
- Open Source Physics — https://github.com/OpenSourcePhysics

Hinweis: Vor echter Code-Übernahme muss jede Lizenz im lokalen `sources/catalog.json` verifiziert werden.
