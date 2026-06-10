# AI-OS Kit — Install Guide

A portable AI Operating System adapted from [AIS-OS](https://github.com/nateherkai/AIS-OS)
(by Nate Herk, MIT). Designed for **global, cross-project** use.

**Design:** Global brain + per-project context.
- **Vault = home base** (synced to your phone): canonical, editable source of truth.
- **`~/.claude/` on each machine** = installed operating manual + skills, auto-loaded everywhere.
- **Each project** = one thin context file.

## What's in this kit

```
ai-os/
├── INSTALL.md                          # this file
├── global-CLAUDE.md                    # → install to ~/.claude/CLAUDE.md
├── skills/
│   ├── onboard/SKILL.md                # → ~/.claude/skills/onboard/SKILL.md
│   ├── audit/SKILL.md                  # → ~/.claude/skills/audit/SKILL.md
│   └── level-up/SKILL.md               # → ~/.claude/skills/level-up/SKILL.md
├── references/3ms-4cs-framework.md     # → keep in vault (and/or ~/.claude/)
├── decisions/log.md                    # → keep in vault
└── templates/project-context-TEMPLATE.md  # → copy into each new project as CONTEXT.md
```

## Step 1 — Put the home base in your Obsidian vault

Copy `references/`, `decisions/`, and a copy of `global-CLAUDE.md` (rename to
`AI-OS Operating Manual.md`) into a folder in your vault, e.g. `AI-OS/`.
This is your editable, phone-synced source of truth. Edit here; it stays with you.

## Step 2 — Install the global brain on each machine running Claude Code

On any computer where you run Claude Code:

```bash
# operating manual (loads in every session, every project)
mkdir -p ~/.claude
cp ai-os/global-CLAUDE.md ~/.claude/CLAUDE.md   # or merge into your existing one

# the three skills (become /onboard, /audit, /level-up everywhere)
mkdir -p ~/.claude/skills
cp -R ai-os/skills/onboard  ~/.claude/skills/
cp -R ai-os/skills/audit    ~/.claude/skills/
cp -R ai-os/skills/level-up ~/.claude/skills/
```

If you already have a `~/.claude/CLAUDE.md`, merge rather than overwrite.

> **Phone note:** skills only *run* inside Claude Code (CLI/desktop/web), not inside
> the Obsidian app. On your phone the vault is for reading, editing, and capture.
> Running `/audit` and `/level-up` happens in a Claude Code session on a machine, or
> in Claude Code on the web pointed at a repo.

## Step 3 — Add a thin context file to each project

For Project AIR and any future project, copy the template:

```bash
cp ai-os/templates/project-context-TEMPLATE.md ./CONTEXT.md
```

Fill it in (or run `/onboard` and let it generate the files for you).

## Daily / weekly loop

- New project: run `/onboard` once.
- Every week: `/audit` to find the gap, then `/level-up` to ship one automation.

---

*Frameworks © Nate Herk, MIT. "The Three Ms of AI"™ / "The Four Cs of an AIOS"™ are his trademarks.*
