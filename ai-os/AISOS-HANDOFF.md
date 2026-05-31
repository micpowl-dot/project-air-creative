---
title: AISOS — Full Context Handoff
type: handoff
purpose: Self-contained brief so a fresh Claude Code session on desktop can implement the dedicated AISOS repo exactly as decided
audience: Future me + Claude Code (desktop)
source_branch: claude/obsidian-phone-access-JRZrE (in micpowl-dot/project-air-creative)
target_repo: github.com/micpowl-dot/aisos  (to be created)
engine_credit: Adapted from AIS-OS by Nate Herk (https://github.com/nateherkai/AIS-OS), MIT
tags: [ai-os, handoff, implementation, moc]
created: 2026-05-31
status: ready-to-implement
---

# AISOS — Full Context Handoff

> [!abstract] Read this first
> This note is a complete handoff. If you are a fresh Claude Code session, read it
> top to bottom and you will know the goal, every decision already made, the current
> state of the work, and the exact steps to finish. Do not re-litigate the decisions
> below. They are settled. Implement them.

---

## 1. The goal

Stand up a **dedicated, standalone `aisos` GitHub repo** that is a personal AI
Operating System: a versatile, cross-project framework that turns Claude Code into
an always-on operating brain. It must be clean and able to plug into any project
(starting with Project AIR), not tied to any single one.

The framework is adapted from **AIS-OS by Nate Herk** (MIT). Two mental models:
the **Three Ms** (how the operator thinks) and the **Four Cs** (how the system is built).

---

## 2. Decisions already made (settled — do not redo)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Adopt AIS-OS as a cross-project AI Operating System | Want versatile AI leverage everywhere, not one-off per project |
| D2 | Home base for human-readable content = **Obsidian vault** | Syncs to phone; where the operator lives and captures |
| D3 | Reach into projects via **global brain + per-project context** | Operating manual + skills install once at `~/.claude/`; each project keeps one thin `CONTEXT.md` |
| D4 | Engine lives in a **dedicated standalone `aisos` repo** | Clean separation; pluggable into anything; real version history |
| D5 | Vault holds a **thin launcher note**, repo holds the engine | Repo = engine, vault note = ignition key + dashboard + phone capture inbox |
| D6 | Sync model = **separate repo + thin launcher note** (not vault-as-repo, not mirrored docs) | Most phone-friendly; no git needed on mobile; manual/skills read via GitHub on phone |

**Operating context:** orchestrating from phone now; desktop implementation later.
That is why the heavy lifting (repo creation, extraction, global install) is queued
for desktop and only the launcher note was actioned on mobile.

---

## 3. Target architecture

```
github.com/micpowl-dot/aisos   ← THE ENGINE (standalone, version-controlled)
├── CLAUDE.md                  operating manual (Three Ms, Four Cs, voice, ritual)
├── references/3ms-4cs-framework.md
├── decisions/log.md           cross-project decision record
├── templates/project-context-TEMPLATE.md
└── skills/{onboard,audit,level-up}/SKILL.md

~/.claude/   (each desktop machine)   ← GLOBAL BRAIN (auto-loads everywhere)
├── CLAUDE.md      ← copy/merge from aisos/CLAUDE.md
└── skills/        ← copy from aisos/skills/*

Obsidian vault   ← HUMAN FRONT DOOR (synced to phone)
└── AISOS-Launcher.md    ignition key, weekly loop, capture inbox, project links

Each project repo (e.g. project-air-creative)   ← CONSUMER
└── CONTEXT.md    thin per-project context (the WHAT; global supplies the HOW)
```

Global brain (HOW I work) + per-project context (WHAT this project is).

---

## 4. Current state — what already exists

All engine files are already built and committed. They are **staged inside the
Project AIR repo** as a temporary holding area (deliberate: durable + phone-synced).

- **Repo:** `micpowl-dot/project-air-creative`
- **Branch:** `claude/obsidian-phone-access-JRZrE`
- **Location:** `ai-os/` at repo root

```
ai-os/
├── AISOS-HANDOFF.md                    ← this file
├── AISOS-Launcher.md                   ← vault launcher (already sent to phone)
├── INSTALL.md                          ← install guide
├── global-CLAUDE.md                    ← becomes aisos/CLAUDE.md
├── decisions/log.md
├── references/3ms-4cs-framework.md
├── templates/project-context-TEMPLATE.md
└── skills/
    ├── onboard/SKILL.md
    ├── audit/SKILL.md
    └── level-up/SKILL.md
```

Nothing has been installed to `~/.claude/` yet. The `aisos` repo does not exist yet.
The launcher note has been delivered to the phone for the vault.

---

## 5. Desktop implementation — do these steps

> [!note] Why a human does step A
> Claude Code's access in the originating session was scoped to
> `project-air-creative` only, so it could not create the `aisos` repo or push to it.
> Create the repo yourself (one click), then Claude can do the rest.

**A. Create the repo.** On github.com or via `gh`:
```bash
gh repo create micpowl-dot/aisos --private --description "Personal AI Operating System"
```

**B. Get the engine files.** Pull this branch and copy `ai-os/` contents into the new repo:
```bash
git clone https://github.com/micpowl-dot/project-air-creative.git
cd project-air-creative && git checkout claude/obsidian-phone-access-JRZrE

git clone https://github.com/micpowl-dot/aisos.git
cd aisos
cp -R ../project-air-creative/ai-os/* .
mv global-CLAUDE.md CLAUDE.md          # the operating manual is the repo's CLAUDE.md
rm AISOS-HANDOFF.md                    # handoff lives in the vault, not the engine repo (optional)
git add . && git commit -m "Seed AISOS engine" && git push -u origin main
```

**C. Install the global brain** (repeat on each machine you use Claude Code):
```bash
mkdir -p ~/.claude/skills
cp aisos/CLAUDE.md ~/.claude/CLAUDE.md          # MERGE if one already exists, do not blindly overwrite
cp -R aisos/skills/* ~/.claude/skills/          # enables /onboard /audit /level-up everywhere
```

**D. Wire up Project AIR as the first consumer:**
```bash
# in the project-air-creative repo
cp aisos/templates/project-context-TEMPLATE.md ./CONTEXT.md
# then fill it in, or run /onboard and let it generate
```

**E. Confirm the launcher link.** In the vault `AISOS-Launcher.md`, set the `repo:`
frontmatter to the real `aisos` URL.

**F. Smoke test.** Open a fresh Claude Code session in any folder and run `/audit`.
If the skill is found and runs, the global install worked.

---

## 6. File manifest (what each thing is)

| File | Becomes / lives at | Role |
|------|--------------------|------|
| `global-CLAUDE.md` | `aisos/CLAUDE.md` then `~/.claude/CLAUDE.md` | Always-on operating manual |
| `skills/onboard/SKILL.md` | `~/.claude/skills/onboard/` | One-time project setup interview |
| `skills/audit/SKILL.md` | `~/.claude/skills/audit/` | Weekly read-only Four Cs gap analysis |
| `skills/level-up/SKILL.md` | `~/.claude/skills/level-up/` | Weekly Three Ms interview, scopes one automation |
| `references/3ms-4cs-framework.md` | `aisos/references/` + vault | Framework deep-dive |
| `decisions/log.md` | `aisos/decisions/` | Cross-project decision record |
| `templates/project-context-TEMPLATE.md` | copied into each project as `CONTEXT.md` | Thin per-project context |
| `AISOS-Launcher.md` | Obsidian vault | Human front door + capture inbox |
| `INSTALL.md` | `aisos/` | Install reference |

---

## 7. The frameworks (so a fresh session has full context)

**Three Ms — the operator's brain**
- Mindset: "To what extent can AI leverage this?" is the default question before any new task.
- Method: Constraint → EAD (Eliminate / Automate / Delegate) → Map → Autonomy level → KPI.
- Machine: Build boring, reliable workflows. Dull and dependable beats clever and fragile.

**Four Cs — the architecture (climb in order)**
1. Context: a fresh session can answer basic questions about the project.
2. Connections: live data reachable without manual copy-paste.
3. Capabilities: a short phrase triggers a multi-step workflow that ships an artifact.
4. Cadence: the system delivers value with the laptop closed.

**Three signals it is working:** team asks but the AIOS answers faster with exact
sources; context-switching drops; knowledge leaves your head into retrieval.

**Voice / output rules:** direct and concise; bullets over paragraphs; short
sentences; no em dashes; external-facing content is a draft until approved.

---

## 8. Bootstrap prompt (paste into Claude Code on desktop)

> Read `AISOS-HANDOFF.md` in full. The decisions in section 2 are settled. Then
> execute section 5 (Desktop implementation) step by step. I have already created
> the `aisos` repo. Stop and confirm with me before any step that overwrites an
> existing `~/.claude/CLAUDE.md`.

---

## 9. Open items / next actions

- [ ] Create `micpowl-dot/aisos` repo
- [ ] Seed it from `ai-os/` (section 5B)
- [ ] Install global brain to `~/.claude/` (5C)
- [ ] Add `CONTEXT.md` to Project AIR (5D)
- [ ] Fix `repo:` link in vault launcher (5E)
- [ ] Smoke test `/audit` (5F)
- [ ] First real run: `/onboard` Project AIR, then `/audit`

---

*Engine adapted from AIS-OS by Nate Herk (MIT). "The Three Ms of AI"™ and
"The Four Cs of an AIOS"™ are his trademarks. Attribute when reusing.*
