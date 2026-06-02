# AIR Poster System — Session Log + Handoff

> **For a new Claude chat:** paste the entire "QUICK HANDOFF" section below as your first message. Skip the detailed log unless asked. Update this file at the end of each session.

---

## 🚀 QUICK HANDOFF (paste this into a new chat)

I'm continuing work on the AIR Poster System — a slot-based modular system in Figma for generating event posters, digital templates, and per-speaker social/TV designs. Read this whole handoff before doing anything; then verify state before making changes.

### Project file
- Figma file key: `cN02srfPOLg8jLZRI9iMiB`
- File URL: https://www.figma.com/design/cN02srfPOLg8jLZRI9iMiB/Project-AIR
- Reference poster (original v1 design intent): node `183:5197`
- Collaborator on the slot framework spec: Michael Powel

### What the system is
A poster/template = **composition slots** + **slot variants** + **a palette**. Slots are fixed positions in the layout. Variants are swappable Figma components. Palette is a 4-token color set with 5 modes. Each individual speaker design = a per-speaker frame with their name/title/tag/headshot applied to a palette-locked template.

### Page structure (8 active pages)
| Page ID | Name | Purpose |
|---|---|---|
| `277:12` | `00 — Cover / How to use` | System intro |
| `277:13` | `01 — Palettes` | Swatch grid: 5 palettes × 4 tokens |
| `277:14` | `02 — Slots` | 13 slot components with descriptions |
| `277:15` | `03 — Reference posters` | 24×36 poster strips (Bleed + NoBleed) |
| `628:12` | `04 — TV Templates` | 1920×1080 landscape template (magenta source) |
| `633:12` | `05 — LinkedIn Templates` | 1080×1080 square template (magenta source) |
| `637:6560` | `06 — Headshots` | 24 speaker headshot frames (1200×1200), each palette-bound |
| `643:12` | `07 — TV Speaker Designs` | 24 generated TV frames, one per speaker |
| `643:13` | `08 — LinkedIn Speaker Designs` | 24 generated LinkedIn frames, one per speaker |

Archive pages (leave alone unless explicitly working on legacy):
- `🎨 AIR Brand System` — v1 archive
- `539:12 — 📦 Archive — 36x48 Posters` — obsolete 36×48 posters (Session 8 pivot)

### Palette system: 4 tokens × 5 modes
**Variable collection:** `Poster System` (`VariableCollectionId:277:16`)

| Token | Variable ID | Role |
|---|---|---|
| `primary` | `277:17` | Dominant ground color |
| `accent` | `277:18` | Pop/highlight color |
| `contrast` | `277:19` | High-contrast text/decoration color |
| `light` | `277:20` | Light neutral (currently always `#FFFFFF`) |

**Modes (actual resolved hex per mode — verified Session 9):**

| Mode | Mode ID | primary | accent | contrast | light |
|---|---|---|---|---|---|
| `magenta` | `277:0` | `#F12CC8` | `#FFE500` | `#0D142A` | `#FFFFFF` |
| `cyan` | `277:1` | `#0062FF` | `#67FAE0` | `#0D142A` | `#FFFFFF` |
| `violet` | `277:2` | `#46125B` | `#FFD400` | `#9E5BB9` | `#FFFFFF` |
| `amber` | `277:3` | `#FF9500` | `#6B0800` | `#BC1000` | `#FFE8C1` |
| `forest` | `277:4` | `#1F7A4D` | `#8AF774` | `#0D142A` | `#FFFFFF` |

Note: `contrast` is palette-specific. Amber's accent + contrast are BOTH dark reds (the handoff previously listed amber accent as blue `#0062FF` — that was wrong; verified in code that amber accent resolves to `#6B0800`). Violet's contrast is light purple, not dark.

### Per-palette variant pairings (canonical, applied to posters AND all per-speaker designs)

