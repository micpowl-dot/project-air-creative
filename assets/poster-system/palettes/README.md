# Palettes

Each palette is a JSON file with 5 named roles. Posters bind their colors to **role names**, not hexes, so swapping the palette re-skins the whole poster.

## Roles

| Role | Function |
|------|----------|
| `dominant` | Background field, ring fills, pattern-block tint |
| `accent-primary` | Curves, squiggles, title/date glyph accent, one stripe in top graphic |
| `anchor-dark` | Main typography, ring strokes, dark stripe in top graphic |
| `anchor-light` | Light stripe, light-mode type, off-white surfaces |
| `accent-secondary` | Optional second accent (alerts, future use) |

## Rules for adding a palette

Match the value relationships from `ai-day-magenta.json` so palettes feel like siblings:

- **dominant** — saturated, mid-value (chroma high, value 40–60%).
- **accent-primary** — saturated, high-value. Should pop against dominant.
- **anchor-dark** — near-black with a hue bias. Use `#0D142A` unless you have a reason to deviate.
- **anchor-light** — warm off-white. Use `#F0F0EB` unless you have a reason to deviate.
- **accent-secondary** — saturated, ~180° hue from accent-primary. Optional in use.

## Files in this folder

| File | Status |
|------|--------|
| `ai-day-magenta.json` | reference (live) |
| `electric-cyan.json` | planned |
| `deep-violet.json` | planned |
| `hot-amber.json` | planned |
| `forest-pulse.json` | planned |

## File format

```json
{
  "name": "ai-day-magenta",
  "label": "AI Day Magenta",
  "roles": {
    "dominant": "#E6147A",
    "accent-primary": "#F5D300",
    "anchor-dark": "#0D142A",
    "anchor-light": "#F0F0EB",
    "accent-secondary": "#BA0D00"
  }
}
```

To add a palette: copy a file, rename, edit values, then append the name to the `palettes` array in `../manifest.json`.
