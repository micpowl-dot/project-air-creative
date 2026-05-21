# System State Snapshot — 2026-05-20

> **For a new Claude chat:** paste this entire file as your first message. Verify state before making changes.

I'm continuing work on the AIR Poster System — a slot-based modular system in Figma for generating event posters and other deliverables. A poster = **composition slots** + **slot variants** + **a palette**. Slots are fixed positions in the layout. Variants are swappable Figma components. Palette is a 4-token color set with 5 modes.

## Project file

- **Figma file key:** `cN02srfPOLg8jLZRI9iMiB`
- **File URL:** https://www.figma.com/design/cN02srfPOLg8jLZRI9iMiB/Project-AIR
- **Reference poster (source of design intent):** node `183:5197`
- **Slot framework spec collaborator:** Michael Powel

## Page structure (4 pages)

| Page ID | Name | Purpose |
|---|---|---|
| `277:12` | `00 — Cover / How to use` | System intro |
| `277:13` | `01 — Palettes` | Swatch grid: 5 palettes × 4 tokens |
| `277:14` | `02 — Slots` | 12 slot components with descriptions |
| `277:15` | `03 — Reference posters` | Finished compositions, instances-only |

There's also a v1 archive page `🎨 AIR Brand System` — leave it alone.

## Palette system: 4 tokens × 5 modes

**Variable collection:** `Poster System` (`VariableCollectionId:277:16`)

| Token | Variable ID | Role |
|---|---|---|
| `primary` | `277:17` | Dominant ground color |
| `accent` | `277:18` | Pop/highlight color |
| `contrast` | `277:19` | High-contrast text/decoration color |
| `light` | `277:20` | Light neutral (currently always `#FFFFFF`) |

**Modes:**

| Mode | primary | accent | contrast | light |
|---|---|---|---|---|
| `magenta` | `#F12CC8` | `#FFE500` | `#0D142A` | `#FFFFFF` |
| `cyan` | `#0062FF` | `#67FAE0` | `#0D142A` | `#FFFFFF` |
| `violet` | `#46125B` | `#FFD400` | `#994DBA` | `#FFFFFF` |
| `amber` | `#FF9500` | `#0062FF` | `#B01313` | `#FFFFFF` |
| `forest` | `#1F7A4D` | `#8AF774` | `#0D142A` | `#FFFFFF` |

Note: `contrast` is not always near-black — violet and amber have palette-specific contrast colors. This is intentional.

## Slot catalog (12 slots on page 02)

Tag convention: `[zone]/[slot]/[variant-name]`. Use the tag verbatim as the Figma component name.

| Slot tag | Component ID | Notes |
|---|---|---|
| `bg/field` | `280:15` | Solid background, bound to `primary` |
| `top-edge/graphic` | `280:65` (set) | Pattern variants: piano-stripes, checker, dot-row, converging |
| `top-edge/curve` | `280:69` | Sweep scribble, bound to `accent` |
| `upper-left/date` | `280:74` | "JUNE.9.20**26**" — "26" in `accent` per per-character rule |
| `center/ring-badge` | `352:204` (set) | 6 variants: Clover, Sunburst, Diamond, Star, Hexagon, Circle. Flattened (vectors direct children, no wrapper frame). |
| `center/portrait` | `280:82` | Locked rounded square mask, 600×600 |
| `mid-left/title-block` | `280:86` | "N**8**N **W**orkflows in action" — "8" and "W" in `accent` |
| `mid-left/host-line` | `280:91` | Speaker caption in Fira Code Medium |
| `mid/squiggle` | `280:96` | Wave scribble, bound to `accent` |
| `bottom-left/pattern-block` | `280:101` | Quarter-circles pattern |
| `bottom-right/lockup` | `280:177` | AIR mark + "AI IN REACH" tagline. Tagline is flattened to vectors. "ai" + "IN" = `accent`; "r" + "AI" + "REACH" = `light`. Locked. |
| `center-top/event-mark` | `280:181` | AI DAY hero logo. Multi-color via brightness binding. |

## Reference poster

