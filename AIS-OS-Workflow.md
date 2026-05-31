---
title: AIS-OS — AI Operating System Workflow
source: https://github.com/nateherkai/AIS-OS
author: Nate Herk
license: MIT
tags:
  - ai
  - workflow
  - operating-system
  - automation
  - moc
created: 2026-05-31
status: reference
---

# 🧠 AIS-OS — Personal AI Operating System

> [!abstract] What this is
> A free, MIT-licensed starter kit (by **Nate Herk**) that turns **Claude Code**
> into a personal *AI Operating System* (AIOS). Built for solopreneurs, operators,
> managers, and creators who want reliable AI leverage without heavy engineering.
>
> **Core principle:** *"While you're not at your desk, your AIOS observes one
> real-world event and produces faster, more accurate output than you would yourself."*

This note is my working adaptation of the repo. Original source:
[github.com/nateherkai/AIS-OS](https://github.com/nateherkai/AIS-OS)

---

## 🎯 The two frameworks

### The Three Ms — *the operator's brain*

How **you** think about applying AI.

| M | Question | In practice |
|---|----------|-------------|
| **Mindset** | "To what extent can AI leverage this?" | Default question before doing any new task manually. |
| **Method** | Constraint → **EAD** → Map → Autonomy → KPI | Find the bottleneck, then **E**liminate / **A**utomate / **D**elegate it, map the process, set an autonomy level + a metric. |
| **Machine** | Build boring, reliable workflows | Prefer dull, dependable automations over clever fragile agents. |

### The Four Cs — *the architecture*

How the **system** is built. Each layer has a pass/fail test.

| C | Layer | Success test |
|---|-------|--------------|
| **Context** | AI knows your business | A fresh Claude session can answer basic questions about you/your work. |
| **Connections** | AI accesses live data | Queries calendar, tasks, files without manual copy-paste. |
| **Capabilities** | AI runs workflows | A short phrase triggers a multi-step process that ships a real artifact. |
| **Cadence** | AI runs autonomously | The system delivers value with your laptop closed. |

> [!tip] Build order
> Climb the Cs in order. You can't have **Cadence** (autonomous runs) until you
> have **Capabilities** (defined workflows), which need **Connections** (data),
> which need **Context** (knowledge). Don't skip down the stack.

---

## 🛠️ The three skills (slash commands)

| Skill | What it does | When |
|-------|--------------|------|
| `/onboard` | 7-question setup interview; generates your Day-1 files | Day 1 (~15 min) |
| `/audit` | Four-Cs gap analysis (read-only assessment) | Day 7, then weekly |
| `/level-up` | Three Ms interview; surfaces **one** automation to build | Day 14, then weekly |

**The weekly ritual:** `/audit` to find the gap → `/level-up` to ship one
automation against it. One artifact per week compounds fast.

---

## 📁 Repo structure (for reference)

```
AIS-OS/
├── CLAUDE.md            # the operating manual
├── connections.md       # registry of connected systems
├── context/             # who you are / your business
├── references/
│   └── 3ms-framework.md # the framework deep-dive
├── decisions/log.md     # decision history
└── .claude/skills/      # /onboard, /audit, /level-up
```

---

## 🚀 Quick start

1. Clone the repo to a machine running Claude Code.
2. Run `/onboard` (~15 min) — answers personalize the whole system.
3. Use it for a week on real decisions.
4. **Day 7:** run `/audit` to find gaps.
5. **Day 14:** run `/level-up` to design one automation.
6. **Week 3+:** weekly `/level-up` → one shipped artifact per week.

---

## ✅ How I'll know it's working (the 3 signals)

- [ ] **Team reaches out to me — but the AIOS answers faster & with exact sources.** I'm no longer the knowledge bottleneck.
- [ ] **Context-switching drops.** My default for a new task is to *ask the AIOS*, not open five apps.
- [ ] **Knowledge leaves my head.** I stop memorizing facts and trust retrieval.

---

## 🔗 Adapting this to Project AIR

> [!note] My angle
> [[CLAUDE]] already gives me a strong **Context** layer for the Project AIR
> creative work. AIS-OS is the missing operating-system wrapper around it.

Mapping the Four Cs onto my current setup:

- **Context** — Mostly done. [[docs/design-brief]], [[docs/brand-guidelines]],
  [[decisions/DEC-001-creative-direction]], and `team/*/notes.md` already feed a
  fresh session. *Gap: is it queryable, or just readable?*
- **Connections** — Weakest layer. No live link to calendar, asset reviews, or
  the [[docs/campaign-calendar|campaign calendar]] dates. **First thing to fix.**
- **Capabilities** — Candidate workflows to turn into skills:
  - Generate a speaker-poster draft from a name + headshot + talk title
  - Spin up a new `team/[name]/notes.md` with the "Current Direction" block
  - Log a decision to `decisions/` + update the relevant notes (the handoff process)
- **Cadence** — Later. e.g. a weekly digest of what changed before AI Day (June 9).

### Next actions
- [ ] Decide: clone AIS-OS standalone, or graft its `/audit` + `/level-up` skills into this repo
- [ ] Run a `/level-up`-style pass on the 3 capability candidates above
- [ ] Stand up one **Connection** (campaign calendar → live query)

---

## 📌 Voice / working-style notes (from their CLAUDE.md)

- Direct, concise. Bullets over paragraphs. Short sentences.
- No em dashes.
- External-facing content → draft + approval before sending.
- Flag any task that's happened **3+ times** as automation bait for `/level-up`.

---

*Source: [AIS-OS](https://github.com/nateherkai/AIS-OS) by Nate Herk, MIT License.
"The Three Ms of AI"™ and "The Four Cs of an AIOS"™ are his trademarks — attribute when reusing.*
