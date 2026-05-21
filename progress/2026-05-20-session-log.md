# Session Log — through 2026-05-20

Chronological summary of design-system work happening in Figma. For the current state snapshot, see `2026-05-20-system-state.md`.

---

## Session 1 (2026-05-15) — Initial brand system v1

- Built a v1 brand system on a single page `🎨 AIR Brand System`
- 6-token palette (`primary`, `bg/secondary`, `ink`, `ink/inverse`, `accent`, `surface`) × 2 modes (AI Day, Air)
- 6 headshot frame variants (Bullseye, Diamond, Squares, Sunburst, Halftone, Rings)
- 6 pattern variants (Checker, QuarterCircles, Stripes, Dots, Grid, Confetti)
- 6 overlay variants (procedurally generated scribbles)
- 6 deliverable templates (Story, Square, Poster, Slide, Email Header, Web Banner)
- Typography: Inter + JetBrains Mono (later swapped to Fira Sans Extra Condensed + Fira Code)

## Session 2 (2026-05-15 to 16) — Iterations

- Swapped fonts to Fira Sans Extra Condensed + Fira Code
- AI Day logo became the unified hero mark (no more priority-reversal variants)
- Lockup rules locked: AI Day always primary, AIR always secondary
- Discovered + fixed the headshot frame stroke-scaling issue via `outlineStroke()` (with manual `parent.appendChild()` — the API gotcha)
- Replaced patterns with 7 hand-built tileable variants
- Replaced overlays with 6 hand-drawn scribbles
- Updated vertical templates (Poster + Story) to mirror original poster layout

## Session 3 (2026-05-18) — Lockup vectorization

- "AI IN REACH" tagline in lockup wasn't scaling with the lockup — converted text to 3 flattened vector segments (AI, IN, REACH) via `figma.flatten()`
- Applied per-segment colors: AI = anchor-light, IN = accent-primary, REACH = anchor-light

## Session 4 (2026-05-19) — Palette simplification rounds

- Dropped `bg/secondary` (going from 6 tokens toward 4)
- Renamed `bg/primary` → `primary`, `ink` → `dark`, etc.
- Renamed `dark` → `contrast` (more accurate since values aren't always dark)
- Changed `light` to pure white `#FFFFFF` in all modes
- Renamed palette modes: full names → short names (`ai-day-magenta` → `magenta`, etc.)
- Color values iterated per user feedback: cyan primary became `#0062FF`, amber accent became blue, forest accent became kelly green
- Final naming: `primary` / `accent` / `contrast` / `light` × 5 modes

## Session 5 (2026-05-19 to 20) — Slot framework adoption

- Adopted Michael Powel's slot framework spec
- Created 4 new pages: `00 — Cover` / `01 — Palettes` / `02 — Slots` / `03 — Reference posters`
- Created new variable collection `Poster System` (separate from the v1 `AIR/Palettes`)
- Built 12 slot components on page 02 by cloning from v1 and rebinding colors
- Rebuilt reference poster on page 03 entirely from slot instances
- Implemented per-character accent rule (8, W, 26)

## Session 6 (2026-05-20) — Polish and refinements

- **WCAG contrast audit** performed (informational; no color changes)
- Replaced single ring-badge with 6-variant component set sourced from user's Headshot Frame at `341:2657`
- Multiple failed attempts to fix variant crushing — **root cause:** `combineAsVariants` creates set with `primaryAxisSizingMode: "AUTO"`. Solved by forcing set sizing to `FIXED` before resizing variants.
- **Flattened ring-badge variants** (removed wrapper frames, vectors direct children of variants)
- **Re-laid out `02 — Slots` page** with proper vertical flow (40px label-to-component, 140px section-to-section)
- Fixed all label descriptions to `textAutoResize = "HEIGHT"` so they auto-grow

---

## Key design decisions

### Mark hierarchy is fixed
- **AI Day** = always the primary mark, largest element, top of composition
- **AIR** = always the secondary mark, smaller, bottom-right
- No reversed-priority variants. Documented in lockup rules: *"Never reverse this order."*

### 4 tokens, not 5
- Started with 4: `primary`, `accent`, `ink`, `surface`
- Adopted Michael's 5-role spec, then dropped `accent-secondary` (not present on reference poster)
- Final: 4 tokens (`primary`, `accent`, `contrast`, `light`)

### Strokes outlined to filled geometry
- Resolves the "stroke weight doesn't scale" problem under SCALE constraints
- Applied to: headshot frame decorations, overlay scribbles, lockup tagline ("AI IN REACH")
- `figma.flatten([textNode], parent)` converts text to vector when scaling is needed

### Per-character accent rule
- Title block: 1–2 glyphs get `accent` color (currently "8" and "W")
- Date: 1 digit/letter pair gets `accent` (currently "26")
- Implemented via `text.setRangeFills(start, end, paint)`
- Adds visual rhythm without changing layout

### Logo color treatment uses brightness binding
- AI Day logo has 3-color treatment (`contrast` / `light` / `accent`)
- Each vector's original fill brightness determines which token it binds to
- Auto-adapts to all 5 palettes

---

## Open / pending items

- ⏳ **Phase 5** — Re-derive 5 other deliverable sizes (Story 9:16, Square 1:1, Slide 16:9, Email 2:1, Banner 3:1) from the corrected reference poster
- 🟡 **Amber palette** has WCAG failures — white logo letters won't read on amber primary. Consider darkening primary or adjusting light value
- 🟡 **Violet palette** `contrast` on `primary` is 2.75 (fails AA Large) — soft purple on deep purple
- 🔵 **Optional polish on Slots page:** date and host-line are tiny on the docs page — could scale up for legibility, but they're correct sizes for instances on templates

---

*Last updated: 2026-05-20. Future sessions should add a new `## Session N` block above the "Key design decisions" section, then update `*-system-state.md` to reflect new state.*
