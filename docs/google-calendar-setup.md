# 📅 Google Calendar Integration — Setup Guide

> How we created the Project AIR meeting invites directly from Claude. Reuse this pattern for any future project.

---

## What This Does

With the Google Calendar MCP connected to Claude Code, Claude can:

- Read all your calendars and team members' calendars
- Create events with Google Meet links, attendees, descriptions, reminders, and color coding
- Update or delete existing events
- Check availability before scheduling

No manual calendar entry. No copy-pasting. Give Claude the meeting list and it creates everything in one shot, with invites sent automatically.

---

## Requirements

1. **Claude Code** (desktop app or CLI)
2. **Google Calendar MCP** connected to your Claude Code session
   - This is a plugin/connector — check with your admin or IT if it's not available
   - At TWC, it was already connected via the Claude Code setup
3. **Your Google account** authenticated through the MCP

That's it. No API keys, no extra setup.

---

## How to Use It — Step by Step

### Step 1: Have your meeting list ready

Before you ask Claude, know:
- Meeting name
- Date and time (with timezone)
- Duration
- Attendees (email addresses)
- Whether you want Google Meet links

### Step 2: Have your .md files in the repo

The invite descriptions link directly to your planning docs. Make sure your meetings doc, game plan, and asset tracker are pushed to GitHub first.

### Step 3: Ask Claude

Paste something like this:

```
Create all [N] meetings on my Google Calendar with Google Meet links.
Include the relevant repo links in each invite description.

Here are the meetings:
[paste your meeting list]

Attendee emails:
- name@company.com
- name@company.com

Repo links to include:
- Meetings doc: [URL]
- Game plan: [URL]
- Asset tracker: [URL]
```

Claude will create all events in parallel and return the Google Meet links for each.

---

## Template Prompt — Copy and Adapt

```
Create [N] Google Calendar events with Google Meet links for the [PROJECT NAME] team.
Send invites to all attendees. Include pre-work and repo links in each description.

Attendees (all meetings unless noted):
- [name]@[company].com
- [name]@[company].com
- [name]@[company].com

Meetings:
1. [Meeting Name] — [Day Date], [Time] [TZ] — [Duration] — [Attendees if different]
2. [Meeting Name] — [Day Date], [Time] [TZ] — [Duration]
3. [Meeting Name] — [Day Date], [Time] [TZ] — [Duration]

Repo links to include in all descriptions:
- Meetings doc: [GitHub URL]
- Game plan: [GitHub URL]
- Asset tracker: [GitHub URL]

Add a 24-hour email reminder and a 30-minute popup reminder to each.
```

---

## What Each Invite Gets (automatically)

- Google Meet link (unique per meeting)
- Full attendee list with invites sent
- Pre-work per person in the description
- Direct links to the relevant .md files
- Email reminder 24 hours before
- Popup reminder 30 minutes before
- Color coding for easy calendar scanning

---

## Updating or Cancelling Events

Just ask Claude:

> "Update Meeting 3 — move it to Wednesday May 20 at 2pm and add Lee Payne"

> "Cancel Meeting 4 and notify attendees"

Claude can update or delete events by name or date without you needing the event ID.

---

## For Future Projects

Repeat this exact pattern:

1. Build the project repo with a `docs/meetings.md` file (use this repo as the template)
2. Push to GitHub
3. Tell Claude the meeting list and attendee emails
4. Claude creates everything and returns the Meet links

The whole thing takes about 2 minutes once the repo is set up.

---

*First used: Project AIR, May 2026*
*Last updated: 2026-05-05*
