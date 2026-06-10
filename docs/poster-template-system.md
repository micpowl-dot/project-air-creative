# Poster Template System

A modular system for building Project AIR posters. The source poster (AI Day — N8N Workflows in action, Maya Smith) is treated as the **reference composition**. Every other poster is the same set of slots filled with swapped variants. You build the variant library once in Figma; n8n (or any other tool) picks one option from each slot to generate a poster.

Source reference: Figma file `dlIEOdbrJRmxYf6137QX4a`, node `1:11`.

---

## How the system works

A poster = **composition slots** + **slot variants** + **color palette**.

- **Slots** are fixed positions in the layout. They do not move between posters.
- **Variants** are the swappable contents of a slot. Each variant is a Figma component or component-set.
- **Palette** is a 5-role color set. Swap the whole palette to re-skin a poster without touching slot variants.

When you ask me to "add a new ring style" or "add a teal/orange palette," that means dropping a new variant into one of the slots below or a new palette into the palette table.

---

## Element catalog (the slots)

Tag format: `[zone]/[slot]/[variant-name]`. Use the tag verbatim as the Figma component name so n8n can match by string.

| # | Slot tag | Zone | Purpose | Reference variant on source poster | Notes |
|---|----------|------|---------|-----------------------------------|-------|
| 1 | `bg/field` | full bleed | Solid background color | `bg/field/magenta` | Pulls `palette/dominant`. One layer, no texture. |
| 2 | `top-edge/graphic` | top strip | Decorative banner across top edge | `top-edge/graphic/piano-stripes` | Vertical bars in alternating palette roles. Other planned variants: `wave-bars`, `dot-row`, `arc-stack`. |
| 3 | `top-edge/curve` | top strip | Flowing line overlay on top graphic | `top-edge/curve/ribbon-yellow` | Single open path. Color = `palette/accent-primary`. |
| 4 | `upper-left/date` | upper left | Event date display type | `upper-left/date/june-9-2026` | Text component. Bold display face. Color = `palette/anchor-dark`. One letter/digit accented (the "26" of 2026 in `palette/accent-primary`). |
| 5 | `center/ring-badge` | center | Concentric ring "target" behind portrait | `center/ring-badge/concentric-12` | Component-set. Variants by ring count (`-6`, `-9`, `-12`, `-spiral`). Ring color = `palette/dominant` darker step; ring stroke optional. |
| 6 | `center/portrait` | center | Square rounded headshot of host/subject | `center/portrait/maya-smith` | Image fill, fixed rounded-rect mask. Image is the only thing that changes per poster — keep mask + frame constant. |
| 7 | `mid-left/title-block` | left of center | Session title, 2–4 lines, bold | `mid-left/title-block/n8n-workflows` | Text component with **per-character accent slot**: tag one or two glyphs as `accent` so they pick up `palette/accent-primary` (see the "8" in N8N, the "W" in Workflows). |
| 8 | `mid-left/host-line` | below title | Host/speaker caption | `mid-left/host-line/host-maya-smith` | Smaller weight. Prefix "Host" is constant; name is the variable. |
| 9 | `mid/squiggle` | crosses mid-band | Hand-drawn flowing accent line | `mid/squiggle/single-loop` | Single path. Color = `palette/accent-primary`. Other planned: `double-loop`, `zig`, `figure-8`. |
| 10 | `bottom-left/pattern-block` | bottom left | Grid/diamond texture block, partial bleed off bottom-left | `bottom-left/pattern-block/diamond-grid` | Tiled component. Other planned: `dot-grid`, `cross-hatch`, `iso-cube`, `wave`. Tint = darkened `palette/dominant`. |
| 11 | `bottom-right/lockup` | bottom right | AIR brand mark + "AI IN REACH" tagline | `bottom-right/lockup/air-stacked-dark` | Two variants minimum: `-dark` and `-light` (for light vs dark palettes). Lockup itself is locked — no per-poster edits. |
| 12 | `meta/text-accent-rule` | system-wide | Defines which characters in the title get the accent color | n/a — rule, not visual | Document this in Figma as a description: "Pick 1–2 glyphs in the title and one digit/letter pair in the date. Apply `palette/accent-primary`." |

### Optional slots (add when needed)
- `upper-right/badge` — campaign or sponsor mark (e.g., "Day 1," "Session 03")
- `bottom-strip/footer` — venue, time, URL
- `center/ring-badge/glow` — soft outer glow ring for night-mode palettes

---

## Color palette system

Every palette is **5 roles**. Posters use the roles, not the hex values directly. Swap palettes to re-skin.

### Palette roles