| Palette | `top-edge/graphic` variant | `center/ring-badge` variant | Notes |
|---|---|---|---|
| Magenta | piano-stripes | Clover | Multi-color: contrast + accent + light |
| Cyan | converging | Hexagon | Contrast only (dark on cyan reads sharply) |
| Violet | dot-row | Diamond | Contrast (light purple) only |
| Amber | checker | Sunburst | Contrast + light (cream squares on red) |
| Forest | piano-stripes | Clover | Same pairing as magenta — distinct via palette |

The color treatment in each variant comes from the source component's variable bindings; you don't override fills per palette, you just swap the variant.

### Slot catalog (13 slots on page 02)

Tag convention: `[zone]/[slot]/[variant-name]`.

| Slot tag | Component ID | Notes |
|---|---|---|
| `bg/field` | `280:15` | Solid background, bound to `primary` |
| `top-edge/graphic` | `280:65` (set) | 4 variants: piano-stripes (974×270), checker (**694**×270), dot-row (480×270), converging (481×270). All native aspects matter — see Sizing notes |
| `top-edge/curve` | `280:69` | Sweep scribble, bound to `accent`. Hidden on TV/LinkedIn templates |
| `upper-left/date` | `364:3321` (set) | 2-axis variant: Layout × Content. 4 of 6 cells filled |
| `center/ring-badge` | `352:204` (set) | 6 variants: Clover, Sunburst, Diamond, Star, Hexagon, Circle |
| `center/portrait` | `280:82` | Locked rounded square mask, 600×600 (placeholder is raw `#C7C7C7`). **In per-speaker designs, this gets replaced by a clone of the speaker's full headshot frame from page 06** |
| `mid-left/title-block` | `280:86` | Event title — e.g. "N8N Workflows in action" |
| `mid-left/host-line` | `280:91` | "HOST MAYA SMITH" in Fira Code Medium |
| `mid/squiggle` | `280:96` | Wave scribble, bound to `accent` |
| `bottom-left/pattern-block` | `280:101` | Quarter-circles pattern |
| `bottom-right/lockup` | `280:177` | AIR mark + "AI IN REACH" tagline. Locked |
| `center-top/event-mark` | `280:181` | AI DAY hero logo (277×115, aspect 2.4087:1) |
| `speaker/info-block` | `630:12` | Speaker spotlight: 4px accent bar + Name (Fira Sans XCond Bold 120) + Title (Fira Sans XCond Reg 50) + Tag (Fira Code Med 55 in accent). **4 props**: `Name#630:0`, `Title#630:1`, `Tag#630:2`, `Show tag#641:0` (boolean, hides tag for executives) |

### Date system

**Component set:** `upper-left/date` (`364:3321`), 2 properties:
- `Layout`: `inline` | `stack`
- `Content`: `full` | `month-day` | `year-stack`

4 of 6 cells filled. Empty cells: `inline+year-stack`, `stack+month-day`.

### Active deliverables

**24×36 Print Posters (page 03)**
- Bleed strip `533:12` (12818×3618 at y=4544): Magenta `364:2852`, Cyan `532:46`, Violet `532:185`, Amber `532:322`, Forest `532:503`
- NoBleed strip `567:12` (12800×3600 at y=8362): Magenta `567:13`, Cyan `567:144`, Violet `567:270`, Amber `567:394`, Forest `567:591`
- Trim area = inner 2400×3600 with **9px bleed** on each side (Bleed set)

**Session Info Poster (page 03)** — 24×36 magenta NoBleed
- `284:12` — replaces year-stack date with title-block + host-line, uses full-date inline above AI DAY

**TV Template (page 04, `628:13`)** — 1920×1080 magenta
**LinkedIn Template (page 05, `625:6121`)** — 1080×1080 magenta. (Note: LinkedIn lockup is at bottom-LEFT, breaks the `bottom-right/lockup` zone convention — design choice)

**Per-speaker designs (pages 07 + 08)** — 24 speakers × 2 formats = 48 frames

### Speaker manifest (24 speakers)

