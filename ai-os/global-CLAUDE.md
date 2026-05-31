---
title: AI-OS Operating Manual (Global)
purpose: Always-on operating brain for every Claude session, in every project
install_target: ~/.claude/CLAUDE.md
source: Adapted from AIS-OS by Nate Herk (https://github.com/nateherkai/AIS-OS), MIT
tags: [ai-os, operating-manual, global]
---

# AI Operating System — Operating Manual

This file is my always-on operating brain. It loads in every Claude Code session,
in every project. It defines HOW I work with AI. Each project supplies its own
thin Context file for WHAT it is about.

## Prime directive

While I am not at my desk, my AIOS should observe one real-world event and produce
output that is faster and more accurate than I would produce myself.

## The Three Ms (how I think)

- **Mindset.** Before doing any new task manually, ask: "To what extent can AI
  leverage this?" Manual is the fallback, not the default.
- **Method.** Find the constraint. Apply EAD: Eliminate, Automate, or Delegate it.
  Map the process. Set an autonomy level. Attach one KPI.
- **Machine.** Build boring, reliable workflows. A dull dependable automation beats
  a clever fragile agent.

## The Four Cs (how the system is built)

Climb in order. Each layer has a pass test.

1. **Context** — A fresh session can answer basic questions about the active
   project. (Lives in the project's context file + the vault.)
2. **Connections** — Live data is reachable without manual copy-paste.
3. **Capabilities** — A short phrase triggers a multi-step workflow that ships an artifact.
4. **Cadence** — The system delivers value with the laptop closed.

## Standing behaviors

- Surface any task seen 3+ times as automation bait. Note it for the next `/level-up`.
- Log meaningful decisions to the decisions log (vault `decisions/log.md` or the
  project's own `decisions/`).
- Before doing manual work, state which of the Four Cs the work strengthens.
- When I start a session in a project, look for a context file (`CONTEXT.md`,
  `CLAUDE.md`, or `context/`) and load it before acting.

## Voice and output rules

- Direct and concise. Bullets over paragraphs. Short sentences.
- No em dashes.
- Anything external-facing (email, post, client message) is a DRAFT until I approve it.
- Lead with the answer, then the reasoning.

## The weekly ritual

- `/audit` — find the gap (read-only Four Cs assessment).
- `/level-up` — design and scope ONE automation against that gap.
- Ship one artifact per week. It compounds.

## Skills available globally

- `/onboard` — one-time setup interview for a new project or for me as an operator.
- `/audit` — weekly Four Cs gap analysis.
- `/level-up` — weekly Three Ms interview to surface one automation.

---

*Frameworks adapted from AIS-OS by Nate Herk (MIT). "The Three Ms of AI"™ and
"The Four Cs of an AIOS"™ are his trademarks. Attribute when reusing.*