| Role tag | Function | Reference (AI Day Magenta) |
|----------|----------|----------------------------|
| `palette/dominant` | Background field, ring fills | Magenta `#E6147A` *(approx — confirm from Figma fill)* |
| `palette/accent-primary` | Top curve, mid squiggle, title/date glyph accent, one stripe in top graphic | Yellow `#F5D300` |
| `palette/anchor-dark` | Main typography, ring strokes, dark stripe in top graphic | Brand Dark `#0D142A` |
| `palette/anchor-light` | Light stripe in top graphic, light-mode type | Neutral White `#F0F0EB` |
| `palette/accent-secondary` | Optional second accent (system/alert use, future) | Crimson `#BA0D00` |

### Palette variants (start here, grow over time)

Each new palette must keep the same value relationships as AI Day Magenta:
- `dominant` = saturated mid-value (chroma high, value mid)
- `accent-primary` = saturated high-value (pops against dominant)
- `anchor-dark` = near-black with a hue bias (not pure black)
- `anchor-light` = warm off-white (not pure white)
- `accent-secondary` = saturated, hue ~180° from accent-primary

| Palette name | dominant | accent-primary | anchor-dark | anchor-light | accent-secondary |
|--------------|----------|----------------|-------------|--------------|------------------|
| `palette/ai-day-magenta` *(reference)* | `#E6147A` | `#F5D300` | `#0D142A` | `#F0F0EB` | `#BA0D00` |
| `palette/electric-cyan` *(planned)* | `#00B8D9` | `#FF5C00` | `#0D142A` | `#F0F0EB` | `#E6147A` |
| `palette/deep-violet` *(planned)* | `#5B2A86` | `#FFD400` | `#0D142A` | `#F0F0EB` | `#00E0A4` |
| `palette/hot-amber` *(planned)* | `#FF7A1A` | `#3CE0FF` | `#0D142A` | `#F0F0EB` | `#C8910A` |
| `palette/forest-pulse` *(planned)* | `#1F7A4D` | `#FFCB05` | `#0D142A` | `#F0F0EB` | `#E6147A` |

Add new palettes by appending rows. When you ask me to "add a sunset palette," I write a new row matching these value relationships.

### Figma variable structure

Map each role to a Figma variable so swapping palettes is one click. Suggested tree:

```
palette/
  ai-day-magenta/
    dominant
    accent-primary
    anchor-dark
    anchor-light
    accent-secondary
  electric-cyan/
    ...
```

Each component in the slot catalog references `palette/<active>/<role>` — not a hex. To re-skin, change the active palette mode.

---

## Figma file structure (recommended)

One library file, four pages:

1. **00 — Cover / How to use** — one paragraph + screenshot of reference poster.
2. **01 — Palettes** — swatch grid, one row per palette, columns = roles. Each swatch is a `palette/<name>/<role>` variable preview.
3. **02 — Slots** — one section per slot tag from the catalog. Inside each section, all variants laid out side by side as a component-set so n8n can enumerate them.
4. **03 — Reference posters** — finished compositions (start with AI Day Magenta + Maya Smith). Each is an instance-only file — every element is a component from page 02 + a palette from page 01.

Naming the file in Figma: `Project AIR - Poster System (Library)`. Publish as a team library so other files can pull components.

---

## How to add to the system (for me, going forward)

When you say "add X," I will:

1. **New variant for an existing slot** → append a row under that slot in the catalog with the new tag, then create the component on Figma page 02 under the same slot section.
2. **New palette** → append a row to the palette variants table, matching the value-relationship rules above, then add it to page 01 + the Figma variable tree.
3. **New slot entirely** → add a row to the catalog with a new `[zone]/[slot]` tag and document its purpose, default content, color-role binding, and any rules. Then create a section for it on page 02.

If you tell me only the vibe (e.g., "make a sunset version"), I'll infer the hexes against the value-relationship rules and write them down for you to approve before I touch Figma.

---

## Open questions for you

- **Portrait mask shape** — keep the rounded square, or make `center/portrait` a component-set with `rounded-square`, `circle`, `arch` variants?
- **Title accent rule** — is "1–2 glyphs" the right rule, or do you want it pinned (always the first letter, always a number)?
- **Pattern-block tint** — should the pattern always use a darkened `dominant`, or open it up to use `anchor-dark`?
- **Second accent (`accent-secondary`)** — used on the reference poster? I don't see it in the source; flagging in case you want it dropped from the role set.

---

*Last updated: 2026-05-15. Reference file: `https://www.figma.com/design/dlIEOdbrJRmxYf6137QX4a/Untitled?node-id=1-11`.*
