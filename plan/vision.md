# 🔮 flabs Vision — The Curated Knowledge Engine

> *From isolated formulas to a living, agent-powered experiment design system*

---

## 🧬 What the Research Says — This Future Is Already Happening

These aren't pipe dreams. Every capability in this vision document is backed by real, published systems from 2025–2026:

### 🤖 Agentic AI Already Runs Real Physics Experiments

> A language-model–driven agentic AI system was deployed at the **Advanced Light Source particle accelerator** (Berkeley Lab) — it autonomously executed multi-stage physics experiments and **cut expert preparation time by two orders of magnitude**. [¹](#sources)

**flabs takeaway:** If an AI can run experiments at a synchrotron light source, it can certainly run a water rocket in a browser tab. The agent doesn't just chat — it *operates* the lab.

### 🧠 Multi-Agent Systems Generate Physics Code from Natural Language

> **MCP-SIM** (npj Artificial Intelligence, 2025) is an open-source multi-agent framework that converts natural language prompts into executable finite element simulations — with **self-correction, error recovery, and multilingual educational reports**. [²](#sources)

**flabs takeaway:** The same pattern — agent interprets → generates code → runs simulation → explains results — maps directly onto flabs' space system. MCP-SIM proves this approach works at research-grade fidelity.

### ⚡ Neural Physics Models Predict in Real-Time

> **NVIDIA PhysicsNeMo** is an open-source framework for training neural physics models (neural operators, GNNs) that replace expensive solvers with **real-time AI-accelerated predictions**. [³](#sources)

**flabs takeaway:** Imagine a student drags a parameter slider and sees instant physics predictions — not just animation, but an AI model predicting the outcome. That's PhysicsNeMo-level capability, made accessible via the curated database.

### 🔌 Bring Your Own AI Is the Industry Standard

> Industry leaders (Hugging Face, AWS, Salesforce, Portkey) all ship **multi-provider architectures** in 2025–2026 — zero vendor lock-in, single API across 50+ model providers. [⁴](#sources)

**flabs takeaway:** flabs already does this via the pi SDK. The curated database makes this even more powerful — the **knowledge is model-agnostic**. Switch from DeepSeek to Claude to Ollama and the experiments keep working, the formulas keep returning, the patterns keep matching.

### 💾 Vector Databases Are Agent Long-Term Memory

> In 2026, vector databases serve as **long-term memory for AI agents** — enabling recall across sessions, real-time retrieval at scale, and hybrid search (dense + keyword) for exact formula matching. [⁵](#sources)

**flabs takeaway:** This is what turbovec becomes. Every experiment, every hypothesis, every measurement gets embedded. A student returns a week later and the agent remembers: *"Last time you tried 3 bar at 30°. Want to compare with 4.5 bar at 45°?"*

---

## The Core Idea

**flabs today** has local JSON formula files and a source catalog. The agent queries them via `source_search`, `physics_formula_lookup`, and `physics_source_policy`. It works — but it's static, flat, and the agent has to re-discover patterns every time.

**flabs vision** turns this into a **curated, self-growing knowledge engine** — a rich vector-indexed database (powered by turbovec) where:

1. **Every experiment, formula, and source** is indexed as structured, searchable embeddings
2. **The agent uses it as primary reasoning context** — not just a lookup table, but a design assistant
3. **New experiments feed back into the database** — the system gets smarter over time
4. **Real-time feedback loops** connect measurements, predictions, and agent suggestions

---

## 🏗️ Architecture: The Curated Database

```
┌─────────────────────────────────────────────────────────┐
│                    CURATED KNOWLEDGE ENGINE              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  turbovec Vector Index                           │   │
│  │                                                  │   │
│  │  ● Formula embeddings   (mechanics, waves, …)    │   │
│  │  ● Source metadata      (license, usage, url)    │   │
│  │  ● Experiment manifests (params, measurements)   │   │
│  │  ● OSS repo summaries   (patterns, capabilities) │   │
│  │  ● Student Q&A history  (common misconceptions)  │   │
│  │  ● Design patterns      (UI patterns, controls)  │   │
│  └──────────────┬──────────────────────────────────┘   │
│                  │                                       │
│  ┌──────────────┴──────────────────────────────────┐   │
│  │  Curator Layer                                  │   │
│  │                                                  │   │
│  │  ● pi Agent scans OSS repos → extracts patterns │   │
│  │  ● Validates licenses before ingestion           │   │
│  │  ● Generates embeddings + metadata               │   │
│  │  ● Flags stale or deprecated entries             │   │
│  └──────────────┬──────────────────────────────────┘   │
│                  │                                       │
│  ┌──────────────┴──────────────────────────────────┐   │
│  │  Query Layer (used by agent tools)               │   │
│  │                                                  │   │
│  │  ● semantic_search(concept) → top-k matches     │   │
│  │  ● design_pattern(query) → similar experiments   │   │
│  │  ● capability_lookup(source) → what can it do?  │   │
│  │  ● misconception_check(hypothesis) → known traps│   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 What Becomes Possible

### 1. Agent-Designed Experiments (No-Code Lab Creation)

Today: Agent writes `index.html` + `sketch.js` manually using tools.

**Vision:** Student says *"I want to see how air resistance changes a pendulum's damping"* — the agent:

1. Queries turbovec for: pendulum formulas + air resistance models + damping patterns
2. Retrieves a **design template** tuned for that exact combination
3. Generates parameters, measurements, and a hypothesis prompt automatically
4. Builds the experiment in seconds — with real-time drag visualization

### 2. Real-Time Experiment Feedback Loops

Today: Measurements go to the data panel. The agent can read them if asked.

**Vision:** Every 100ms, the agent receives structured measurement streams:

```
Experiment → measurement stream → turbovec logs → agent sees pattern
                                                            ↓
Agent: "I notice your rocket reached only 70% of the predicted
height. This suggests water exhaustion before peak. Try raising
the water ratio to 40% and increasing pressure to 4 bar."
```

The agent doesn't wait for questions — it **proactively guides** based on live data against predicted models.

### 3. Cross-Experiment Knowledge Discovery

Today: Each experiment is isolated.

**Vision:** The agent connects concepts across experiments:

- *"The 45° optimum you saw in projectile motion? Same principle explains why water rockets fly farthest at 35-45° — it's thrust + trajectory combined."*
- *"The wave interference pattern you're seeing? That's the same math as quantum probability clouds."*

### 4. Idea Generation & Experiment Design

The curated database enables a **creative loop**:

```
Student curiosity → search turbovec for related concepts
                         ↓
              Agent finds pattern gaps ("no one has simulated X")
                         ↓
              Agent proposes: "Want to build the first flabs X experiment?"
                         ↓
              Student + agent co-design parameters, measurements
                         ↓
              Experiment runs → data flows back into turbovec
                         ↓
              Next student benefits from everything learned
```

### 5. Source Curator (License-Safe Growth)

Every entry in turbovec includes:

```json
{
  "source": "myphysicslab",
  "pattern": "pendulum_ode_solver",
  "license": "Apache-2.0",
  "allowedUse": "adapted-code-with-attribution",
  "ingestedBy": "pi-agent-v0.1",
  "confidence": 0.92,
  "crossRefs": ["matter-js/pendulum", "phetsims/pendulum-lab"]
}
```

The **curator agent** runs weekly:
- Scans new OSS repos for physics sim patterns
- Validates licenses against the policy engine
- Generates embeddings + capability summaries
- Flags stale items for review

---

## 🧪 Phased Rollout

### Phase 1: Foundation (MVP — current)
- ✅ Local JSON formula files (mechanics, waves, optics, electricity)
- ✅ Source catalog with license policies
- ✅ `source_search`, `physics_formula_lookup`, `physics_source_policy` tools
- ✅ `physics_model_plan` for experiment design

### Phase 2: Vector Index (Next)
- [ ] turbovec integration — index all formulas + manifests + source summaries
- [ ] Semantic search replaces keyword search
- [ ] Measurement history stored per experiment session
- [ ] Agent can query "what happened last time someone tried X"

### Phase 3: Proactive Feedback (Near-term)
- [ ] Real-time measurement stream → agent monitors deviation from model
- [ ] Automatic suggestions when experiment diverges from prediction
- [ ] Misconception detection: "You increased mass but period didn't change — that's because mass cancels out in T = 2π√(L/g)"

### Phase 4: Cross-Experiment Intelligence (Medium-term)
- [ ] Knowledge graph across experiments and concepts
- [ ] Agent proposes new experiments based on gaps in the graph
- [ ] "Nobody has tested double-slit with variable phase here — want to build it?"

### Phase 5: Curator Agent (Long-term)
- [ ] Autonomous OSS scanning → pattern extraction → license validation → ingestion
- [ ] Community-contributed experiments (with review)
- [ ] Curriculum-aware: "This experiment maps to 8th-grade physics standard X"

---

## 💡 Example: What This Looks Like for a Student

### Without Vision Engine:
```
Student: "What if I launch at 60°?"
Agent: *changes angle to 60°* "Observe the trajectory."
```

### With Vision Engine:
```
Student: "What if I launch at 60°?"

Agent: 
1. 🔍 turbovec: projectile_motion + optimal_angle_analysis
   → Found: "60° gives 13% less range than 45° at same speed,
     but 22% more max height"
2. 📊 Real-time comparison:
   ┌──────────┬─────────┬──────────┐
   │ Angle    │ Range   │ Max Ht   │
   ├──────────┼─────────┼──────────┤
   │ 45°      │ 28.3 m  │ 7.1 m    │
   │ 60°      │ 24.5 m  │ 8.7 m    │
   └──────────┴─────────┴──────────┘
3. 💡 Insight: "60° trades range for height. Great if you're
   trying to clear an obstacle! This is why water rocket
   competitions optimize for mission, not max range."
4. 💬 Suggested next: "Want to add a wind factor and see
   how 60° vs 45° handles gusts differently?"
```

---

## 🔗 Connection to Current Architecture

| Current Tool | Vision Upgrade |
|-------------|---------------|
| `source_search` (keyword) | `semantic_search` (embedding-based) |
| `physics_formula_lookup` | `formula_with_context` (formula + examples + limits + related concepts) |
| `physics_model_plan` | `model_plan_auto` (auto-generates experiment.json from concept) |
| `space_write_current_file` | `design_from_template` (selects + customizes template based on query) |
| `sim_set_param` | `sim_adaptive_feedback` (agent suggests + auto-tunes parameters based on measurements) |
| `emet` (live research) | `emet_integrated` (results automatically indexed into turbovec for reuse) |

The **emet** integration is key — when the agent fetches live research, those results get embedded and cached, so next time someone asks the same question, it's instant.

---

## 📐 Technical Sketch (turbovec Integration)

```javascript
// Future server.js — turbovec integration sketch

import { createIndex } from 'turbovec';

const knowledgeIndex = createIndex({
  dimension: 384,  // all-MiniLM-L6-v2 compatible
  metric: 'cosine',
});

async function ingestExperiment(manifest, sketchCode, measurements) {
  const chunks = [
    { text: JSON.stringify(manifest), type: 'manifest' },
    { text: sketchCode, type: 'code' },
    { text: JSON.stringify(measurements), type: 'measurements' },
  ];
  for (const chunk of chunks) {
    await knowledgeIndex.add({
      id: `${manifest.id}/${chunk.type}`,
      text: chunk.text,
      metadata: { type: chunk.type, spaceId: manifest.id, title: manifest.title },
    });
  }
}

async function searchKnowledge(query, topK = 5) {
  const results = await knowledgeIndex.search(query, topK);
  return results.map(r => ({
    text: r.text,
    score: r.score,
    metadata: r.metadata,
  }));
}
```

---

## ✨ The Ultimate Goal

> **flabs becomes the platform where any student can go from curiosity → experiment → understanding → new curiosity — all in one browser tab, guided by an AI that has perfect knowledge of physics, licensed sources, and every experiment ever run on the platform.**

The curated knowledge engine (turbovec) is the **memory** of the platform. Every experiment, every question, every insight makes it smarter for the next student.

---

## Sources

1. *Agentic AI for Multi-Stage Physics Experiments at a Large-Scale User Facility Particle Accelerator* — arXiv 2509.17255, 2025
2. *MCP-SIM: A self-correcting multi-agent LLM framework for language-based physics simulation and explanation* — npj Artificial Intelligence, 2025
3. [NVIDIA PhysicsNeMo](https://developer.nvidia.com/physicsnemo) — Open-source neural physics framework
4. [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers/index) — Multi-provider, zero lock-in, 2025
5. [Top Vector Databases for AI Agents: A 2026 Developer Guide](https://pratikpathak.com/top-vector-databases-for-ai-agents-a-2026-developer-guide/) — pratikpathak.com
6. [smolagents](https://huggingface.co/docs/smolagents/index) — Hugging Face, open-source code agent library
7. [PhysicsAgentABM](https://huggingface.co/papers/2602.06030) — Physics-guided generative agent-based modeling, 2025
8. [BrowserAgent](https://arxiv.org/html/2510.10666v2) — Web agents with human-inspired browsing actions, 2025
9. [AI SDK](https://ai-sdk.dev/docs/foundations/providers-and-models) — Model-agnostic provider architecture
10. [AWS Multi-Provider Generative AI Gateway](https://aws.amazon.com/blogs/machine-learning/streamline-ai-operations-with-the-multi-provider-generative-ai-gateway-reference-architecture/) — 2025
11. PhET Interactive Simulations — gold-standard experiment design patterns
12. pi SDK — agent tool system, custom tool creation, session management
13. AIRIS Concept — Heidelberg University of Education (2026)
