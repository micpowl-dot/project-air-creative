# Brand Intake Agent

An AI-powered creative brief intake tool built for AIR Creative. Before the first client meeting, a team member at the partner company chats with this agent. The agent asks all the right questions one at a time, then outputs a fully structured Creative Brief that Michael and Mark can walk into the meeting with.

Built as a single self-contained HTML file. No build step, no npm, no framework. Open it in a browser and go.

---

## What it does

1. Asks the client about their company, project type, deliverables, audience, tone, timeline, scale, tooling, budget signal, and success definition.
2. Asks one question at a time in a natural conversation.
3. When it has enough information, outputs a formatted **Creative Brief** block.
4. Lets the client (or you) click **Copy Brief** to grab the structured text.
5. Includes a **Start Over** button to reset for a new engagement.

---

## How to use it

1. Open `index.html` in any modern browser (Chrome, Safari, Edge, Firefox).
2. Paste your **Anthropic API key** (starts with `sk-ant-`) into the field at the top.
   - The key is stored only in memory. It is never sent anywhere except directly to the Anthropic API. Refreshing the page clears it.
3. Click **Start** (or press Enter).
4. The agent will open the conversation. Answer its questions.
5. When the brief is generated, click **Copy Brief** to copy it to your clipboard.
6. Paste into Notion, Google Docs, email, or wherever you keep project briefs.

---

## Deploying to Vercel

You do not need to run `npm install` or any build step. The file is static HTML.

**Option A: Drag and drop**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag the `brand-intake-agent/` folder into the upload area.
3. Click Deploy. Done.

**Option B: Vercel CLI**
```bash
# Install the CLI once if you haven't
npm i -g vercel

# From the brand-intake-agent folder
cd path/to/brand-intake-agent
vercel --prod
```

Vercel will detect it as a static site and deploy `index.html` as the root.

---

## Sharing with clients

After deploying, share the Vercel URL with the client contact before the first meeting. Ask them to go through the intake at least 24 hours before the call so you have the brief in hand.

The client will need an Anthropic API key to use the tool. If you want to avoid asking clients to provide their own key, you can embed your key directly in the HTML (replace the key input field with a hardcoded variable). Note: that means anyone with the URL can use your API credits.

---

## Tech stack

- Pure HTML / CSS / JavaScript. Zero dependencies installed locally.
- [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts
- [Tabler Icons](https://tabler.io/icons) via CDN
- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages) — model: `claude-opus-4-5`
- Dark theme matching AIR Creative visual language (#030712 background, #c8910a amber accent)

---

## Files

```
brand-intake-agent/
├── index.html   ← The entire app. This is all you need.
└── README.md    ← This file.
```

---

Built by The Weather Company Creative + AI.
