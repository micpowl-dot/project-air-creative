const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Project AIR — Logo Direction";
pres.author = "Michael Powell";

// ── Palette ────────────────────────────────────────────────────────────────
const DARK_BG     = "131F16";   // near-black green — title + closer slides
const MID_GREEN   = "2D5A3D";   // left accent bar fill
const ACCENT_LINE = "4A7C59";   // thin accent lines
const LIGHT_TEXT  = "9DC08B";   // subtitle / numbered bullets
const BODY_TEXT   = "C5D5BB";   // body copy on dark slides
const TITLE_BAR   = "1B3A2D";   // concept slide header strip
const NEAR_BLACK  = "1A1A1A";   // dark logo panel
const CREAM       = "F5F4F0";   // light slide background
const WHITE       = "FFFFFF";
const GRAY_LIGHT  = "AAAAAA";   // placeholder label on light panel
const GRAY_DARK   = "666666";   // placeholder label on dark panel
const BORDER_LIGHT = "CCCCCC";  // dashed border in light panel
const BORDER_DARK  = "4A4A4A";  // dashed border in dark panel
const DIVIDER     = "D0C8BF";   // vertical divider between halves
const RTNL_HEAD   = "1B3A2D";   // "Rationale" heading color

// ── Slide 1 — Stage-Setting ───────────────────────────────────────────────
const s1 = pres.addSlide();
s1.background = { color: DARK_BG };

// Left accent bar
s1.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.32, h: 5.625,
  fill: { color: MID_GREEN }, line: { color: MID_GREEN }
});

// Title
s1.addText("Project AIR — Logo Direction", {
  x: 0.6, y: 1.3, w: 9.0, h: 1.1,
  fontFace: "Calibri", fontSize: 44, bold: true,
  color: WHITE, align: "left", valign: "middle", margin: 0
});

// Subtitle
s1.addText("AI in Reach  ·  The Weather Company  ·  AI Day, June 9, 2026", {
  x: 0.6, y: 2.55, w: 9.0, h: 0.42,
  fontFace: "Calibri", fontSize: 13,
  color: LIGHT_TEXT, align: "left", charSpacing: 1, margin: 0
});

// Thin accent line
s1.addShape(pres.shapes.LINE, {
  x: 0.6, y: 3.12, w: 2.8, h: 0,
  line: { color: ACCENT_LINE, width: 1.5 }
});

// Intent body copy
s1.addText(
  "This presentation shows the logo concept(s) for Project AIR: AI in Reach. " +
  "The logo is the foundation — once it is approved, it unlocks every other deliverable: " +
  "the poster system, badge and lanyard design, the PowerPoint template, and swag. " +
  "Feedback here moves the whole project forward.",
  {
    x: 0.6, y: 3.32, w: 8.8, h: 1.9,
    fontFace: "Calibri", fontSize: 13,
    color: BODY_TEXT, align: "left", valign: "top",
    lineSpacingMultiple: 1.35, margin: 0
  }
);

