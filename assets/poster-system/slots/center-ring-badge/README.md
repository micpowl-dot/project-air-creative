# Slot: `center/ring-badge`

**Purpose:** Concentric ring "target" graphic that sits behind the portrait.
**Color role:** `dominant` (rings) — see notes below on tint.
**Format:** SVG, square. ~2820 × 2820 on reference canvas.
**Naming:** `<variant>.svg`

## Tint variation
Rings on the reference poster are subtle: same hue as `dominant`, slightly darker per ring. Either:
- Encode each ring as a separate stroke and let n8n compute tints, or
- Bake the tint stack into the SVG and just note which palette role drives the stack.

## Current variants
- `concentric-12.svg` — reference (12 rings)

## Ideas for future variants
- `concentric-6` — chunkier rings
- `concentric-9` — middle density
- `concentric-spiral` — single spiraling path
- `concentric-broken` — rings with gaps/dashes
- `concentric-glow` — outer glow ring for night-mode palettes