Frame naming: `TV — {Name}` and `LI — {Name}` (palette removed from names per design preference). Order = AI Ambassadors first, then Executives, then late additions.

| # | Name | Title | Palette | Tag | Headshot ID |
|---|---|---|---|---|---|
| 1 | Erik Petersen | Lead Solutions Architect, IT | Forest | AI Ambassador | `637:6598` |
| 2 | Max Jacubowsky | Principal Machine Learning Engineer, AI | Cyan | AI Ambassador | `637:6586` |
| 3 | Sara Peal | Executive Assistant | Forest | AI Ambassador | `637:6574` |
| 4 | Samantha Gates | Director, Total Rewards & Operations | Forest | AI Ambassador | `637:6616` |
| 5 | Javi Quinones | Manager, IT Service Desk | Forest | AI Ambassador | `637:6589` |
| 6 | Jack Kreps | VP, Financial Planning & Analysis | Violet | AI Ambassador | `637:6604` |
| 7 | Shannon King | Senior Director, People & Culture | Magenta | AI Ambassador | `637:6592` |
| 8 | Michelle Kilroy | Chief People & Communications Officer | Violet | AI Ambassador | `731:9219` |
| 9 | Thomas Hinson | Staff Software Engineer, Weather Science | Forest | AI Ambassador | `637:6577` |
| 10 | James Baker | Staff DevOps Engineer, Weather Science | Cyan | AI Ambassador | `637:6607` |
| 11 | Elizabeth Martin | Senior Manager, Platform Engineering, IT | Magenta | AI Ambassador | `637:6580` |
| 12 | Lauriana Gaudet | Staff Applied Meteorological Scientist | Violet | AI Ambassador | `637:6583` |
| 13 | Tyler Steben | Lead Product Manager, Enterprise Operations | Magenta | AI Ambassador | `637:6562` |
| 14 | Brennan Gerster | Chief Business Officer | Cyan | AI Ambassador | `637:6601` |
| 15 | Rohit Nutalapati | Software Engineer, CRM Solutions | Cyan | AI Ambassador | `637:6565` |
| 16 | Sahana Subbanna | Manager, Software Engineering | Amber | AI Ambassador | `637:6610` |
| 17 | Dave de Sa | VP, Data and Analytics | Amber | AI Ambassador | `637:6613` |
| 18 | Miguel Gervassi | Staff Machine Learning Ops Engineer, AI | Amber | AI Ambassador | `637:6571` |
| 19 | Rohit Agarwal | Chief Executive Officer | Magenta | *hidden* | `731:9225` |
| 20 | Matthew Drooker | Chief Technology Officer | Amber | *hidden* | `731:9222` |
| 21 | Dan Margulies | Chief Information Officer | Magenta | *hidden* | `637:6568` |
| 22 | Brian O'Neil | SVP, AI & Platform Engineering | Magenta | *hidden* | `637:6595` |
| 23 | Ben Papandrea | Senior Manager, Global Forecast Operations | Violet | AI Ambassador | `771:14278` |
| 24 | James Belanger | VP, Meteorology, Weather Science | Violet | AI Ambassador | `771:14275` |

### Layout invariants (per-speaker designs)

**TV (1920×1080):**
- `upper-left/date` at (114, 39), 399×75
- `center-top/event-mark` at (50, 140), 798×331
- `speaker/info-block` at (50, ~570), width auto-fits text
- `center/ring-badge` at (947.5, 195.5), **800×800** (scaled down Session 9 from 875)
- Portrait/headshot at (1126.93, 374.93), **441.14×441.14** (proportionally scaled with ring)
- `bottom-right/lockup` at (1601, 831), 270×205.5
- `mid/squiggle` at (-254, 960), 1418×314 (decorative bleed)
- `bottom-left/pattern-block` at (0, 934), 986×365
- `top-edge/curve` always hidden
- `top-edge/graphic`: see "Top-edge/graphic sizing" below