// ── Concept slide factory ─────────────────────────────────────────────────
function addConceptSlide(letter) {
  const s = pres.addSlide();
  s.background = { color: CREAM };

  // Dimensions
  const TITLE_H  = 0.65;
  const PANEL_W  = 4.9;
  const PANEL_H  = (5.625 - TITLE_H) / 2;   // 2.4875"
  const PANEL_T  = TITLE_H;                  // 0.65
  const PANEL_B  = TITLE_H + PANEL_H;        // 3.1375
  const PH_W     = 2.7;
  const PH_H     = 1.35;
  const PH_X     = (PANEL_W - PH_W) / 2;    // 1.1

  // Title bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: TITLE_H,
    fill: { color: TITLE_BAR }, line: { color: TITLE_BAR }
  });
  s.addText(`Concept ${letter}`, {
    x: 0.35, y: 0, w: 4.3, h: TITLE_H,
    fontFace: "Calibri", fontSize: 22, bold: true,
    color: WHITE, align: "left", valign: "middle", margin: 0
  });

  // ── Light panel (top-left) ──────────────────────────────────────────────
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: PANEL_T, w: PANEL_W, h: PANEL_H,
    fill: { color: WHITE }, line: { color: "E8E4DF", width: 0.5 }
  });
  // Label
  s.addText("LIGHT BACKGROUND", {
    x: 0.1, y: PANEL_T + 0.1, w: PANEL_W - 0.2, h: 0.28,
    fontFace: "Calibri", fontSize: 7.5, charSpacing: 2.5,
    color: GRAY_LIGHT, align: "center", margin: 0
  });
  // Dashed placeholder box
  s.addShape(pres.shapes.RECTANGLE, {
    x: PH_X, y: PANEL_T + (PANEL_H - PH_H) / 2 + 0.1,
    w: PH_W, h: PH_H,
    fill: { color: WHITE },
    line: { color: BORDER_LIGHT, width: 0.75, dashType: "dash" }
  });
  s.addText("Logo — Light Background", {
    x: PH_X, y: PANEL_T + (PANEL_H - PH_H) / 2 + 0.1,
    w: PH_W, h: PH_H,
    fontFace: "Calibri", fontSize: 10.5, italic: true,
    color: GRAY_LIGHT, align: "center", valign: "middle", margin: 0
  });

  // ── Dark panel (bottom-left) ────────────────────────────────────────────
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: PANEL_B, w: PANEL_W, h: PANEL_H,
    fill: { color: NEAR_BLACK }, line: { color: NEAR_BLACK }
  });
  // Label
  s.addText("DARK BACKGROUND", {
    x: 0.1, y: PANEL_B + 0.1, w: PANEL_W - 0.2, h: 0.28,
    fontFace: "Calibri", fontSize: 7.5, charSpacing: 2.5,
    color: GRAY_DARK, align: "center", margin: 0
  });
  // Dashed placeholder box
  s.addShape(pres.shapes.RECTANGLE, {
    x: PH_X, y: PANEL_B + (PANEL_H - PH_H) / 2 + 0.1,
    w: PH_W, h: PH_H,
    fill: { color: NEAR_BLACK },
    line: { color: BORDER_DARK, width: 0.75, dashType: "dash" }
  });
  s.addText("Logo — Dark Background", {
    x: PH_X, y: PANEL_B + (PANEL_H - PH_H) / 2 + 0.1,
    w: PH_W, h: PH_H,
    fontFace: "Calibri", fontSize: 10.5, italic: true,
    color: GRAY_DARK, align: "center", valign: "middle", margin: 0
  });

  // ── Vertical divider ────────────────────────────────────────────────────
  s.addShape(pres.shapes.LINE, {
    x: PANEL_W, y: TITLE_H, w: 0, h: 5.625 - TITLE_H,
    line: { color: DIVIDER, width: 0.75 }
  });

  // ── Right panel — Rationale ─────────────────────────────────────────────
  const RX = PANEL_W + 0.32;
  const RW = 10 - PANEL_W - 0.45;

  s.addText("Rationale", {
    x: RX, y: 0.95, w: RW, h: 0.45,
    fontFace: "Calibri", fontSize: 18, bold: true,
    color: RTNL_HEAD, align: "left", margin: 0
  });
  s.addShape(pres.shapes.LINE, {
    x: RX, y: 1.47, w: 1.4, h: 0,
    line: { color: ACCENT_LINE, width: 1.5 }
  });
  s.addText(
    "Describe the thinking behind this concept — what it represents, why the form and feeling " +
    "fit the brief, how it connects to the SXSW-meets-Coachella energy of Project AIR.",
    {
      x: RX, y: 1.65, w: RW, h: 3.5,
      fontFace: "Calibri", fontSize: 13, italic: true,
      color: "999999", align: "left", valign: "top",
      lineSpacingMultiple: 1.45, margin: 0
    }
  );
}

addConceptSlide("A");
addConceptSlide("B");

// ── Slide 4 — Next Steps ──────────────────────────────────────────────────
const s4 = pres.addSlide();
s4.background = { color: DARK_BG };

// Left accent bar
s4.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.32, h: 5.625,
  fill: { color: MID_GREEN }, line: { color: MID_GREEN }
});

// Title
s4.addText("Next Steps", {
  x: 0.6, y: 0.4, w: 9.0, h: 0.8,
  fontFace: "Calibri", fontSize: 38, bold: true,
  color: WHITE, align: "left", valign: "middle", margin: 0
});

// Accent line
s4.addShape(pres.shapes.LINE, {
  x: 0.6, y: 1.32, w: 2.0, h: 0,
  line: { color: ACCENT_LINE, width: 1.5 }
});

// Numbered steps
const steps = [
  "Review concepts and share reactions — what's working, what isn't",
  "Mark calls direction — one concept moves forward  (target: May 7)",
  "Michael refines selected concept to final logo  (target: May 9)",
  "Final logo delivered in all formats: SVG, PNG (light + dark), EPS",
  "Brand guidelines follow same day — color, type, usage rules",
  "Lee and Camille begin visual systems (posters, badges, swag, PPT template) off approved logo"
];

const stepRuns = [];
steps.forEach((step, i) => {
  stepRuns.push({ text: `${i + 1}.   `, options: { bold: true, color: LIGHT_TEXT } });
  stepRuns.push({
    text: step,
    options: {
      color: BODY_TEXT,
      breakLine: i < steps.length - 1
    }
  });
});

s4.addText(stepRuns, {
  x: 0.6, y: 1.52, w: 9.0, h: 3.8,
  fontFace: "Calibri", fontSize: 12.5,
  align: "left", valign: "top",
  paraSpaceAfter: 4,
  margin: 0
});

// ── Write ─────────────────────────────────────────────────────────────────
pres
  .writeFile({ fileName: "/Users/michael.powell/Downloads/project-air-creative/assets/templates/logo-presentation.pptx" })
  .then(() => console.log("✅  Saved: logo-presentation.pptx"))
  .catch(err => { console.error("❌  Error:", err); process.exit(1); });
