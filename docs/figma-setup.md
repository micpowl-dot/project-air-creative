# Figma + Claude Code Setup Guide

> How to connect your Figma account to Claude Code with full read/write access.
> Do this once and Claude can read, create, and edit Figma files on your behalf.

---

## Before You Start

You need:
- Claude Code installed on your machine
- A Figma account (Editor seat — not Viewer)
- About 5 minutes

> **Important:** You must have an **Editor** seat in Figma, not a Viewer seat.
> Viewers are read-only — Claude cannot make changes on your behalf without edit access.
> Ask Michael to upgrade your seat if needed.

---

## Step 1 — Generate a Figma Personal Access Token

This token is what lets Claude authenticate as you in Figma.

1. Open Figma and click your profile picture (top left)
2. Go to **Settings**
3. Scroll to **Security**
4. Under **Personal access tokens**, click **Generate new token**
5. Give it a name — something like `Claude Code`
6. Set expiration to your preference (90 days is a reasonable default)
7. Under **Scopes**, select:
   - ✅ **File content** — read/write
   - ✅ **Variables** — read/write
   - ✅ **Dev resources** — read/write
8. Click **Generate token**
9. **Copy the token immediately** — Figma only shows it once

---

## Step 2 — Add the Figma MCP Server to Claude Code

Open your terminal and run this command, replacing `YOUR_TOKEN` with the token you just copied:

```bash
claude mcp add --transport http figma https://figma.com/api/mcp \
  --header "Authorization: Bearer YOUR_TOKEN" \
  --scope user
```

`--scope user` means this connects across all your projects, not just this one.

---

## Step 3 — Verify the Connection

Open Claude Code and run:

```
/mcp
```

You should see **figma** listed with a green status and a count of available tools. If it shows as disconnected, double-check your token was copied correctly.

---

## Step 4 — Test It

Ask Claude something Figma-specific to confirm it's working:

> *"What Figma files do I have access to?"*

or

> *"Show me the Project AIR Figma workspace."*

If Claude responds with real file names and content, you're connected.

---

## Troubleshooting

**"Read-only" or permission errors**
Your Figma seat is set to Viewer. Ask Michael to upgrade you to Editor in the Figma project settings.

**Token not working**
Make sure you copied the full token with no extra spaces. Tokens start with `figd_`. Regenerate if needed.

**Server shows as disconnected in /mcp**
Run `claude mcp remove figma` and add it again from Step 2.

**Token expired**
Figma tokens expire based on the setting you chose. Generate a new one in Figma Settings and re-run the Step 2 command.

---

## Your Token is Private

Never share your personal access token with anyone or commit it to the repo.
It authenticates as **you** — anyone with it can act as you in Figma.

---

## Questions

Ask Michael Powell — michael.powell@weather.com

---

*Last updated: 2026-05-12*
