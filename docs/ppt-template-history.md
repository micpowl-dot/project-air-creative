# PPT Template — Build History & Team Reference

> The AI Day deck (D4) went through ~13 generative iterations plus 2 manual revisions before landing as R1C. This doc captures the evolution, the design decisions that stuck, and the gotchas — so anyone iterating on it next doesn't have to relearn the path.

---

## Current Final

| Format | File | Use |
|--------|------|-----|
| PowerPoint deck | `assets/templates/AIDAY-PPT-Template-R1C.pptx` | Edit directly, save as new file per session |
| PowerPoint template | `assets/templates/AIDAY-PPT-Template-R1C.potx` | Open as template (creates fresh copy) |
| PDF export | `assets/templates/AIDAY-PPT-Template-R1C.pdf` | Reference / view-only |
| Google Slides | [Open in Slides](https://docs.google.com/presentation/d/1V882MEREe4vpXvjiSu1Idw6VDSMNUZEI/edit?usp=sharing) | Live-editable team copy (broken images already manually re-linked) |

---

## The Journey

### Phase 1 — Generative iterations (v1 → v13)

Built programmatically via `python-pptx` to enforce visual consistency. Each version lived as `assets/templates/Project_AIR_Template_vN.pptx`. The source build script for the final generative version lives at [`scripts/build_air_deck_v13.py`](../scripts/build_air_deck_v13.py).

Key decisions that locked in during this phase:

| Decision | Where it landed | Why |
|----------|----------------|-----|
| Slide size | 10" × 5.625" (16:9) | Standard widescreen |
| Typography | Fira Sans Extra Condensed (display) + Fira Code (mono) | High-density, modern, lockup-friendly |
| Palette system | 3 pairings derived directly from the Figma poster designs (node 324:1019) | Deck had to read as part of the same event identity as the posters |
| Flat aesthetic | Drop shadows suppressed on every shape via empty `<a:effectLst/>` | Posters are flat; deck shouldn't drift |
| Speaker notes | Template-style "what this slide is for / suggested beats / EDIT instructions" on every slide | Reduces guesswork for whoever uses the template |
| Theme injection | Colors patched into `ppt/theme/theme1.xml` (accent1–6, dk2, lt2, hlink, folHlink) | So the palette shows in PowerPoint's UI color picker, not just in the slides |
| QR placeholder | `assets/png/qr.png` referenced in closing slide | Vendor-agnostic — swap in a real QR for the live event |

### Phase 2 — R1B (manual customization, presented to team)

After v13 landed well with the team on **2026-05-21** ("hit, team loved it"), Lee opened v13 in PowerPoint and did manual editorial passes:

- Replaced lorem ipsum body copy on slide 6 with Project AIR-relevant copy
- Added Google Fonts hyperlinks on slide 13 (typography section)
- Other small polish saved manually

Saved as `AIDAY-PPT-Template-R1.potx`, then `AIDAY-PPT-Template-R1B.pptx`. R1B was the working file from this point.

### Phase 3 — R1C (palette expansion)

Team requested two more palettes added to the system. Sourced from the **NEW poster colors** section in Figma (node 394:2762).

**Added:**

| Palette | Dominant | Accent (chosen for high contrast) |
|---------|----------|-----------------------------------|
| Amber  | `#FF9500` | `#BC1100` (deep red) |
| Forest | `#1F7A4D` | `#0D142A` (dark navy) |

> Note: Forest was previously removed on 2026-05-19 (the older "Forest Pulse" `#1F7A4D`). The team brought it back, paired with navy instead of the previous standalone treatment.

**Changes in R1C:**
- Slide 13 ("How to use") — header updated from "3 PALETTES" → "5 PALETTES", swatches added for Amber + Forest
- New slide 15 — Amber full-bleed section divider ("Take it further.")
- New slide 16 — Forest stat slide (big "5" for global locations)
- Theme XML — all 5 dominants now in PowerPoint's color picker (accent1 Magenta, accent2 Cyan, accent3 Violet, accent4 Amber, accent5 Forest, accent6 shared yellow)
- `<a:custClrLst>` added to theme — 12 named custom colors (e.g. "AIR Magenta", "AIR Amber Accent") visible in PowerPoint's Custom Colors section

Patch script: [`scripts/build_r1c_palette_expansion.py`](../scripts/build_r1c_palette_expansion.py) + [`scripts/patch_r1c_custom_colors.py`](../scripts/patch_r1c_custom_colors.py)

---

## Final palette (5 pairings)

| Name    | Dominant | Accent  | Notes |
|---------|----------|---------|-------|
| Magenta | `#FB00FF` | `#F4DC52` (yellow) | High-energy, openers |
| Cyan    | `#0062FF` | `#67FAE0` (mint)   | Note: key is "cyan" for code stability, color is royal blue |
| Violet  | `#46125B` | `#F4DC52` (yellow) | Anchor / reflective moments |
| Amber   | `#FF9500` | `#BC1100` (deep red) | Punchy, urgency |
| Forest  | `#1F7A4D` | `#0D142A` (navy)     | Muted, factual, serious |

**Anchor neutrals (constants across all palettes):**
- Anchor Dark: `#292929`
- Anchor Light: `#F0F0EB`

---

## Gotchas / Known Issues

### 1. Google Slides import — broken images

**Symptom:** When the .pptx is uploaded to Google Slides, image placeholders/icons show as broken or missing.

**Why this happens:** Google Slides re-renders embedded images through its own pipeline. PNGs that python-pptx references by relative path (or via the deck's internal `ppt/media/` folder) can lose their links when Slides decompresses the .pptx — especially for QR placeholders and any picture that was added with a non-standard path.

**Workaround (what Lee did for the live version):** Open the uploaded Slides file and manually re-link or re-upload each broken image. The cream/dark logo lockups and the QR placeholder were the most common offenders.

**For next time:**
- Before uploading to Slides, open the .pptx in PowerPoint and **re-save** (this normalizes image relationships)
- Or, prefer to share the .pptx directly and only convert to Slides if absolutely necessary
- If Slides is mandatory, expect a 10–15 minute manual image cleanup pass

### 2. `.potx` vs `.pptx` editing in python-pptx

`python-pptx` will not open `.potx` files directly (errors with "not a PowerPoint file, content type is …template…"). Workaround used in this project: swap the content type in `[Content_Types].xml` from `…template.main+xml` → `…presentation.main+xml` via zipfile, edit, then swap back. Documented in the v13 build script.

### 3. Font dependency

Fira Sans Extra Condensed and Fira Code are Google Fonts. They must be installed locally for the deck to render correctly. Slide 13 includes download links. Anyone editing the deck on a machine without these fonts will see substitutions and broken kerning.

### 4. Notes slides on `python-pptx`-generated decks

A freshly added slide from the "Blank" layout does NOT seed a notes body placeholder by default. If you write speaker notes via `slide.notes_slide.notes_text_frame.text = "..."`, it will throw `AttributeError: 'NoneType' object has no attribute 'text'`. Workaround: inject a `<p:sp>` with `<p:ph type="body" sz="quarter" idx="3"/>` into the notes spTree before setting text. Pattern is in `scripts/build_r1c_palette_expansion.py`.

---

## How to iterate from here

If you need to make small edits (copy changes, color tweaks):
1. Open `AIDAY-PPT-Template-R1C.pptx` (or the .potx if you want a fresh copy)
2. Edit directly in PowerPoint
3. Save as a new filename (`AIDAY-PPT-Template-R1D.pptx`, etc.) — never overwrite R1C

If you need to make structural changes (new slide layouts, new palette pairings):
1. Read `scripts/build_air_deck_v13.py` to understand the generative system
2. Read `scripts/build_r1c_palette_expansion.py` for the pattern to extend an existing .pptx
3. Add a new patch script rather than re-running the full build (preserves manual edits in R1C)

If you need a different palette:
1. Add the dominant + accent to the `PALETTES` dict (or new patch)
2. Update the theme XML accent slots
3. Update the `<a:custClrLst>` for named entries
4. Add a swatch to slide 13's palette section (Amber/Forest are the pattern to copy)

---

## Reference files

| File | Purpose |
|------|---------|
| `scripts/build_air_deck_v13.py` | Full generative build (v13 baseline) |
| `scripts/build_r1c_palette_expansion.py` | R1B → R1C palette expansion patch |
| `scripts/patch_r1c_custom_colors.py` | Adds named `custClrLst` entries to theme |
| `assets/templates/AIDAY-PPT-Template-R1C.pptx` | Final deck |
| `assets/templates/AIDAY-PPT-Template-R1C.potx` | Final template |
| `assets/templates/AIDAY-PPT-Template-R1C.pdf` | PDF reference |

---

*Last updated: 2026-05-28*
