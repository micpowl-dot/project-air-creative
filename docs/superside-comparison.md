# Superside Comparison: Building Our Model

**For:** Michael Powell and Mark Fredo
**Meeting:** Tuesday, May 28, 2026
**Purpose:** Benchmark our AI-powered creative agency model against Superside before pitching to Rohit

---

## What Superside Is and Why We Looked at Them

Superside is the closest real-world example of what we are trying to build: a scalable, AI-powered creative operation that feels like an in-house team but runs like a service. They are not a freelance marketplace and not a traditional agency. They sell ongoing creative capacity at enterprise scale, with a proprietary AI memory system (Brand Brain) at the center.

We studied them because they have already solved several problems we need to solve: how to scope and price this kind of work, how to prevent scope creep, how to use AI to make creative production faster without sacrificing brand consistency. Where they fall short is flexibility and access. Their model only works for companies spending $5K to $100K a month with a 12-month upfront commitment. We can serve companies that are not ready for that, and we can leave something behind when we go.

---

## Side-by-Side Comparison

| Dimension | Superside | Our Model |
|---|---|---|
| **Model type** | Subscription DaaS (Design as a Service) | SWAT Sprint + Apps as a Service |
| **Pricing** | $5K–$100K+/month, 12-month paid upfront, $1K/month platform fee | 90-day pilot to prove ROI, then 12-month runway. Apps layer is SaaS pricing. |
| **Brand Brain** | Proprietary AI system: stores guidelines, historical assets, performance data, decision history. Trains custom image models per client. | GitHub repo + Figma library + Claude project + n8n workflows + Mission Control dashboard. Same concept, open architecture. |
| **AI workflow** | 40+ proprietary workflows, 100% of creatives AI-certified, custom AI image models per client | n8n multi-source aggregator, Claude brand context agent, manifest-driven asset generation, automated status reporting |
| **Who picks the team** | Client never picks designers. CPM assigns from global pool. | We run the sprint. Partner must have one embedded person committed. |
| **Delivery model** | "Follow the sun" across 57 countries, 12–24 hr rush turnaround | Sprint-based (virtual or in-person). Not overnight, but not slow either. |
| **What they refuse** | Media buying, unlimited revisions (2 rounds max), designer selection, free trial, custom web dev, open scope | Same no-list, plus: no executive-sponsor-less projects, no work without committed embedded team member |
| **Onboarding** | 2 days to 3 months. Creative Workshop to load brand context. CPM from day one. | Brand Brain setup sprint. We load context into GitHub, Figma, Claude, n8n. Train embedded person before we leave. |
| **Client type** | Enterprise only ($100M+ revenue companies) | FP partner companies, internal TWCo teams. Not enterprise-only. |
| **SaaS/apps layer** | None | Mission Control (live). PPT Distiller, Video Distiller, Brand Intake Agent, Poster Generator (planned, not built) |
| **Revision policy** | 2 rounds standard, zero on rush | Defined in scope. Not unlimited. |

---

## Where We Match Superside (Things Worth Adopting)

**Brand Brain as the center of the model.** Superside's biggest differentiator is not their designers, it is the system that remembers everything. Every project gets smarter because the brand context compounds. We built this with Project AIR using open tools (GitHub, Figma, Claude, n8n), and the concept holds.

**Scoped catalog, not open-ended production.** Superside publishes exactly what they do and what they do not do. No surprises, no "can you also..." We need the same discipline. If it is not on the list, the answer is no.

**12-month runway as the real engagement.** A 90-day pilot proves ROI. A 12-month commitment is where the system compounds and pays off. Superside locks this in upfront. We can earn it.

**The embedded team requirement.** Superside assigns a CPM from day one. We require the partner to have an embedded, AI-willing team member. Same logic: someone at the partner side has to own continuity when we are not there.

**No unlimited revisions.** Revision scope is defined in the brief. This is not a negotiation, it is a quality standard.

---

## Where We Are Different (and Why That Is an Advantage)

**We are inside the company.** Superside is an external vendor. We are TWCo MediaLabs. We can move faster, we already understand the brand landscape, and we are not billing by the hour.

**We leave something behind.** Superside is a dependency. When you stop paying, the Brand Brain stays with them. Our model installs the Brand Brain at the partner company using open tools. They own it.

