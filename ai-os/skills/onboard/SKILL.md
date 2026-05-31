---
name: onboard
description: One-time setup interview that personalizes the AI Operating System for a new project or for me as an operator. Run this on day one of a new context. Asks a short series of questions, then generates the Context layer files (project context note, connections registry, and seeds the decisions log).
---

# /onboard — AIOS setup interview

Run a focused interview, then generate the Day-1 Context files. Keep it to about
15 minutes. Ask questions in small batches, not all at once.

## Interview (7 questions)

Ask these, adapting wording to whether this is a new PROJECT or the operator's
overall setup:

1. What is this project/business, in two sentences? Who is it for?
2. What outcome defines success in the next 30-90 days?
3. What are the recurring tasks you do that feel manual or repetitive?
4. What systems hold your live data? (calendar, tasks, docs, repos, email)
5. Who are the key people, and what is each one's role?
6. What is your voice and any hard formatting rules for outputs?
7. What is the single biggest constraint slowing you down right now?

## Then generate

After the interview, create or update:

- `CONTEXT.md` (project root) or `context/` notes — the project Context layer.
  Capture answers 1, 2, 5, 6 so a fresh session passes the Context test.
- `connections.md` — registry of systems from answer 4, with reachable/not status.
- `decisions/log.md` — seed it with the onboarding decision and the named constraint.
- A short "automation candidates" list from answers 3 and 7, for the first `/level-up`.

## Finish

Summarize what you built, confirm the Context test ("a fresh session could answer
basic questions"), and recommend running `/audit` in 7 days.

*Part of the AI-OS kit, adapted from AIS-OS by Nate Herk (MIT).*