- **Node ID:** `284:12`
- **Size:** 2400×3600 (2:3 portrait)
- **Built entirely from slot instances + `magenta` palette mode**
- **Layout proportions** match the original poster `183:5197`

## Typography (5 text styles)

- `AIR/Headline` — Fira Sans Extra Condensed Bold, 96 / -2% tracking
- `AIR/Subhead` — Fira Code Medium, 44 / +2% tracking
- `AIR/Body` — Fira Sans Extra Condensed Regular, 28
- `AIR/Mono Caption` — Fira Code Regular, 22 / +4% tracking
- (Display style was removed when AI Day logo became the unified hero mark)

## Hierarchy rule (non-negotiable)

- **AI Day** is ALWAYS the primary mark — largest element, top of composition
- **AIR** is ALWAYS the secondary mark — smaller, bottom-right
- Never reverse this order. Documented in lockup rules.

## Per-character accent rule

Title block and date have 1–2 glyphs that get `accent` color via `text.setRangeFills(start, end, paint)`. Currently: title accents "8" and "W"; date accents "26".

## What's done

- ✅ Phase 1 — 4 pages + Poster System variable collection + 5 palettes
- ✅ Phase 2 — 12 slot components built and bound
- ✅ Phase 3 — Slot specs documented inline via labels
- ✅ Phase 4 — Reference poster rebuilt with per-character accents
- ⏳ Phase 5 — Re-derive 5 other deliverable sizes (Story 9:16, Square 1:1, Slide 16:9, Email 2:1, Banner 3:1) from the reference

## Gotchas (don't repeat these mistakes)

1. **`combineAsVariants` creates a set with `primaryAxisSizingMode: "AUTO"`** — if you call `set.resize()` later, variants get stretched non-uniformly. Always set `set.primaryAxisSizingMode = "FIXED"` and `counterAxisSizingMode = "FIXED"` BEFORE resizing variants.
2. **`outlineStroke()` returns an UNPARENTED vector** — must `parent.appendChild()` it manually or it gets orphaned.
3. **Removing the "Headshot Slot" rectangle** from a Headshot Frame variant triggers auto-layout collapse. Make it invisible (`fills=[]`, `opacity=0`) instead of removing.
4. **`text.textAutoResize = "NONE"` after `text.resize(w, h)`** clips text. Always set `textAutoResize = "HEIGHT"` if you want wrapping + auto-grow.
5. **`figma.flatten([textNode], parent)`** is the way to convert text to scalable vector geometry. Lose per-character colors — make separate text nodes per color region first.
6. **Setting `figma.currentPage` is not supported** — use `await figma.setCurrentPageAsync(page)`.

## WCAG contrast audit (informational; no changes made)

Posters lean on display type, so AA Large (3:1) is the practical bar. Issues to be aware of:

- **Amber** has multiple failures (white on orange = 2.20, blue accent on orange = 2.28). AI DAY white letters won't read on amber primary.
- **Violet** `contrast` on `primary` = 2.75 — fails even Large. Light purple on deep violet is too soft.
- Universal: never put `light` on `accent` — fails in every palette.

## Before you do anything, verify state with a quick check

Run this to confirm the system is intact:

- Read variable values from `Poster System` collection (`277:16`)
- List variants in `center/ring-badge` set (`352:204`) — should be 6
- Confirm reference poster (`284:12`) has ~12 slot instances
- Confirm `layoutMode` and `primaryAxisSizingMode` on any component set before resizing

## Conventions to follow

- Make all changes on the 4 Poster System pages (00–03). Do not touch `🎨 AIR Brand System` (the v1 archive).
- New slot variants go on `02 — Slots` under the appropriate section.
- New palette modes go in the `Poster System` collection. Update both the variable AND the visual swatch on `01 — Palettes`.
- Bind every color fill to a Poster System variable; never use raw hex.
- Use SCALE constraints on every descendant when you need a component to resize cleanly.
- For text that needs to scale (taglines, etc.), use `figma.flatten([textNode], parent)` to convert to vector.

---

*Snapshot date: 2026-05-20. Update this file (or write a new dated one) whenever the system materially changes.*
