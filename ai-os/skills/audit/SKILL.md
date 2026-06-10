---
name: audit
description: Weekly read-only gap analysis of the AI Operating System against the Four Cs framework (Context, Connections, Capabilities, Cadence). Assesses the current project/setup, scores each layer, and reports the single highest-leverage gap to fix. Makes no changes - assessment only. Run on day 7, then weekly.
---

# /audit — Four Cs gap analysis (read-only)

Assess the active project/setup against the Four Cs. Do NOT change files. Output a
scorecard plus the one gap worth fixing next.

## For each layer, run its pass test

1. **Context** — Could a fresh session answer basic questions about this project?
   Check for a context file, key people, goals, voice rules. Pass / partial / fail.
2. **Connections** — Is live data reachable without manual copy-paste? List what is
   connected vs what still requires pasting.
3. **Capabilities** — Do short phrases trigger multi-step workflows that ship
   artifacts? List existing skills/workflows and obvious missing ones.
4. **Cadence** — Does anything run autonomously and deliver value unattended?

## Output format

- A 4-row scorecard: layer | status | one-line evidence.
- The **single highest-leverage gap** (usually the lowest C that blocks the next one).
- A one-line recommendation to feed into `/level-up`.

Remember the build order: a layer can't be strong if the one below it is weak.
Name the lowest weak layer as the priority.

*Part of the AI-OS kit, adapted from AIS-OS by Nate Herk (MIT).*