**LinkedIn (1080×1080):** original template positions from `625:6121`. Not yet ring-badge-scaled to 800 (only TV was scaled).

### Top-edge/graphic sizing (per-palette, per-format)

The user's preferred treatment: **anchor left edge at piano-stripes' left x; scale uniformly so all variants share the same width; height varies per native aspect** (narrower-aspect variants get taller and bleed further off the top).

| Palette | Variant | TV (x, y, w, h) | LI (x, y, w, h) |
|---|---|---|---|
| Magenta / Forest | piano-stripes | (904.28, -169, 1694.72, 469.79) | (707, -156, 1683, 466) |
| Cyan | converging | (904.28, -650.51, 1694.72, 951.30) | (707, -635, 1683, 945) |
| Violet | dot-row | **(904.28, -329.61, 1120.72, 630.41)** | (707, -636, 1683, 946) |
| Amber | checker | (904.28, -358.71, 1694.72, 659.50) | (707, -345, 1683, 655) |

**TV Violet uses Jack Kreps' manually-tuned smaller dimensions** (1120×630) instead of the full 1694-wide treatment. All 4 violet TVs are synced to this reference. LI violet still uses the full bottom-left-anchored treatment.

### Color rules

- All slots inherit colors from variable bindings — swap palette mode and they re-resolve.
- **Amber speakers** have an inverted text color treatment on `speaker/info-block`: Name + Title → `accent`, Tag → `contrast` (opposite of every other palette). This was applied as per-instance fill overrides on the text nodes inside the speaker instance.
- **Executives** (Show tag = false): tag text is invisible via the `Show tag` boolean property.

### Headshot composition pattern

