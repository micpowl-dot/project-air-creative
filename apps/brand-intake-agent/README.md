# Brand Intake Agent (Prototype)

> **Status: unshipped prototype.** This is an early proof-of-concept mockup, not a deployed product. It has not been built into a real tool, it has not been validated with any client, and it is not in use. The idea is on the Project AIR roadmap as an approach we want to develop. Treat everything below as "how it could work," not "how it works today."

An AI-powered creative brief intake tool, prototyped for Project AIR. The intended idea: before the first client meeting, a team member at the partner company would chat with this agent. The agent would ask all the right questions one at a time, then output a structured Creative Brief that Michael and Mark could walk into the meeting with.

This prototype is a single self-contained HTML file so anyone can open it in a browser and see the concept. It is a demonstration of the approach, not a production tool.

---

## What it would do (concept)

The prototype demonstrates this intended flow:

1. Ask the client about their company, project type, deliverables, audience, tone, timeline, scale, tooling, budget signal, and success definition.
2. Ask one question at a time in a natural conversation.
3. When it has enough information, output a formatted **Creative Brief** block.
4. Let the client (or you) click **Copy Brief** to grab the structured text.
5. Include a **Start Over** button to reset for a new engagement.

None of this has been validated in a real engagement yet.

---

## How to try the prototype

1. Open `index.html` in any modern browser (Chrome, Safari, Edge, Firefox).
2. Paste your **Anthropic API key** (starts with `sk-ant-`) into the field at the top.
   - The key is stored only in memory. It is never sent anywhere except directly to the Anthropic API. Refreshing the page clears it.
3. Click **Start** (or press Enter).
4. The agent will open the conversation. Answer its questions.
5. When the brief is generated, click **Copy Brief** to copy it to your clipboard.
6. Paste into Notion, Google Docs, email, or wherever you keep project briefs.

---

## If we ever take the prototype further

These notes are forward-looking only. Nothing here has been done, and the prototype is not currently hosted anywhere.

Because the file is static HTML with no build step, a future version could be hosted on a static host such as Vercel for internal demos. If that happens, we would also need to decide how API keys are handled before anyone outside the team touches it. Right now this is a local-only mockup, and there is no plan to share it with clients in its current state.

---

## Tech stack

- Pure HTML / CSS / JavaScript. Zero dependencies installed locally.
- [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts
- [Tabler Icons](https://tabler.io/icons) via CDN
- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages), model: `claude-opus-4-5`
- Dark theme matching Project AIR visual language (#030712 background, #c8910a amber accent)

---

## Files

```
brand-intake-agent/
├── index.html   ← The prototype mockup, self-contained in one file.
└── README.md    ← This file.
```

---

Built by The Weather Company Creative + AI.
