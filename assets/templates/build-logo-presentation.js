const pptxgen = require("pptxgenjs");
const sharp   = require("sharp");

// ── Palette ────────────────────────────────────────────────────────────────
const DARK_BG    = "131F16";   // near-black green  — dark slides
const MID_GREEN  = "2D5A3D";   // medium forest green — arc stripes on dark / accents
const ACC_GREEN  = "4A7C59";   // lighter accent green
const SOFT_GREEN = "9DC08B";   // pale sage — subtitle / secondary text on dark
const BODY_PALE  = "C5D5BB";   // body copy on dark
const CREAM      = "F5F4F0";   // light slide background
const NEAR_BLACK = "1A1A1A";   // arc stripes on light slides
const TITLE_BAR  = "1B3A2D";   // concept slide header strip
const WHITE      = "FFFFFF";
const GRAY_LABEL = "AAAAAA";   // panel labels
const GRAY_DARK  = "666666";   // dark panel labels
const DIVIDER    = "D0C8BF";   // vertical divider

// ── Arc Generator (concentric quarter-circle stripes) ──────────────────────
function makeArcSvg(size, corner, stripeHex, accentHex) {
  const nStripes  = 10;
  const maxR      = size;
  const unit      = maxR / nStripes;
  const sw        = unit * 0.50; // stripe width (50% of unit — bold, like Wrapped)

  // corner center in SVG coords
  const C = { TR: [size, 0], TL: [0, 0], BR: [size, size], BL: [0, size] };
  const [cx, cy] = C[corner];

  let paths = "";
  for (let i = 0; i < nStripes; i++) {
    const r2 = maxR - i * unit;
    const r1 = r2 - sw;
    if (r1 <= 2) continue;

    // 3rd stripe from outside = accent color
    const fill = i === 2 ? `#${accentHex}` : `#${stripeHex}`;

    let d;
    switch (corner) {
      case "TR":
        // center (size,0) — arc from (cx-r2, 0) clockwise to (cx, r2)
        d = `M ${cx - r2},${cy} A ${r2},${r2} 0 0,1 ${cx},${cy + r2}`
          + ` L ${cx},${cy + r1} A ${r1},${r1} 0 0,0 ${cx - r1},${cy} Z`;
        break;
      case "TL":
        // center (0,0) — arc from (r2,0) counter-clockwise to (0,r2)
        d = `M ${r2},0 A ${r2},${r2} 0 0,0 0,${r2}`
          + ` L 0,${r1} A ${r1},${r1} 0 0,1 ${r1},0 Z`;
        break;
      case "BR":
        // center (size,size) — arc from (cx-r2, cy) counter-clockwise to (cx, cy-r2)
        d = `M ${cx - r2},${cy} A ${r2},${r2} 0 0,0 ${cx},${cy - r2}`
          + ` L ${cx},${cy - r1} A ${r1},${r1} 0 0,1 ${cx - r1},${cy} Z`;
        break;
      case "BL":
        // center (0,size) — arc from (r2,cy) clockwise to (0, cy-r2)
        d = `M ${r2},${cy} A ${r2},${r2} 0 0,1 0,${cy - r2}`
          + ` L 0,${cy - r1} A ${r1},${r1} 0 0,0 ${r1},${cy} Z`;
        break;
    }
    paths += `<path d="${d}" fill="${fill}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg>`;
}

async function arcData(size, corner, stripe, accent) {
  const svg = makeArcSvg(size, corner, stripe, accent);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {

  // Pre-render all arc images
  const [arcTR_dark, arcBL_dark, arcTR_light, arcBR_dark] = await Promise.all([
    arcData(600, "TR", MID_GREEN,  ACC_GREEN),   // title slide top-right
    arcData(380, "BL", MID_GREEN,  ACC_GREEN),   // title slide bottom-left
    arcData(520, "TR", NEAR_BLACK, MID_GREEN),   // concept slides top-right
    arcData(480, "BR", MID_GREEN,  ACC_GREEN),   // next steps bottom-right
  ]);

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title  = "Project AIR — Logo Direction";
  pres.author = "Michael Powell";

  // ────────────────────────────────────────────────────────────────────────
  // SLIDE 1 — Title (dark)
  // ────────────────────────────────────────────────────────────────────────
  const s1 = pres.addSlide();
  s1.background = { color: DARK_BG };

  // Arc — top-right (3" × 3", bleeds off right+top edge)
  s1.addImage({ data: arcTR_dark, x: 7.05, y: 0,    w: 2.95, h: 2.95 });
  // Arc — bottom-left (2" × 2", bleeds off left+bottom edge)
  s1.addImage({ data: arcBL_dark, x: 0,    y: 3.625, w: 2.0,  h: 2.0  });

  // Thin left accent bar
  s1.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.28, h: 5.625,
    fill: { color: MID_GREEN }, line: { color: MID_GREEN }
  });

  // "PROJECT AIR" — hero title
  s1.addText("PROJECT AIR", {
    x: 0.55, y: 1.1, w: 7.2, h: 1.15,
    fontFace: "Calibri", fontSize: 56, bold: true,
    color: WHITE, align: "left", valign: "middle",
    charSpacing: 3, margin: 0
  });

  // "— LOGO DIRECTION" — secondary title
  s1.addText("LOGO DIRECTION", {
    x: 0.55, y: 2.35, w: 7.2, h: 0.5,
    fontFace: "Calibri", fontSize: 20, bold: false,
    color: SOFT_GREEN, align: "left", charSpacing: 5, margin: 0
  });

  // Thin accent line
  s1.addShape(pres.shapes.LINE, {
    x: 0.55, y: 3.0, w: 2.8, h: 0,
    line: { color: ACC_GREEN, width: 1.5 }
  });

  // Intent body copy
  s1.addText(
    "This presentation shows the logo concept(s) for Project AIR: AI in Reach. " +
    "The logo is the foundation — once approved, it unlocks every other deliverable: " +
    "the poster system, badge and lanyard design, the PowerPoint template, and swag. " +
    "Feedback here moves the whole project forward.",
    {
      x: 0.55, y: 3.18, w: 6.8, h: 1.9,
      fontFace: "Calibri", fontSize: 12.5,
      color: BODY_PALE, align: "left", valign: "top",
      lineSpacingMultiple: 1.4, margin: 0
    }
  );

  // ────────────────────────────────────────────────────────────────────────
  // CONCEPT SLIDE FACTORY (Slides 2 & 3)
  // ────────────────────────────────────────────────────────────────────────
  function addConceptSlide(letter) {
    const s = pres.addSlide();
    s.background = { color: CREAM };

    // Arc — top-right, over the title bar + into content area
    s.addImage({ data: arcTR_light, x: 7.55, y: 0, w: 2.45, h: 2.45 });

    // Title bar (full-width dark strip)
    const TITLE_H = 0.65;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: TITLE_H,
      fill: { color: TITLE_BAR }, line: { color: TITLE_BAR }
    });
    s.addText(`Concept ${letter}`, {
      x: 0.35, y: 0, w: 5.5, h: TITLE_H,
      fontFace: "Calibri", fontSize: 21, bold: true,
      color: WHITE, align: "left", valign: "middle",
      charSpacing: 1, margin: 0
    });

    // ── LEFT HALF — stacked logo panels ──────────────────────────────────
    const PW    = 4.85;                          // panel width
    const PH    = (5.625 - TITLE_H) / 2;        // 2.4875" each
    const PT    = TITLE_H;                       // 0.65 — top of panels
    const PB    = TITLE_H + PH;                  // 3.1375 — bottom panel starts

    const PHW   = 2.75;                          // placeholder box width
    const PHH   = 1.3;                           // placeholder box height
    const PHX   = (PW - PHW) / 2;               // 1.05 — centered in panel

    // White (light) panel
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: PT, w: PW, h: PH,
      fill: { color: WHITE }, line: { color: "E8E3DD", width: 0.5 }
    });
    s.addText("LIGHT BACKGROUND", {
      x: 0.1, y: PT + 0.1, w: PW - 0.2, h: 0.28,
      fontFace: "Calibri", fontSize: 7, charSpacing: 3,
      color: GRAY_LABEL, align: "center", margin: 0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: PHX, y: PT + (PH - PHH) / 2 + 0.1, w: PHW, h: PHH,
      fill: { color: WHITE },
      line: { color: "C8C8C8", width: 0.75, dashType: "dash" }
    });
    s.addText("Logo — Light Background", {
      x: PHX, y: PT + (PH - PHH) / 2 + 0.1, w: PHW, h: PHH,
      fontFace: "Calibri", fontSize: 10, italic: true,
      color: GRAY_LABEL, align: "center", valign: "middle", margin: 0
    });

    // Dark panel
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: PB, w: PW, h: PH,
      fill: { color: NEAR_BLACK }, line: { color: NEAR_BLACK }
    });
    s.addText("DARK BACKGROUND", {
      x: 0.1, y: PB + 0.1, w: PW - 0.2, h: 0.28,
      fontFace: "Calibri", fontSize: 7, charSpacing: 3,
      color: GRAY_DARK, align: "center", margin: 0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: PHX, y: PB + (PH - PHH) / 2 + 0.1, w: PHW, h: PHH,
      fill: { color: NEAR_BLACK },
      line: { color: "4A4A4A", width: 0.75, dashType: "dash" }
    });
    s.addText("Logo — Dark Background", {
      x: PHX, y: PB + (PH - PHH) / 2 + 0.1, w: PHW, h: PHH,
      fontFace: "Calibri", fontSize: 10, italic: true,
      color: GRAY_DARK, align: "center", valign: "middle", margin: 0
    });

    // Vertical divider
    s.addShape(pres.shapes.LINE, {
      x: PW, y: TITLE_H, w: 0, h: 5.625 - TITLE_H,
      line: { color: DIVIDER, width: 0.75 }
    });

    // ── RIGHT HALF — Rationale ────────────────────────────────────────────
    const RX = PW + 0.3;
    const RW = 10 - PW - 0.42;

    s.addText("Rationale", {
      x: RX, y: 0.92, w: RW, h: 0.44,
      fontFace: "Calibri", fontSize: 18, bold: true,
      color: TITLE_BAR, align: "left", margin: 0
    });
    s.addShape(pres.shapes.LINE, {
      x: RX, y: 1.43, w: 1.4, h: 0,
      line: { color: ACC_GREEN, width: 1.5 }
    });
    s.addText(
      "Describe the thinking behind this concept — what it represents, " +
      "why the form and feeling fit the brief, how it connects to the " +
      "SXSW-meets-Coachella energy of Project AIR.",
      {
        x: RX, y: 1.6, w: RW, h: 3.6,
        fontFace: "Calibri", fontSize: 12.5, italic: true,
        color: "999999", align: "left", valign: "top",
        lineSpacingMultiple: 1.5, margin: 0
      }
    );
  }

  addConceptSlide("A");
  addConceptSlide("B");

  // ────────────────────────────────────────────────────────────────────────
  // SLIDE 4 — Next Steps (dark)
  // ────────────────────────────────────────────────────────────────────────
  const s4 = pres.addSlide();
  s4.background = { color: DARK_BG };

  // Arc — bottom-right
  s4.addImage({ data: arcBR_dark, x: 7.55, y: 3.125, w: 2.45, h: 2.5 });

  // Left accent bar
  s4.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.28, h: 5.625,
    fill: { color: MID_GREEN }, line: { color: MID_GREEN }
  });

  // Title
  s4.addText("NEXT STEPS", {
    x: 0.55, y: 0.38, w: 9.0, h: 0.85,
    fontFace: "Calibri", fontSize: 42, bold: true,
    color: WHITE, align: "left", valign: "middle",
    charSpacing: 4, margin: 0
  });

  // Accent line
  s4.addShape(pres.shapes.LINE, {
    x: 0.55, y: 1.35, w: 2.2, h: 0,
    line: { color: ACC_GREEN, width: 1.5 }
  });

  // Steps
  const steps = [
    "Review concepts and share reactions — what's working, what isn't",
    "Mark calls direction — one concept moves forward  (target: May 7)",
    "Michael refines selected concept to final logo  (target: May 9)",
    "Final logo delivered in all formats: SVG, PNG (light + dark), EPS",
    "Brand guidelines follow same day — color, type, usage rules",
    "Lee and Camille begin visual systems (posters, badges, swag, PPT template) off approved logo"
  ];

  const runs = [];
  steps.forEach((step, i) => {
    runs.push({ text: `${i + 1}.   `, options: { bold: true, color: SOFT_GREEN } });
    runs.push({ text: step, options: { color: BODY_PALE, breakLine: i < steps.length - 1 } });
  });

  s4.addText(runs, {
    x: 0.55, y: 1.55, w: 7.0, h: 3.75,
    fontFace: "Calibri", fontSize: 12.5,
    align: "left", valign: "top",
    paraSpaceAfter: 4, margin: 0
  });

  // ── Write ─────────────────────────────────────────────────────────────
  const outPath = "/Users/michael.powell/Claude Code1/project-air-creative/assets/templates/logo-presentation.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("✅  Saved:", outPath);
}

main().catch(err => { console.error("❌", err); process.exit(1); });
