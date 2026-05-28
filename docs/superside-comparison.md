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
| **SaaS/apps layer** | None | Poster Generator, PPT Distiller, Video Distiller, Brand Intake Agent, Mission Control |
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

## The Project AIR Proof Point

Project AIR is the working prototype of everything in this document. What would have cost $150K to $200K at a traditional agency was produced by a team of six people with AI, using exactly the tools and model described above: a GitHub-based Brand Brain, a Figma component library with slot-and-variant architecture, n8n automation workflows, a Claude project loaded with brand context, a manifest-driven poster generation system, a live Mission Control dashboard, and a programmatic PowerPoint generator. The system did not just produce assets. It left behind a running operation. That is the model.

---

## Next Steps for Tuesday

- **Michael + Mark:** Agree on the two or three FP partner companies you want to name as the first pilot candidates before walking into the room. Rohit will ask.
- **Michael:** Draft a one-page "Partner Requirements to Start" sheet (executive sponsor, embedded person, 90-day pilot) that can be handed to a prospective partner. This is the filter that keeps scope from exploding.
- **Mark:** Confirm whether the Apps as a Service layer (Poster Generator, PPT Distiller) is something we want to show as a live demo or describe as a roadmap item in the pitch. That changes how we frame it.
- **Both:** Decide how to handle the custom AI image model gap. Options are: (a) name it as Phase 2 with a rough timeline, (b) quietly leave it off the pitch until we have it, or (c) bring in a partner tool (Midjourney fine-tune, Flux, etc.) to cover it in the near term.
