const pptxgen = require("pptxgenjs");
const sharp   = require("sharp");

// ── Palette — Wrapped-inspired, NOT corporate ──────────────────────────────
const NEAR_BLACK = "111111";   // dark bg + arc stripes on cream slides
const CREAM      = "EDEBE4";   // light bg + arc stripes on dark slides
const AMBER      = "C8910A";   // warm gold accent — ONE stripe per arc
const WHITE      = "FFFFFF";
const MUTED_TEXT = "AAAAAA";   // body copy on dark
const GRAY_LABEL = "AAAAAA";   // panel labels on light
const DARK_LABEL = "494949";   // panel labels on dark panels
const DIVIDER    = "CEC9C2";   // vertical divider on concept slides

// ── Arc Generator ──────────────────────────────────────────────────────────
// Concentric quarter-circle stripes — like Spotify Wrapped 2025
function makeArcSvg(size, corner, stripeHex, accentHex) {
  const nStripes = 8;
  const maxR     = size;
  const unit     = maxR / nStripes;
  const sw       = unit * 0.65;  // bold/thick like Wrapped

  const C = { TR: [size, 0], TL: [0, 0], BR: [size, size], BL: [0, size] };
  const [cx, cy] = C[corner];

  let paths = "";
  for (let i = 0; i < nStripes; i++) {
    const r2 = maxR - i * unit;
    const r1 = r2 - sw;
    if (r1 <= 2) continue;

    // 3rd stripe from outside = accent
    const fill = i === 2 ? `#${accentHex}` : `#${stripeHex}`;

    let d;
    switch (corner) {
      case "TR":
        d = `M ${cx-r2},${cy} A ${r2},${r2} 0 0,1 ${cx},${cy+r2}`
          + ` L ${cx},${cy+r1} A ${r1},${r1} 0 0,0 ${cx-r1},${cy} Z`;
        break;
      case "TL":
        d = `M ${r2},0 A ${r2},${r2} 0 0,0 0,${r2}`
          + ` L 0,${r1} A ${r1},${r1} 0 0,1 ${r1},0 Z`;
        break;
      case "BR":
        d = `M ${cx-r2},${cy} A ${r2},${r2} 0 0,0 ${cx},${cy-r2}`
          + ` L ${cx},${cy-r1} A ${r1},${r1} 0 0,1 ${cx-r1},${cy} Z`;
        break;
      case "BL":
        d = `M ${r2},${cy} A ${r2},${r2} 0 0,1 0,${cy-r2}`
          + ` L 0,${cy-r1} A ${r1},${r1} 0 0,0 ${r1},${cy} Z`;
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

// ── Scribble Line ──────────────────────────────────────────────────────────
// Thin looping bezier curve — the hand-drawn overlay from the Figma templates
function makeScribbleSvg(w, h, strokeHex) {
  const sw = Math.max(2, Math.round(w * 0.0024));
  // Loose loop that sweeps from left, loops in center, trails to lower-right
  const d = [
    `M ${w * 0.04},${h * 0.52}`,
    `C ${w * 0.20},${h * 0.15} ${w * 0.46},${h * 0.05} ${w * 0.60},${h * 0.34}`,
    `C ${w * 0.67},${h * 0.50} ${w * 0.50},${h * 0.56} ${w * 0.57},${h * 0.40}`,
    `C ${w * 0.63},${h * 0.26} ${w * 0.78},${h * 0.30} ${w * 0.96},${h * 0.76}`,
  ].join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <path d="${d}" fill="none" stroke="#${strokeHex}" stroke-width="${sw}" stroke-linecap="round" opacity="0.30"/>
  </svg>`;
}

async function scribbleData(w, h, strokeHex) {
  const svg = makeScribbleSvg(w, h, strokeHex);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {

  const [
    arc_title,       // Title: large cream arc, top-right
    arc_bl_title,    // Title: small cream arc, bottom-left
    arc_concept_tr,  // Concept: small cream arc in title bar corner (top-right)
    arc_concept_br,  // Concept: medium dark arc, bottom-right content area
    arc_nextsteps,   // Next Steps: large cream arc, bottom-right
    scrib_dark,      // Scribble on dark slides
    scrib_light,     // Scribble on light slides
  ] = await Promise.all([
    arcData(1000, "TR", CREAM, AMBER),
    arcData(420,  "BL", CREAM, AMBER),
    arcData(260,  "TR", CREAM, AMBER),
    arcData(480,  "BR", NEAR_BLACK, AMBER),
    arcData(840,  "BR", CREAM, AMBER),
    scribbleData(1440, 810, CREAM),
    scribbleData(1440, 810, NEAR_BLACK),
  ]);

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title  = "Project AIR - Logo Direction";
  pres.author = "Michael Powell";

  // ────────────────────────────────────────────────────────────────────────
  // SLIDE 1 — Title (dark near-black)
  // ────────────────────────────────────────────────────────────────────────
  const s1 = pres.addSlide();
  s1.background = { color: NEAR_BLACK };

  // Large cream arc — top-right, bleeds off both edges
  s1.addImage({ data: arc_title, x: 4.6, y: -0.5, w: 5.9, h: 5.9 });

  // Small cream arc — bottom-left, bleeds off corner
  s1.addImage({ data: arc_bl_title, x: -0.4, y: 3.6, w: 2.8, h: 2.8 });

  // Scribble overlay
  s1.addImage({ data: scrib_dark, x: 0, y: 0, w: 10, h: 5.625 });

  // Vertical "AI IN REACH" — left edge, reads bottom-to-top
  // Text box center will be at approx (0.22, 2.5) after rotation
  s1.addText("AI IN REACH", {
    x: -1.2, y: 2.12, w: 2.75, h: 0.36,
    fontFace: "Calibri", fontSize: 9, bold: true,
    color: AMBER, align: "center", charSpacing: 6,
    rotate: 270, margin: 0,
  });

  // Hero title
  s1.addText("PROJECT AIR", {
    x: 0.52, y: 1.05, w: 6.0, h: 1.15,
    fontFace: "Calibri", fontSize: 66, bold: true,
    color: WHITE, align: "left", valign: "middle",
    charSpacing: 1, margin: 0,
  });

  // "LOGO DIRECTION" — amber, tracked wide
  s1.addText("LOGO DIRECTION", {
    x: 0.52, y: 2.36, w: 5.5, h: 0.44,
    fontFace: "Calibri", fontSize: 15, bold: false,
    color: AMBER, align: "left", charSpacing: 8, margin: 0,
  });

  // Event line
  s1.addText("AI in Reach  |  The Weather Company  |  AI Day, June 9, 2026", {
    x: 0.52, y: 2.9, w: 5.8, h: 0.34,
    fontFace: "Calibri", fontSize: 10, color: "555555",
    align: "left", charSpacing: 0.5, margin: 0,
  });

  // Intent copy
  s1.addText(
    "This presentation shows the logo concept(s) for Project AIR: AI in Reach. " +
    "The logo is the foundation - once approved, it unlocks every other deliverable: " +
    "the poster system, badge and lanyard design, the PowerPoint template, and swag. " +
    "Feedback here moves the whole project forward.",
    {
      x: 0.52, y: 3.38, w: 5.5, h: 2.0,
      fontFace: "Calibri", fontSize: 12,
      color: "777777", align: "left", valign: "top",
      lineSpacingMultiple: 1.45, margin: 0,
    }
  );

  // ────────────────────────────────────────────────────────────────────────
  // CONCEPT SLIDE FACTORY
  // ────────────────────────────────────────────────────────────────────────
  function addConceptSlide(letter) {
    const s = pres.addSlide();
    s.background = { color: CREAM };

    // Scribble overlay (very subtle on cream)
    s.addImage({ data: scrib_light, x: 0, y: 0, w: 10, h: 5.625 });

    // Small cream arc in the title bar, top-right corner
    s.addImage({ data: arc_concept_tr, x: 8.4, y: 0, w: 1.6, h: 1.6 });

    // Medium dark arc, bottom-right content area
    s.addImage({ data: arc_concept_br, x: 7.8, y: 3.1, w: 2.5, h: 2.5 });

    // Title bar — near-black strip
    const TH = 0.60;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: TH,
      fill: { color: NEAR_BLACK }, line: { color: NEAR_BLACK },
    });
    // Small amber dot accent in title bar
    s.addShape(pres.shapes.OVAL, {
      x: 0.18, y: TH / 2 - 0.06, w: 0.12, h: 0.12,
      fill: { color: AMBER }, line: { color: AMBER },
    });
    s.addText(`Concept ${letter}`, {
      x: 0.40, y: 0, w: 5.5, h: TH,
      fontFace: "Calibri", fontSize: 19, bold: true,
      color: WHITE, align: "left", valign: "middle",
      charSpacing: 1, margin: 0,
    });

    // ── Left column: stacked logo panels ─────────────────────────────────
    const PW  = 4.65;
    const PH  = (5.625 - TH) / 2;   // half of content height each
    const PT  = TH;                  // top panel y
    const PB  = TH + PH;             // bottom panel y
    const PHW = 2.65;
    const PHH = 1.18;
    const PHX = (PW - PHW) / 2;

    // Light panel (white)
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: PT, w: PW, h: PH,
      fill: { color: WHITE }, line: { color: "DDD8D2", width: 0.5 },
    });
    s.addText("LIGHT BACKGROUND", {
      x: 0.1, y: PT + 0.1, w: PW - 0.2, h: 0.24,
      fontFace: "Calibri", fontSize: 7, charSpacing: 3,
      color: GRAY_LABEL, align: "center", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: PHX, y: PT + (PH - PHH) / 2 + 0.08, w: PHW, h: PHH,
      fill: { color: WHITE },
      line: { color: "C8C8C8", width: 0.75, dashType: "dash" },
    });
    s.addText("Logo - Light Background", {
      x: PHX, y: PT + (PH - PHH) / 2 + 0.08, w: PHW, h: PHH,
      fontFace: "Calibri", fontSize: 10, italic: true,
      color: GRAY_LABEL, align: "center", valign: "middle", margin: 0,
    });

    // Dark panel (near-black)
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: PB, w: PW, h: PH,
      fill: { color: NEAR_BLACK }, line: { color: NEAR_BLACK },
    });
    s.addText("DARK BACKGROUND", {
      x: 0.1, y: PB + 0.1, w: PW - 0.2, h: 0.24,
      fontFace: "Calibri", fontSize: 7, charSpacing: 3,
      color: DARK_LABEL, align: "center", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: PHX, y: PB + (PH - PHH) / 2 + 0.08, w: PHW, h: PHH,
      fill: { color: NEAR_BLACK },
      line: { color: "3A3A3A", width: 0.75, dashType: "dash" },
    });
    s.addText("Logo - Dark Background", {
      x: PHX, y: PB + (PH - PHH) / 2 + 0.08, w: PHW, h: PHH,
      fontFace: "Calibri", fontSize: 10, italic: true,
      color: "505050", align: "center", valign: "middle", margin: 0,
    });

    // Vertical divider
    s.addShape(pres.shapes.LINE, {
      x: PW, y: TH, w: 0, h: 5.625 - TH,
      line: { color: DIVIDER, width: 0.75 },
    });

    // ── Right column: Rationale ───────────────────────────────────────────
    const RX = PW + 0.38;
    const RW = 10 - PW - 0.52;

    s.addText("Rationale", {
      x: RX, y: 0.88, w: RW, h: 0.42,
      fontFace: "Calibri", fontSize: 17, bold: true,
      color: NEAR_BLACK, align: "left", margin: 0,
    });
    // Small amber accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: RX, y: 1.36, w: 0.28, h: 0.048,
      fill: { color: AMBER }, line: { color: AMBER },
    });
    s.addText(
      "Describe the thinking behind this concept - what it represents, " +
      "why the form and feeling fit the brief, how it connects to the " +
      "SXSW-meets-Coachella energy of Project AIR.",
      {
        x: RX, y: 1.54, w: RW, h: 3.75,
        fontFace: "Calibri", fontSize: 12, italic: true,
        color: "999999", align: "left", valign: "top",
        lineSpacingMultiple: 1.5, margin: 0,
      }
    );
  }

  addConceptSlide("A");
  addConceptSlide("B");

  // ────────────────────────────────────────────────────────────────────────
  // SLIDE 4 — Next Steps (dark)
  // ────────────────────────────────────────────────────────────────────────
  const s4 = pres.addSlide();
  s4.background = { color: NEAR_BLACK };

  // Large cream arc — bottom-right, bleeds off corner
  s4.addImage({ data: arc_nextsteps, x: 5.7, y: 1.6, w: 4.7, h: 4.7 });

  // Scribble overlay
  s4.addImage({ data: scrib_dark, x: 0, y: 0, w: 10, h: 5.625 });

  // Vertical "AI IN REACH" — left edge
  s4.addText("AI IN REACH", {
    x: -1.2, y: 2.12, w: 2.75, h: 0.36,
    fontFace: "Calibri", fontSize: 9, bold: true,
    color: AMBER, align: "center", charSpacing: 6,
    rotate: 270, margin: 0,
  });

  // Title
  s4.addText("NEXT STEPS", {
    x: 0.52, y: 0.38, w: 8.5, h: 0.9,
    fontFace: "Calibri", fontSize: 44, bold: true,
    color: WHITE, align: "left", valign: "middle",
    charSpacing: 4, margin: 0,
  });

  // Small amber accent bar under title
  s4.addShape(pres.shapes.RECTANGLE, {
    x: 0.52, y: 1.36, w: 0.28, h: 0.048,
    fill: { color: AMBER }, line: { color: AMBER },
  });

  // Numbered steps — amber numbers, muted body
  const steps = [
    "Review concepts and share reactions - what's working, what isn't",
    "Mark calls direction - one concept moves forward (target: May 7)",
    "Michael refines selected concept to final logo (target: May 9)",
    "Final logo delivered in all formats: SVG, PNG (light + dark), EPS",
    "Brand guidelines follow same day - color, type, usage rules",
    "Lee and Camille begin visual systems (posters, badges, swag, PPT template) off approved logo",
  ];

  const runs = [];
  steps.forEach((step, i) => {
    runs.push({ text: `${i + 1}.   `, options: { bold: true, color: AMBER } });
    runs.push({ text: step, options: { color: MUTED_TEXT, breakLine: i < steps.length - 1 } });
  });

  s4.addText(runs, {
    x: 0.52, y: 1.72, w: 7.4, h: 3.6,
    fontFace: "Calibri", fontSize: 12.5,
    align: "left", valign: "top",
    paraSpaceAfter: 6, margin: 0,
  });

  // ── Write ─────────────────────────────────────────────────────────────
  const outPath = "/Users/michael.powell/Claude Code1/project-air-creative/assets/templates/logo-presentation.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("Saved:", outPath);
}

main().catch(err => { console.error("ERROR:", err); process.exit(1); });
