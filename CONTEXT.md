---
title: "Project AIR — Context"
purpose: Thin per-project Context layer for the AI-OS. Lives in the project repo.
tags: [ai-os, context, project]
---

# Project AIR — Context

> The global operating manual (~/.claude/CLAUDE.md) supplies HOW I work.
> This file supplies WHAT this project is. Keep it short. A fresh session should
> be able to answer basic questions about the project from this file alone.

## What it is
Project AIR: AI in Reach is The Weather Company's company-wide AI adoption effort, centered on AI Day (June 9, 2026) for about 600 North American employees (830 total) across Brookhaven HQ in Atlanta, Andover, Birmingham UK, Seoul, and New York. The vibe is festival energy, SXSW meets Coachella, not a tech conference. The creative team ships five deliverables: speaker posters, hats and wristbands, an animated logo, a PowerPoint template, and swag.

Note: Project AIR is our own project. It is not Air.Inc (air.inc), an outside company we reference only as a benchmark. Never conflate the two.

## Success (next 30-90 days)
All five deliverables produced, approved, and handed to print and production vendors in time for AI Day on June 9, 2026. Posters to Atlas, swag to its vendors, PowerPoint template and logo final.

## Key people
| Person | Role |
|--------|------|
| Michael Powell | Creative Director, project lead |
| Mark Fredo | Executive Creative Director |
| Lee Payne | Senior Designer, PowerPoint template and posters |
| Camille Nettles | Associate Creative Director, poster system and swag |
| Jeff Hampton | Copy and AI |
| Denise Denson | Producer and Traffic |

## Voice / output rules
Plain English, no developer jargon (Michael is not a developer). No em-dashes anywhere, use commas or restructure. End each task with a short "Ready to test" summary: what changed, how to check it, what to expect.

## Connections
- GitHub repo (single source of truth, markdown): https://github.com/micpowl-dot/project-air-creative
- Figma Component Library: https://www.figma.com/design/aA0XvBM7frH7uFqnUc2Xn1
- Figma Poster System (Camille, slot/variant/palette): https://www.figma.com/design/cN02srfPOLg8jLZRI9iMiB/Project-AIR
- Figma source poster reference: https://www.figma.com/design/dlIEOdbrJRmxYf6137QX4a/Untitled?node-id=1-11
- Program tracker (Google Sheets): https://docs.google.com/spreadsheets/d/1MeFqM1FKk18r-EPdNGhBm_D0aMqk1Hj-yJjrcHyZ5Y4/edit
- Mission Control dashboard: https://micpowl-dot.github.io/project-air-creative/
- n8n aggregator writes asset-tracker-status.json every 15 minutes from Slack, Drive, GitHub, Figma, and PPTX
- Slack: #project-air-tracker, #project-air-creative, #project-air-production

Reachability gap caught 2026-06-01: Camille's poster system Figma link was stranded on side branches (progress-2026-05-20-checkpoint and update-d1-00-visual-system-started) and never reached main, so it could not be found. It is now surfaced in the README. Lesson: resource links must land on main, not side branches.

## Automation candidates
- Auto-surface any resource link (Figma, Drive, etc.) committed on a non-main branch, so nothing gets lost again.
- Poster batch generation from the slot/variant/palette manifest.json via n8n.
- Status rollup that tells real progress on side branches apart from "no activity on main."

## Decisions
Project decisions live in decisions/ in the repo (see DEC-001 creative direction). Cross-project calls go in the AISOS decisions log.