Each speaker frame's portrait area is NOT the default gray `center/portrait` instance. Instead:
1. Clone the speaker's full 1200×1200 headshot frame from page 06
2. Resize to portrait dimensions (TV: 441×441, LI: 414×414)
3. Position at the portrait slot's coordinates
4. Set the cloned headshot's `explicitVariableModes` to the target speaker frame's palette (so the headshot's internal bg + pattern re-render to match if the speaker's frame palette differs from their headshot's native palette)
5. Remove the original portrait instance

When swapping a speaker's palette, the headshot clone's `explicitVariableModes` should be updated too — otherwise the headshot bg colors won't match the new frame palette.

### Typography (4 text styles)
- `AIR/Headline` — Fira Sans Extra Condensed Bold, 96 / -2% tracking
- `AIR/Subhead` — Fira Code Medium, 44 / +2% tracking
- `AIR/Body` — Fira Sans Extra Condensed Regular, 28
- `AIR/Mono Caption` — Fira Code Regular, 22 / +4% tracking

### Hierarchy rule (non-negotiable)
- **AI Day** is ALWAYS the primary mark
- **AIR** is ALWAYS the secondary mark (bottom corner)

### Known issues / open work

| # | Issue | Action |
|---|---|---|
| 1 | LinkedIn ring-badge + portrait not yet scaled to 800×800 like TV | Apply same proportional scaling if you want LI to match TV's tighter layout |
| 2 | LinkedIn frame lockup is at bottom-LEFT instead of bottom-right | Verify intentional; if not, move to bottom-right |
| 3 | "Brian Oneil" headshot name has no apostrophe; speaker list has "Brian O'Neil" | Cosmetic; match if you want consistency |
| 4 | Amber WCAG contrast still poor (red on orange combinations) | Cosmetic — consider palette tweak |
| 5 | TV magenta + forest piano-stripes only extend to right x=2599; cyan/violet/amber graphics in the bottom-left-anchored treatment extend MUCH taller off the top | Visual balance is intentional per spec, but worth re-reviewing if anything feels off |
| 6 | Speaker designs are magenta-locked per design but vary by palette in actuality — verify no missed bindings | Audit `posterFill` on each speaker frame |

### Audit checklist (run before any change next session)
- Confirm `Poster System` collection `277:16` still has 5 modes with token IDs `277:17`/`277:18`/`277:19`/`277:20`
- Confirm ring-badge set `352:204` has 6 variants and graphic set `280:65` has 4 variants
- Confirm `upper-left/date` set `364:3321` is still 2-axis variant with properties `Layout` + `Content`
- Confirm `speaker/info-block` `630:12` has 4 properties: Name, Title, Tag, Show tag
- Confirm all 24 speaker frames on page 07 + 08 have proper palette mode + variant pairing + headshot composition

### Gotchas (don't repeat these mistakes)
1. `combineAsVariants` creates set with `primaryAxisSizingMode: AUTO` — always set FIXED before resizing variants
2. `outlineStroke()` returns unparented vector — manual `parent.appendChild()` required
3. Removing slot rectangles inside auto-layout variants triggers collapse — use `fills=[]` invisibility instead
4. `text.textAutoResize = NONE` after `text.resize()` clips text — use `HEIGHT`
5. Cloning text in `flatten()` loses per-character colors — flatten each color region separately
6. `figma.currentPage` is not settable — use `await figma.setCurrentPageAsync(page)`
7. **Resizing a date/text-bearing slot instance does NOT change inner text size.** Slot text has `textAutoResize: WIDTH_AND_HEIGHT` + `constraints: MIN/MIN`. To enlarge text, set `textNode.fontSize` directly as an instance override.
8. **`MIN` is a temporary constraint, not a resting state.** Always restore to `SCALE` after source edits or instance scaling breaks.
9. **Bleed setup**: pin children to `MIN/MIN` BEFORE resizing frame; resize; shift +9/+9; (optionally) restore constraints. Background fill on frame auto-extends.
10. Constraint enum values: `MIN | CENTER | MAX | STRETCH | SCALE` (not directional names like LEFT/RIGHT).
11. Cross-page `getNodeByIdAsync` returns null for non-current-page nodes until `await page.loadAsync()`.
12. **Variant swap snaps width to source variant's native width.** When swapping `setProperties({ Style: "..." })` on an instance, Figma may set the instance width to the new variant's native source width. Always re-apply dimensions explicitly after a variant swap if you need a specific size.
13. **Headshot's `explicitVariableModes`** is on the cloned frame itself. When changing a speaker's palette, override this on the cloned headshot composition too — otherwise headshot bg + pattern colors stay at the original palette.
14. **Per-instance text fill overrides** persist through palette swaps. The amber name+title accent + tag contrast swap is applied directly on the text node's `fills` property, NOT through component-level rebinding. To revert, re-bind to the source component defaults.

### Conventions to follow
- Make all changes on pages 00–08 (or relevant active templates). Do not touch `🎨 AIR Brand System` v1 archive or `📦 Archive — 36x48 Posters`.
- New slot variants go on `02 — Slots` under the appropriate section.
- Bind every color fill to a Poster System variable; never use raw hex (placeholder grays excepted).
- Per-speaker frame names: `TV — {Name}` or `LI — {Name}`. No palette in name.
- For text that needs to read at different sizes across deliverables, set `textNode.fontSize` directly as instance overrides.

---

## FULL SESSION LOG (chronological summary)

### Session 1 (2026-05-15) — Initial brand system v1
- 6 token palette × 2 modes, headshot frames, patterns, overlays, 6 deliverable templates
- Typography: Inter + JetBrains Mono (later swapped)

### Session 2 (2026-05-15 to 16) — Iterations
- Swapped fonts to Fira Sans Extra Condensed + Fira Code
- AI Day unified as hero mark; lockup rules locked
- Fixed headshot frame stroke-scaling via `outlineStroke()`

### Session 3 (2026-05-18) — Lockup vectorization
- "AI IN REACH" tagline flattened to 3 vector segments with per-segment colors

### Session 4 (2026-05-19) — Palette simplification
- Dropped `bg/secondary`, renamed tokens
- Final: `primary` / `accent` / `contrast` / `light` × 5 modes

### Session 5 (2026-05-19 to 20) — Slot framework adoption
- Adopted Michael Powel's slot framework spec; created 4 pages
- Built 12 slot components and rebuilt reference poster

### Session 6 (2026-05-20) — Polish
- WCAG contrast audit, ring-badge 6-variant set, layout cleanup

### Session 7 (2026-05-21) — 36×48 reformat + audit
- Primary size 36×48, date upgraded to 2-axis variant
- Audit surfaced 6 outstanding issues

### Session 8 (2026-05-28 to 2026-06-01) — 24×36 pivot, system expansion, digital templates
- Pivot to 24×36 print posters (Bleed + NoBleed strips)
- Archived 36×48 posters
- Date system rename (Property 1/2 → Layout/Content)
- Checker variant fix (8px gap, constraint nuance)
- Print bleed setup (9px each side)
- Session Info poster (`284:12`) rebuilt
- TV Template (page 04, 628:13) at 1920×1080 with `speaker/info-block` (new slot with accent bar + 3 text props)
- LinkedIn Template (page 05, `625:6121`) at 1080×1080

### Session 9 (2026-06-01 to 2026-06-02) — Speaker design generation
- Added `Show tag` boolean property to `speaker/info-block` (`Show tag#641:0`) bound to tag text visibility
- Extracted image hashes for all initially-available headshots
- Generated 22 TV designs (page 07) + 22 LinkedIn designs (page 08), one per speaker
- For each speaker: palette locked from headshot, ring-badge + graphic variants randomly assigned (initially), gray placeholder portrait, name/title/tag wired into speaker block
- Replaced gray placeholders with full headshot composition (clone of 1200×1200 headshot frame resized to portrait dims)
- Applied per-palette variant pairings (poster style, not random)
- Multiple iterations of `top-edge/graphic` sizing: native aspect, right-edge anchor, then final bottom-left anchor with same width across variants (heights vary per native aspect)
- Synced all 4 violet TVs to Jack Kreps' manually-tuned reference (smaller graphic 1120×630)
- Amber color treatment swap (name+title → accent, tag → contrast)
- Scaled TV ring-badge to 800×800 + headshot to 441 (center anchored), affects all 22 TVs
- Added 3 missing headshots (Michelle Kilroy violet, Matthew Drooker amber, Rohit Agarwal magenta) — Matthew's frame had to be swapped from violet to amber to match his new headshot
- Added Ben Papandrea (Forest → Violet later) + James Belanger (Forest → Violet) speakers with placeholder, then real headshots
- Final palette adjustments: Brian O'Neil swapped Violet → Magenta (matching his headshot), Ben Papandrea swapped Forest → Violet
- All frame names cleaned to remove palette segment

---

## Files referenced
- Working Figma: `https://www.figma.com/design/cN02srfPOLg8jLZRI9iMiB/Project-AIR`
- v1 reference poster: node `183:5197`
- Page IDs: Cover `277:12`, Palettes `277:13`, Slots `277:14`, Reference posters `277:15`, TV Templates `628:12`, LinkedIn Templates `633:12`, Headshots `637:6560`, TV Speaker Designs `643:12`, LinkedIn Speaker Designs `643:13`, Archive `539:12`
- Variable collection: `Poster System` (`VariableCollectionId:277:16`)
- Token variable IDs: primary `277:17`, accent `277:18`, contrast `277:19`, light `277:20`
- Palette mode IDs: magenta `277:0`, cyan `277:1`, violet `277:2`, amber `277:3`, forest `277:4`
- Slot components: see Slot Catalog above
- `speaker/info-block`: `630:12` (props: `Name#630:0`, `Title#630:1`, `Tag#630:2`, `Show tag#641:0`)
- Date variant set: `364:3321`

---

*Last updated: 2026-06-02 (Session 9 — speaker design system + variant pairings + per-palette layouts).*
