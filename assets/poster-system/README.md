# Project AIR Poster System (Library)

This is the **asset library** the poster template system pulls from. Spec lives at `../../docs/poster-template-system.md`. Read that first.

## What's in here

```
poster-system/
├── manifest.json           ← machine-readable index. n8n reads this to pick variants.
├── palettes/               ← one JSON file per 5-role palette
├── slots/                  ← one folder per slot. Drop variant exports here.
│   ├── bg-field/
│   ├── top-edge-graphic/
│   ├── ...
└── reference/              ← finished poster renders for visual reference
```

## How to add a variant (manual flow)

1. Build the variant in the Figma library file.
2. Export it from Figma as **SVG** (preferred — scales + recolorable) or **PNG @2x** (when SVG isn't possible, e.g. raster portraits).
3. Drop the file into the matching `slots/<slot-name>/` folder. Name it `<variant-name>.svg` — e.g. `slots/top-edge-graphic/piano-stripes.svg`.
4. Append a row to `manifest.json` under that slot's `variants` array.
5. If the variant uses palette colors, replace literal hexes with the role tokens (`{{palette.dominant}}`, `{{palette.accent-primary}}`, etc.) in the SVG so n8n can substitute at render time.

## How to add a palette

1. Pick 5 hexes that obey the value-relationship rules in `palettes/README.md`.
2. Copy `palettes/ai-day-magenta.json` to `palettes/<new-name>.json` and edit values.
3. Append the palette name to `manifest.json` `palettes` array.

## What n8n needs (when you wire it up later)

Just `manifest.json` + the files it points to. The manifest is the contract — anything reading this library only needs to parse that one file to know what's available.

## Naming rules

- Folder/file names are **kebab-case**, all lowercase.
- Variant names are descriptive of what they look like, not what poster they came from. ✅ `concentric-12-rings` ❌ `maya-smith-rings`.
- Don't put spaces, capitals, or special chars in filenames — breaks JSON references.

---

*Last updated: 2026-05-15*
