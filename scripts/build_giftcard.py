"""
Build AI Day gift card composites.

Produces FRONT + BACK as print-ready PNGs at 1088x713 px (3.625" x 2.375"
at 300 DPI, includes 0.125" bleed on all sides).

Front layout (Concept C — Illustrated Treatment, amber palette):
  - Full-bleed amber dominant background (#FF9500)
  - Decorative ring badge motif (from poster system) anchor right
  - Eyebrow "AI DAY · JUNE.9.2026" top-left in Fira Code
  - "$50" large bottom-left in Fira Sans Extra Condensed Black
  - "GIFT CARD" under amount
  - AI Day lockup (white-R variant) top-right

Back layout:
  - Cream background (#F0F0EB)
  - "PROJECT AIR · AI IN REACH" header
  - Code placeholder + expiry + redemption info
  - Lockup bottom-right

Usage:
  python3 scripts/build_giftcard.py             # default $50
  python3 scripts/build_giftcard.py 25          # $25 variant
  python3 scripts/build_giftcard.py 100         # $100 variant
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# --- Dimensions (300 DPI, includes 0.125" bleed)
DPI = 300
TRIM_W_IN = 3.375
TRIM_H_IN = 2.125
BLEED_IN = 0.125
W = int((TRIM_W_IN + 2 * BLEED_IN) * DPI)  # 1088
H = int((TRIM_H_IN + 2 * BLEED_IN) * DPI)  # 713
SAFE_INSET = int(BLEED_IN * 2 * DPI)  # 0.25" from canvas edge

# --- Palette (Amber pairing)
AMBER_DOM = (0xFF, 0x95, 0x00)
AMBER_ACCENT = (0xBC, 0x11, 0x00)
ANCHOR_DARK = (0x29, 0x29, 0x29)
ANCHOR_LIGHT = (0xF0, 0xF0, 0xEB)

# --- Fonts
FONT_DIR = os.path.expanduser("~/Library/Fonts")
F_DISPLAY_BLACK = f"{FONT_DIR}/FiraSansExtraCondensed-Black.ttf"
F_DISPLAY_BOLD = f"{FONT_DIR}/FiraSansExtraCondensed-Bold.ttf"
F_DISPLAY_MED = f"{FONT_DIR}/FiraSansExtraCondensed-Medium.ttf"
F_MONO_BOLD = f"{FONT_DIR}/FiraCode-Bold.ttf"
F_MONO_REG = f"{FONT_DIR}/FiraCode-Regular.ttf"

LOCKUP_PATH = "assets/logo/2x/AIR_Color_wht-r_1_Color@2x.png"
LOCKUP_DARK_PATH = "assets/logo/2x/AIR_Color_blk-r_1_Color@2x.png"

OUT_DIR = "assets/templates/giftcards"
os.makedirs(OUT_DIR, exist_ok=True)


def font(path, size_pt):
    """Convert pt to pixels at 300 DPI (1pt = 300/72 px)."""
    return ImageFont.truetype(path, int(size_pt * DPI / 72))


def draw_text(draw, xy, text, font_obj, fill, *, anchor="la", tracking=0):
    """Draw text with optional letter tracking (1/1000 em units)."""
    if tracking == 0:
        draw.text(xy, text, font=font_obj, fill=fill, anchor=anchor)
        return
    # Manual tracking: draw each char with extra spacing
    x, y = xy
    em_px = font_obj.size
    spc = em_px * tracking / 1000
    for ch in text:
        draw.text((x, y), ch, font=font_obj, fill=fill, anchor=anchor)
        bbox = draw.textbbox((x, y), ch, font=font_obj, anchor=anchor)
        x = bbox[2] + spc


def paste_lockup(canvas, path, x, y, target_h_px):
    """Paste lockup PNG scaled to target height, preserving aspect."""
    lockup = Image.open(path).convert("RGBA")
    ratio = target_h_px / lockup.height
    new_w = int(lockup.width * ratio)
    lockup = lockup.resize((new_w, target_h_px), Image.LANCZOS)
    canvas.alpha_composite(lockup, (x, y))
    return new_w


def ring_badge(draw, cx, cy, outer_r, rings, ring_w):
    """Draw concentric ring badge — same motif as posters."""
    for i, color in enumerate(rings):
        r = outer_r - i * ring_w
        if r <= 0:
            break
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=ring_w)


# ============================================================
# FRONT
# ============================================================
def build_front(amount):
    canvas = Image.new("RGBA", (W, H), AMBER_DOM + (255,))
    draw = ImageDraw.Draw(canvas)

    # Large decorative ring badge anchored right (background motif)
    # Position so half is visible on the right edge
    ring_cx = W - 60
    ring_cy = H // 2
    ring_outer = 360
    ring_colors = [AMBER_ACCENT, AMBER_DOM, AMBER_ACCENT, AMBER_DOM, AMBER_ACCENT]
    # Use a slightly transparent overlay so type stays readable
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    for i, color in enumerate(ring_colors):
        r = ring_outer - i * 30
        if r <= 0:
            break
        # Translucent rings
        odraw.ellipse(
            (ring_cx - r, ring_cy - r, ring_cx + r, ring_cy + r),
            outline=color + (220,),
            width=30,
        )
    canvas = Image.alpha_composite(canvas, overlay)
    draw = ImageDraw.Draw(canvas)

    # Eyebrow top-left
    draw_text(
        draw,
        (SAFE_INSET, SAFE_INSET),
        "AI DAY · JUNE.9.2026",
        font(F_MONO_BOLD, 9),
        ANCHOR_LIGHT,
        anchor="la",
        tracking=180,
    )

    # Amount — huge bottom-left
    amount_str = f"${amount}"
    amt_font = font(F_DISPLAY_BLACK, 110)
    amt_y = H - SAFE_INSET - int(110 * DPI / 72) - 50  # rough baseline
    draw_text(
        draw,
        (SAFE_INSET, amt_y),
        amount_str,
        amt_font,
        ANCHOR_LIGHT,
        anchor="la",
    )

    # "GIFT CARD" under amount
    gc_font = font(F_DISPLAY_BOLD, 22)
    # Measure amount height to position below
    amt_bbox = draw.textbbox((SAFE_INSET, amt_y), amount_str, font=amt_font, anchor="la")
    draw_text(
        draw,
        (SAFE_INSET + 8, amt_bbox[3] - 20),
        "GIFT CARD",
        gc_font,
        ANCHOR_LIGHT,
        anchor="la",
        tracking=120,
    )

    # Lockup top-right (white-R variant on amber)
    lockup_h = 110
    lockup_w = int(Image.open(LOCKUP_PATH).width * lockup_h / Image.open(LOCKUP_PATH).height)
    paste_lockup(
        canvas,
        LOCKUP_PATH,
        W - SAFE_INSET - lockup_w,
        SAFE_INSET - 10,
        lockup_h,
    )

    return canvas


# ============================================================
# BACK
# ============================================================
def build_back(amount):
    canvas = Image.new("RGBA", (W, H), ANCHOR_LIGHT + (255,))
    draw = ImageDraw.Draw(canvas)

    # Top eyebrow
    draw_text(
        draw,
        (SAFE_INSET, SAFE_INSET),
        "PROJECT AIR · AI IN REACH",
        font(F_MONO_BOLD, 9),
        ANCHOR_DARK,
        anchor="la",
        tracking=180,
    )

    # Thin accent rule
    rule_y = SAFE_INSET + 50
    draw.rectangle(
        [(SAFE_INSET, rule_y), (SAFE_INSET + 80, rule_y + 5)],
        fill=AMBER_DOM,
    )

    # Body text
    y = rule_y + 40
    body_font = font(F_DISPLAY_MED, 12)
    line_height = int(12 * DPI / 72 * 1.35)

    body_lines = [
        f"This card is valid for ${amount} at twcshop.com",
        "Redeem at checkout using the code below.",
    ]
    for line in body_lines:
        draw_text(draw, (SAFE_INSET, y), line, body_font, ANCHOR_DARK, anchor="la")
        y += line_height

    # Code label + placeholder
    y += 30
    label_font = font(F_MONO_REG, 8)
    draw_text(
        draw,
        (SAFE_INSET, y),
        "CODE",
        label_font,
        ANCHOR_DARK,
        anchor="la",
        tracking=200,
    )
    y += 30
    code_font = font(F_MONO_BOLD, 22)
    draw_text(
        draw,
        (SAFE_INSET, y),
        "████  ████  ████",
        code_font,
        ANCHOR_DARK,
        anchor="la",
        tracking=100,
    )

    # Expiry
    y += int(22 * DPI / 72 * 1.6)
    draw_text(
        draw,
        (SAFE_INSET, y),
        "EXP  06.09.2027",
        label_font,
        ANCHOR_DARK,
        anchor="la",
        tracking=200,
    )

    # Lockup bottom-right (black-R on cream)
    lockup_h = 100
    lockup_w_img = Image.open(LOCKUP_DARK_PATH)
    lockup_w = int(lockup_w_img.width * lockup_h / lockup_w_img.height)
    paste_lockup(
        canvas,
        LOCKUP_DARK_PATH,
        W - SAFE_INSET - lockup_w,
        H - SAFE_INSET - lockup_h,
        lockup_h,
    )

    return canvas


# ============================================================
def main():
    amount = int(sys.argv[1]) if len(sys.argv) > 1 else 50

    front = build_front(amount)
    back = build_back(amount)

    front_path = f"{OUT_DIR}/AIDAY-Giftcard-{amount}-R1-front.png"
    back_path = f"{OUT_DIR}/AIDAY-Giftcard-{amount}-R1-back.png"

    front.save(front_path, "PNG", dpi=(DPI, DPI))
    back.save(back_path, "PNG", dpi=(DPI, DPI))

    print(f"Saved {front_path}  ({W}x{H} at {DPI} DPI)")
    print(f"Saved {back_path}  ({W}x{H} at {DPI} DPI)")
    print(f"Trim: {TRIM_W_IN}\" x {TRIM_H_IN}\" (bleed {BLEED_IN}\" each side)")


if __name__ == "__main__":
    main()