**Apps as a Service is a revenue layer Superside does not have.** We can build a Poster Generator, a PPT Distiller, a Video Distiller and host them on Vercel. Partner companies pay to access them. That is recurring revenue without us being in the room. Superside cannot do this.

**We have a real pilot model.** Superside requires a 12-month commitment with money on the table before any output is produced. We are proposing 90 days to prove ROI first. Lower barrier to start, which matters for getting the first few partners signed.

**Smaller team is a feature, not a bug.** Superside's 700-person model is built for global enterprise volume. A focused 3-person SWAT team with AI workflows can produce enterprise-quality output at a fraction of that cost, and it is easier to coordinate and control.

---

## What We Are NOT Going to Copy

- No $1K/month platform fee (at least not yet, and not before we have a platform worth charging for)
- No "follow the sun" overnight delivery model requiring staff across time zones
- No locking partners into a 12-month contract before they have seen a single deliverable
- No requiring a minimum monthly spend to get started
- No 700-person headcount model

---

## Service Catalog: Superside vs. Ours

| Superside Offers | We Offer |
|---|---|
| Ad creative | Brand system setup |
| Social assets | Modular design system for scalable asset production |
| Presentation design | Event and campaign creative production |
| Branding | PowerPoint template design |
| Illustration | Short-form video and motion (15–60 seconds) |
| Print and packaging | Social and digital assets |
| eBooks and email design | AI automation workflow setup |
| Web design (Webflow only) | Real-time project dashboards |
| Design systems | Brand intake agents |
| Product design | Apps as a Service deployment (Vercel-hosted tools) |
| Motion graphics | Training and handoff for embedded team members |
| Video production | |
| 3D and AR | |
| Copywriting | |
| Creative strategy | |
| Custom AI brand image models | (gap, see below) |
| AI video and avatars | |
| Voice cloning | |
| Localization | |

---

## Gaps We Need to Close

**1. Custom AI brand image model.**
Superside trains a custom image model per client using their brand assets. We do not have this yet. It is the most technically impressive part of their offering. We should put a roadmap item on this, even if we describe it as "coming in Phase 2" for now.

**2. Brief submission platform.**
Superside has Superspace, their proprietary client portal for submitting briefs and tracking work. We use GitHub today. That is fine for Phase 1 and for a working-doc audience like FP partners who can handle it. Longer term, a lightweight intake interface (even a simple form feeding into n8n) would remove friction for less technical clients.

**3. Formalized onboarding process.**
Superside runs a Creative Workshop session to load brand context before any production starts. We do this informally during the Brand Brain setup sprint. We should write it up as a named, defined process, with a checklist and a deliverable at the end (a "Brand Brain loaded and verified" sign-off). Makes it feel real to partners and to Rohit.

---

## Project AIR Systems Inventory: What We Have Already Built

