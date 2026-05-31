---
name: level-up
description: Weekly ideation interview using the Three Ms (Mindset, Method, Machine) to surface and scope ONE automation to build this week. Reviews accumulated automation candidates and repetitive tasks, picks the highest-leverage one, and produces a concrete build spec. Run on day 14, then weekly.
---

# /level-up — Three Ms automation interview

Surface exactly ONE automation to ship this week. Scope it, then offer to build it.

## Gather

Pull the automation candidates list (from `/onboard` and from tasks seen 3+ times).
If none exist, ask: "What did you do this week that was manual and repetitive?"

## Apply the Three Ms

- **Mindset.** For the top candidates, ask "To what extent can AI leverage this?"
  Rank by leverage x frequency.
- **Method.** For the winner: name the constraint. Choose EAD (Eliminate / Automate /
  Delegate). Map the steps. Set an autonomy level (suggest / draft-for-approval /
  fully autonomous). Define one KPI.
- **Machine.** Spec the boring reliable version. What triggers it (a short phrase)?
  What artifact does it produce? What are the guardrails and the approval gate?

## Output: a build spec

- Name and trigger phrase
- Inputs and data sources needed (ties back to Connections)
- Steps the workflow runs
- Artifact produced
- Autonomy level + approval gate
- KPI to watch

Then offer to build it now as a new skill or workflow. One artifact per week.

*Part of the AI-OS kit, adapted from AIS-OS by Nate Herk (MIT).*
