# Content Brief: "AI Helped Me..." Live Experience

> **Tracker ID:** D6
> **Type:** Interactive / Design + Build
> **Requested by:** Maigh Houlihan
> **Owner:** — (Michael Powell coordinating)
> **Deadline:** Test-ready by June 6, live June 9 (AI Day)
> **Status:** 🟡 In Progress (concept shared, "yes, and" welcome)

## Objective

Create a live, build-as-you-go attendee experience for AI Day. Attendees take a photo at the photo station / balloon arch, scan a QR code that drops their image into a shared Google Drive folder, and from there the image flows into a public "waterfall" display on the office TVs and a personal follow-up to the person who took it. Short written stories about what AI helped people do get woven into the same display. The wall gets richer through the day as more people join, works across all offices, and lets people at home take part too.

## The Three Components

### 1. Branded experience + waterfall display
- The design team's workflow picks up each uploaded image, processes it (a branded frame is the working idea), and drops it into a new output folder.
- An HTML page pulls from that output folder and shows a live "waterfall" of AI-transformed images, designed to look great on the office TVs.
- It builds in real time, so the display gets richer as more people participate.
- Location agnostic: runs across the three main offices, and folks at home can participate too.
- Becca is on board.

### 2. Personal delivery
- Because we know who uploaded each image, we follow up with that person directly: either a link to their processed image or the image itself, delivered by email.

### 3. Slack stories
- A thread in the Slack channel solicits short "what AI helped me do" stories.
- Stories under a set character limit get featured in the display, held in the foreground/center for roughly 20 seconds (long enough to read a few sentences) while images fall behind them.
- Open to treating them as just another content tile instead. Maigh's note: don't over-engineer this.

## What We Need to Build (Maigh's explicit asks)

1. **HTML waterfall page** that pulls from the output folder and displays beautifully on the office TVs.
2. **Email delivery logic** for the personal follow-up to each uploader.

## Key Messages

1. AI is in reach: real people at TWC doing real things with AI.
2. Participation is effortless: take a photo, scan, you're on the wall.
3. It is shared and alive: the experience grows with the room across every office.

## Open Questions to Resolve Before Build

- Character limit for featured Slack stories ("under X characters").
- Is the branded frame confirmed, and who owns the image-processing step in the design workflow?
- Office TV display specs (resolution, aspect ratio, orientation).
- How do "folks at home" submit (same QR/Drive flow or a separate path)?
- Relationship to the separate AI Day **prompt card** (D5-03) that started this thread.

## Review Checklist

- [ ] Aligns with content strategy
- [ ] Follows style guide
- [ ] Correct brand voice
- [ ] Approved by lead
