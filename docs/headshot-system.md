# Headshot System — Cutouts + Palette Backgrounds

> 24 transparent-PNG headshots + 10 palette background plates. **Designed so every portrait can carry its own background** — no shared palette per row, per track, or per section. Each subject gets their own treatment, customizable independently. For posters, badges, the deck, or digital adaptations — no re-rendering from Figma needed.

---

## Where the files live

| What | Where |
|------|-------|
| Cutout headshots + background plates (PNG) | [`assets/separated headshots/`](../assets/separated%20headshots/) |
| Source designs | [Figma — Project AIR Design System, node 600:8505](https://www.figma.com/design/cN02srfPOLg8jLZRI9iMiB/Project-AIR---Design-System?node-id=600-8505) |

---

## What's in the folder

### Cutout headshots (×24)

Each is a single subject with a fully transparent background. Drop onto any background plate (or onto a slide directly) and the edges feather/composite cleanly.

Naming pattern: `Headshot - {First Last}.png`

**Subjects:**

Ben Papandrea · Brennan Gerster · Brian Oneil · Dan Margulies · Dave de Sa · Elizabeth Martin · Erik Petersen · Jack Kreps · James Baker · James Belanger · Javi Quinones · Lauriana Gaudet · Matthew Drooker · Max Jacubowsky · Michelle Killroy · Miguel Gervassi · Rohit Agarwal · Rohit Nutalapati · Sahana Subbanna · Samantha Gates · Sara Peal · Shannon King · Thomas Hinson · Tyler Steben

### Background plates (×10)

Pre-rendered solid-color backgrounds — one per dominant and one per accent across the five palettes. Drop a cutout headshot on top of one of these and you have a complete composition.

Naming pattern: `Headshot BG - {Palette} [Accent].png`

| Palette | Dominant plate | Accent plate |
|---------|----------------|--------------|
| Magenta | `Headshot BG - Magenta.png` | `Headshot BG - Magenta Accent.png` |
| Cyan    | `Headshot BG - Cyan.png`    | `Headshot BG - Cyan Accent.png`    |
| Violet  | `Headshot BG - Violet.png`  | `Headshot BG - Violet Accent.png`  |
| Amber   | `Headshot BG - Amber.png`   | `Headshot BG - Amber Accent.png`   |
| Forest  | `Headshot BG - Forest.png`  | `Headshot BG - Forest Accent.png`  |

---

## How to use

### In PowerPoint / Google Slides
1. Insert the background plate first
2. Insert the cutout headshot on top
3. Resize the headshot to fit; the transparent edges blend automatically
4. No mask, no clipping path needed

### In a poster layout (Figma / Illustrator / Photoshop)
1. Use the source Figma node (600:8505) directly — it has live ring-badge + portrait slots
2. Or composite the PNGs: background plate as bottom layer, cutout headshot on top, layer effects/treatments on top of that

### For digital (Slack, screens, social)
- Backgrounds are square / poster-format. For square crops (social avatars, profile cards), composite then crop.
- For animation, the cutout PNG is the asset to drive — anchor the headshot, animate the background or overlays.

---

## Palette pairings (for reference)

| Name    | Dominant | Accent  | Mood |
|---------|----------|---------|------|
| Magenta | `#FB00FF` | `#F4DC52` (yellow)   | High-energy, openers |
| Cyan    | `#0062FF` | `#67FAE0` (mint)     | (Note: "cyan" key holds royal blue) |
| Violet  | `#46125B` | `#F4DC52` (yellow)   | Anchor / reflective |
| Amber   | `#FF9500` | `#BC1100` (deep red) | Punchy, urgency |
| Forest  | `#1F7A4D` | `#0D142A` (navy)     | Muted, factual |

Anchor neutrals (constants):
- Anchor Dark: `#292929`
- Anchor Light (cream): `#F0F0EB`

---

## Rules of thumb

- **Every portrait carries its own background.** That's the whole point of separating them — you can give each speaker a different palette without re-rendering from Figma. Mix freely across a lineup.
- **One palette per subject.** Within a single portrait composition, don't mix dominant from one palette with accent from another. Pick one palette and use both its dominant and accent on that subject.
- **Anchor neutrals (dark/light) are always available.** Use anchor-light for text on a dominant background; anchor-dark for text on an accent background.
- **Don't crop the cutout headshot.** Hair, shoulders, ears are part of the silhouette — cropping kills the festival-poster feel.

---

## Style reference

[`assets/separated headshots/style-key-2.png`](../assets/separated%20headshots/style-key-2.png) is the canonical visual target. Any new portrait should match this style:

- High-contrast vector illustration (cel-shaded, not photographic)
- Vivid skin tones with cool blue/teal shadows
- Glossy, festival-poster feel — saturated but not garish
- Strong, clean highlights on hair / glasses / fabric folds
- Subject fills the 1200×1200 frame with hair and shoulders intact
- Source rendered on a chroma background (green is fine) so Photoshop's Object Selection isolates cleanly

If the Google Flow output doesn't read like the reference, regenerate before moving to Photoshop. Style drift across portraits will be obvious in a lineup.

## Adding a new subject

The workflow used for the existing 24 (repeat this so every portrait matches the established style):

1. **Google Flow** — take the source photo + illustrate it in the creative/festive style. Generate variations until the illustrated version reads as a recognizable, on-brand portrait.
2. **Photoshop** — open the illustrated portrait. Use the **Object Selection tool** to isolate just the person from the background. Copy.
3. **Figma** — paste into the Project AIR Design System file (node 600:8505). Drop the cutout into a **1200×1200 frame** with the chosen palette background plate behind it.
4. **Export** — transparent PNG of just the cutout (no background), saved as `Headshot - {First Last}.png` to `assets/separated headshots/`. If the subject is getting a new pre-rendered palette background, export that too as `Headshot BG - {Palette}.png`.
5. **Commit + push** to GitHub.

Dimensions and frame: **1200×1200** (square). Cutouts should fill the frame with hair, shoulders, and headroom intact — don't tightly crop to the face.

---

*Last updated: 2026-06-03*