Most of these are live, documented systems built during Project AIR (our TWCo AI Day project), and each maps to a service we are offering. Two items are NOT built and are flagged as such below: the PPT Distiller as a packaged product (we have the PowerPoint capability through Claude's PowerPoint skill, but no shipped product), and the Brand Intake Agent (an approach we want to build, not yet developed).

> Note: "Project AIR" here is our internal AI Day project. It is not Air.Inc (air.inc), the outside company whose published creative-AI skills we reference separately for benchmarking. The systems below are ours.

---

### 1. Brand Brain (GitHub + Figma + Claude + n8n)

**What it is:** The full brand knowledge system for Project AIR, built across four connected tools.

| Layer | Tool | What it holds |
|---|---|---|
| Brand hub | GitHub repo | Guidelines, decision log, asset tracker, team briefs, style guide, all in markdown |
| Visual library | Figma component library | Logo variants, palette system, type system, slot components, pattern tiles |
| AI context | Claude project | Brand voice, deliverable specs, anti-patterns, team roles, loaded at session start via raw GitHub URLs |
| Live data | n8n + asset-tracker-status.json | Task status, blockers, deadlines, signals from Slack/Drive/GitHub/Figma, written every 15 minutes |

**What it proves:** A brand can be fully loaded into an AI system from open tools, no proprietary platform required. Every creative decision made during Project AIR is logged, searchable, and feedable into the next session automatically.

**Service it supports:** Brand Brain Setup, Brand system setup

---

### 2. Three Live n8n Automation Workflows

**What they are:** Three production automation workflows running on n8n, all tested and active.

| Workflow | Trigger | What it does |
|---|---|---|
| Multi-Source Aggregator | Every 15 minutes | Pulls signals from Slack, Google Drive, GitHub, Figma, and PPTX files. Writes consolidated status to `asset-tracker-status.json` in the repo. |
| Twice-Daily Status Report | 10 AM and 3 PM daily | Reads the JSON, posts a Slack summary to `#project-air-tracker` with overdue items, this-week deadlines, and blockers. Tags relevant team members. |
| Auto-Tracker | Every git push to main | Parses commit messages with `[tracker]` prefix and auto-updates task status in the asset tracker. No manual re-entry. |

**What it proves:** A creative project can self-report. Stakeholders stay informed without anyone writing a status update by hand. This is directly transferable to any partner company running a campaign or event.

**Service it supports:** AI automation workflow setup, Real-time project dashboards

---

### 3. Modular Poster System (Slot/Variant/Palette Architecture)

**What it is:** A scalable poster generation system where every poster is built from the same 11 fixed composition zones, each filled with a swappable variant, all colored from a 5-role palette.

| Component | What it does |
|---|---|
| 11 composition slots | Fixed zones: background, top graphic, date, ring badge, portrait, title block, host line, squiggle, pattern block, brand lockup, text accent rule |
| Slot variants | Each slot has multiple swappable options (concentric-6, concentric-9, concentric-12, diamond-grid, dot-grid, wave, and more) |
| 5-role palette | Every color reference is a role (dominant, accent-primary, anchor-dark, anchor-light, accent-secondary), not a hex value. Swap the palette, the whole poster re-skins. |
| manifest.json | Machine-readable index of all slots, variants, and palettes. n8n reads it to enumerate building blocks and compose posters programmatically. |
| Reference compositions | Finished poster specs stored as JSON. Input a portrait and a session title, output a print-ready poster. |

**What it proves:** A 21-poster campaign (17 ambassadors plus 4 executives, across 3 venues) can be generated from a single template system with no per-poster layout work. Palette swaps re-skin every poster in one step. This works for any company running events, product launches, or campaigns with repeating asset formats.

**Service it supports:** Modular design system for scalable asset production, Event and campaign creative production, Apps as a Service (Poster Generator)

---

### 4. Mission Control Dashboard

**What it is:** A live project tracking dashboard hosted on GitHub Pages, feeding from n8n data every 60 seconds.

**Features:**
- Gantt timeline showing design phase and production phase per deliverable against a real calendar
- Needs attention now strip: overdue items and items due within 7 days, red-tinted
- Stats row: total tasks, days to event, signals processed, blockers, overdue count
- Deliverables table ordered by design deadline with progress bars, owner avatars, and vendor
- Expandable rows showing all 61 individual tasks
- Dark theme, DM Sans, auto-refreshes without a page reload

**Tech:** Single self-contained HTML file, no build step, no framework. Vanilla JS fetching `asset-tracker-status.json` from GitHub. Deploys anywhere.

**What it proves:** A creative team can have a real-time, executive-readable project dashboard for zero additional infrastructure cost. A partner company stakeholder can open a URL and see live project status without asking anyone.

**Service it supports:** Real-time project dashboards, AI automation workflow setup

---

### 5. PowerPoint Generation (Claude PowerPoint Skill + Script)

**What it is:** A working PowerPoint capability, not a packaged product. We generate slides through Claude's PowerPoint skill, and we have a one-off Node.js script (`build-logo-presentation.js`) that produced the logo presentation from a design spec, with no manual work in Keynote or PowerPoint.

**What it generates:**
- Title slide with brand typography and vertical tagline treatment
- Concept slides with light and dark panel layouts for logo mockups
- Concentric arc SVGs generated programmatically (8 rings, accent color on ring 3)
- Hand-drawn scribble overlays (bezier curves, 30% opacity)
- Next steps slide with numbered list in brand amber
- Outputs a `.pptx` file with embedded fonts and images

**What it proves:** A presentation can be generated from a design spec in seconds, and brand updates propagate automatically. To be clear: we have the PowerPoint capability through Claude's skill, but we have NOT built a "PPT Distiller" product. The PPT Distiller is a roadmap idea, not a shipped tool.

**Service it supports:** PowerPoint template design (live capability via Claude's PowerPoint skill). A packaged PPT Distiller app is planned, not built.

---

### 6. Figma Component Library

**What it is:** A published Figma team library that every working file subscribes to. Built during Project AIR as the visual source of truth.

**Contents:**
- Logo in all four variants (color/black-R, color/white-R, all-black, all-white)
- Color system as Figma variables mapped to palette roles, not hex values
- Typography styles (Century Gothic display, IBM Plex Sans body)
- Pattern tile components (concentric arcs, dot grids, stripe fields, diamond grids)
- All 11 poster slot components as component-sets, enumerable by n8n
- Icon library

**What it proves:** A design system can be version-controlled like code. Swapping a palette is a mode change, not a redesign. Any designer on the team pulls from the same library and stays on brand automatically.

**Service it supports:** Brand system setup, Modular design system for scalable asset production, Training and handoff for embedded team members

---

### 7. Claude as Active Team Member

**What it is:** A documented workflow and a working Claude project for using Claude as a named, context-loaded team member throughout production, not just a chat tool.

**How it works:**
- At session start, paste raw GitHub URLs for the current task context (disciplines, asset tracker, style guide)
- Claude reads the latest version from the repo and works from it
- Used throughout Project AIR for: resourcing decisions, creative direction, poster copy, vendor emails, RFQ drafts, status summaries, quality checks against the style guide, and decision support

**What it proves:** A small team can operate above its weight class when Claude has the brand context loaded. The quality of output is consistent because the brief is always in the conversation. This is directly teachable to an embedded team member at a partner company.

**Service it supports:** All services. This is the workflow layer on top of every other system.

---

### 8. Brand Intake Agent (Proposed, NOT built yet)

**What it is:** A proposed approach, not a built or deployed system. We have not developed this. It is a direction we want to incorporate. The idea: a Claude-powered chat app that would collect a full creative brief from a partner company team member before the first meeting.

**How it would work:**
- A partner company team member would open a URL and chat with the agent
- The agent would ask one question at a time across 10 topic areas: company, project type, deliverables, audience, tone, timeline, scale, tooling, budget signal, and success definition
- Once it had enough, it would generate a structured Creative Brief block
- The team member would copy the brief and paste it into email or Slack before the meeting

**Why we want it:** The blank-slate first meeting is preventable. If we build this, we could walk into every engagement already knowing what the partner needs, what tools they have, and what success looks like to them.

**Status:** Idea only. Not started, not deployed.

**Service it would support:** Brand intake agents, Apps as a Service. Not available until built.

---

### Project AIR Systems to Services Map

| Project AIR System | Service Offering |
|---|---|
| Brand Brain (GitHub + Figma + Claude + n8n) | Brand Brain Setup |
| Three n8n workflows | AI automation workflow setup |
| Poster system + manifest.json | Modular design system, Poster Generator app |
| Mission Control dashboard | Real-time project dashboards |
| PowerPoint (Claude skill + generator script) | PowerPoint template design (live). PPT Distiller app: planned, not built |
| Figma component library | Brand system setup, Modular design system |
| Claude workflow | Training and handoff, all production services |
| Brand Intake Agent (proposed, not built) | Brand intake agents, Apps as a Service: planned |

---

## The Project AIR Proof Point

Project AIR is the working prototype of everything in this document. What would have cost $150K to $200K at a traditional agency was produced by a team of six people with AI, using exactly the tools and model described above: a GitHub-based Brand Brain, a Figma component library with slot-and-variant architecture, n8n automation workflows, a Claude project loaded with brand context, a manifest-driven poster generation system, a live Mission Control dashboard, and a programmatic PowerPoint generator. The system did not just produce assets. It left behind a running operation. That is the model.

---

## Next Steps for Tuesday

- **Michael + Mark:** Agree on the two or three FP partner companies you want to name as the first pilot candidates before walking into the room. Rohit will ask.
- **Michael:** Draft a one-page "Partner Requirements to Start" sheet (executive sponsor, embedded person, 90-day pilot) that can be handed to a prospective partner. This is the filter that keeps scope from exploding.
- **Mark:** Confirm whether the Apps as a Service layer (Poster Generator, PPT Distiller) is something we want to show as a live demo or describe as a roadmap item in the pitch. That changes how we frame it.
- **Both:** Decide how to handle the custom AI image model gap. Options are: (a) name it as Phase 2 with a rough timeline, (b) quietly leave it off the pitch until we have it, or (c) bring in a partner tool (Midjourney fine-tune, Flux, etc.) to cover it in the near term.
