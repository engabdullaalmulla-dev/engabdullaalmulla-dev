const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
const W = 13.333, H = 7.5;

// ---- Palette: Teal Trust, clinical / screening ----
const DARK   = "07323B"; // deep teal-charcoal
const TEAL   = "028090";
const SEA    = "00A896";
const MINT   = "02C39A";
const INK    = "16262B";
const GREY   = "5A6B70";
const MUTED  = "8A9BA1";
const PAPER  = "F4F7F8";
const WHITE  = "FFFFFF";

const HEAD = "Cambria";
const BODY = "Calibri";

const M = 0.75;            // page margin
const CW = W - M * 2;      // content width

pres.author = "Abdulla Almulla";
pres.title  = "Clinical Acceptability of Automated Cervical Cancer Risk Prediction";

// ---------- helpers ----------
function darkSlide() {
  const s = pres.addSlide();
  s.background = { color: DARK };
  return s;
}
function lightSlide() {
  const s = pres.addSlide();
  s.background = { color: WHITE };
  return s;
}
function title(s, text, opts = {}) {
  s.addText(text, {
    x: M, y: opts.y ?? 0.52, w: CW, h: 0.85,
    fontSize: opts.fontSize ?? 34, bold: true, fontFace: HEAD,
    color: opts.color ?? INK, align: "left", valign: "middle",
    isTextBox: true, margin: 0,
  });
}
function kicker(s, text, opts = {}) {
  s.addText(text.toUpperCase(), {
    x: M, y: opts.y ?? 1.42, w: CW, h: 0.3,
    fontSize: 11.5, bold: true, fontFace: BODY, charSpacing: 2.2,
    color: opts.color ?? TEAL, isTextBox: true, margin: 0, valign: "middle",
  });
}
// The motif: a filled circle carrying a short label, repeated throughout.
function badge(s, x, y, d, label, fill, fg) {
  s.addShape(pres.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { color: fill || TEAL },
  });
  s.addText(label, {
    x, y, w: d, h: d, fontSize: d >= 0.72 ? 17 : 13.5, bold: true,
    fontFace: HEAD, color: fg || WHITE, align: "center", valign: "middle",
    isTextBox: true, margin: 0,
  });
}
function card(s, x, y, w, h, fill) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09,
    fill: { color: fill || PAPER },
  });
}
function footnote(s, text, color) {
  s.addText(text, {
    x: M, y: H - 0.72, w: CW, h: 0.32, fontSize: 10.5, italic: true,
    fontFace: BODY, color: color || MUTED, isTextBox: true, margin: 0, valign: "middle",
  });
}

// =====================================================================
// 1 — Title
// =====================================================================
{
  const s = darkSlide();
  // motif echo: three concentric rings bleeding off the right edge
  [4.6, 3.4, 2.2].forEach((d, i) => {
    s.addShape(pres.ShapeType.ellipse, {
      x: W - d / 2 - 0.6, y: H / 2 - d / 2, w: d, h: d,
      fill: { color: i === 2 ? MINT : TEAL, transparency: i === 2 ? 20 : 78 },
    });
  });

  s.addText("MSc Data Science and Artificial Intelligence  ·  Research Methods", {
    x: M, y: 1.35, w: 8.6, h: 0.32, fontSize: 12, bold: true, fontFace: BODY,
    charSpacing: 1.6, color: MINT, isTextBox: true, margin: 0, valign: "middle",
  });

  s.addText("Clinical Acceptability of\nAutomated Cervical Cancer\nRisk Prediction", {
    x: M, y: 2.0, w: 9.25, h: 2.5, fontSize: 36, bold: true, fontFace: HEAD,
    color: WHITE, lineSpacing: 43, isTextBox: true, margin: 0, valign: "top",
  });

  s.addText("Designing a survey instrument to test whether a model that finds 75% of positive cases is good enough for a screening pathway", {
    x: M, y: 4.75, w: 7.6, h: 0.8, fontSize: 15, fontFace: BODY,
    color: "C9DDE1", lineSpacing: 23, isTextBox: true, margin: 0, valign: "top",
  });

  s.addShape(pres.ShapeType.rect, { x: M, y: 5.95, w: 0.9, h: 0.035, fill: { color: MINT } });
  s.addText("Abdulla Almulla", {
    x: M, y: 6.15, w: 6, h: 0.32, fontSize: 15, bold: true, fontFace: BODY,
    color: WHITE, isTextBox: true, margin: 0, valign: "middle",
  });
  s.addText("Emirates Aviation University", {
    x: M, y: 6.5, w: 6, h: 0.3, fontSize: 12.5, fontFace: BODY,
    color: MUTED, isTextBox: true, margin: 0, valign: "middle",
  });

  s.addNotes("Frame it in one line: I built a model, it finds 75% of positive cases, and the test set cannot tell me whether that is acceptable in a clinic. This presentation is about the instrument I designed to answer that question properly.");
}

// =====================================================================
// 2 — Background: where the question comes from
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Background", { y: 0.62 });
  title(s, "The test set answers the wrong question", { y: 0.95 });

  const bx = M, bw = 6.9;
  s.addText([
    { text: "The modelling study compared three Keras architectures — a baseline MLP, a deeper MLP with dropout, and an autoencoder-enhanced classifier — on the UCI Cervical Cancer Risk Factors dataset.", options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: "At a 0.50 threshold the selected model reaches 75% recall — six of the eight positive cases in the test set.", options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: "Accuracy, F1 and AUC-ROC describe how the model behaves. None of them say whether a clinician would act on it.", options: {} },
  ], {
    x: bx, y: 2.1, w: bw, h: 2.75, fontSize: 14, fontFace: BODY, color: INK,
    lineSpacing: 22, isTextBox: true, margin: 0, valign: "top",
  });

  s.addText("Whether 75% recall is good enough is a question about clinical judgement, not about the test set. It has to be asked of people.", {
    x: bx, y: 5.0, w: bw, h: 1.0, fontSize: 15, italic: true, bold: true,
    fontFace: HEAD, color: TEAL, lineSpacing: 24, isTextBox: true, margin: 0, valign: "top",
  });

  // stat card
  const cx = 8.35, cw = W - cx - M;
  card(s, cx, 2.1, cw, 3.8, DARK);
  s.addText("75%", {
    x: cx, y: 2.45, w: cw, h: 1.35, fontSize: 68, bold: true, fontFace: HEAD,
    color: MINT, align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
  s.addText("recall at a 0.50 threshold", {
    x: cx, y: 3.75, w: cw, h: 0.35, fontSize: 13, fontFace: BODY,
    color: "C9DDE1", align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
  s.addShape(pres.ShapeType.rect, { x: cx + 1.0, y: 4.3, w: cw - 2.0, h: 0.02, fill: { color: TEAL } });
  s.addText("6 of 8", {
    x: cx, y: 4.5, w: cw, h: 0.6, fontSize: 30, bold: true, fontFace: HEAD,
    color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
  s.addText("positive cases found\n2 missed", {
    x: cx, y: 5.1, w: cw, h: 0.65, fontSize: 12.5, fontFace: BODY,
    color: MUTED, align: "center", valign: "top", lineSpacing: 17, isTextBox: true, margin: 0,
  });

  s.addNotes("Two missed cases out of eight. Statistically that is a respectable number. Clinically it is two women who were told they were fine. That gap is the whole motivation.");
}

// =====================================================================
// 3 — Aim and research questions
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Aim", { y: 0.62 });
  title(s, "What this study sets out to establish", { y: 0.95 });

  s.addText("To measure how healthcare and health-data professionals judge automated risk prediction in cervical screening — and what it would take for them to trust it.", {
    x: M, y: 2.05, w: 10.4, h: 0.85, fontSize: 17, fontFace: HEAD, bold: true,
    color: INK, lineSpacing: 27, isTextBox: true, margin: 0, valign: "top",
  });

  const qs = [
    ["RQ1", "How much exposure do these professionals already have to automated risk scoring in their day-to-day work?"],
    ["RQ2", "How do they weigh a missed positive case against an unnecessary referral?"],
    ["RQ3", "What evidence or properties would a model need before they would act on its output?"],
  ];
  let y = 3.42;
  qs.forEach(([tag, text]) => {
    card(s, M, y, CW, 1.05, PAPER);
    badge(s, M + 0.32, y + 0.24, 0.58, "", TEAL);
    s.addText(tag, {
      x: M + 0.32, y: y + 0.24, w: 0.58, h: 0.58, fontSize: 12, bold: true,
      fontFace: HEAD, color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0,
    });
    s.addText(text, {
      x: M + 1.15, y: y + 0.16, w: CW - 1.6, h: 0.75, fontSize: 14.5, fontFace: BODY,
      color: INK, lineSpacing: 21, isTextBox: true, margin: 0, valign: "middle",
    });
    y += 1.25;
  });

  s.addNotes("Three questions, and they map one to one onto the three objectives on the next slide. RQ2 is the one the modelling study genuinely cannot answer.");
}

// =====================================================================
// 4 — Objectives
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Objectives", { y: 0.62 });
  title(s, "Three objectives, each with its own items", { y: 0.95 });

  const objs = [
    ["1", "Current exposure", "Establish current exposure to, and use of, automated risk-prediction tools among healthcare and health-data professionals.", "Q4  Q5  Q12", TEAL],
    ["2", "Trust and error tolerance", "Measure perceived trust in model-generated risk predictions, and the relative tolerance for false negatives versus false positives.", "Q6  Q7  Q8", SEA],
    ["3", "Adoption factors", "Identify the factors that would influence adoption of such a tool within a cervical screening pathway.", "Q9  Q10  Q11", MINT],
  ];
  const gap = 0.35;
  const cw = (CW - gap * 2) / 3;
  objs.forEach(([n, head, text, items, col], i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.0, cw, 4.15, PAPER);
    badge(s, x + 0.4, 2.42, 0.78, n, col);
    s.addText(head, {
      x: x + 0.4, y: 3.42, w: cw - 0.8, h: 0.75, fontSize: 18, bold: true,
      fontFace: HEAD, color: INK, lineSpacing: 23, isTextBox: true, margin: 0, valign: "top",
    });
    s.addText(text, {
      x: x + 0.4, y: 4.2, w: cw - 0.8, h: 1.25, fontSize: 13, fontFace: BODY,
      color: GREY, lineSpacing: 19, isTextBox: true, margin: 0, valign: "top",
    });
    s.addText(items, {
      x: x + 0.4, y: 5.55, w: cw - 0.8, h: 0.35, fontSize: 12.5, bold: true,
      fontFace: BODY, charSpacing: 0.8, color: col, isTextBox: true, margin: 0, valign: "middle",
    });
  });

  footnote(s, "Every item maps to exactly one objective, and the mapping is published in items.csv rather than left implicit.");
  s.addNotes("The point to stress: the mapping is a published artefact, not something I reconstructed afterwards. Anyone can check that each objective is actually covered.");
}

// =====================================================================
// 5 — Research design
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Methodology", { y: 0.62 });
  title(s, "Research design", { y: 0.95 });

  const cells = [
    ["Design", "Cross-sectional survey. A single administration capturing attitudes at one point in time, with no intervention and no follow-up."],
    ["Approach", "Predominantly quantitative — closed items producing ordinal and categorical data — with two open-ended items for qualitative context."],
    ["Strategy", "Self-administered online questionnaire, chosen for reach across professional groups and for anonymity on a sensitive judgement."],
    ["Unit of analysis", "The individual professional. Responses are compared across role, experience and organisation type."],
  ];
  const gx = 0.35, gy = 0.35;
  const cw = (CW - gx) / 2, ch = 1.95;
  cells.forEach(([h, t], i) => {
    const x = M + (i % 2) * (cw + gx);
    const y = 2.05 + Math.floor(i / 2) * (ch + gy);
    card(s, x, y, cw, ch, PAPER);
    s.addText(h, {
      x: x + 0.42, y: y + 0.3, w: cw - 0.84, h: 0.34, fontSize: 15.5, bold: true,
      fontFace: HEAD, color: TEAL, isTextBox: true, margin: 0, valign: "middle",
    });
    s.addText(t, {
      x: x + 0.42, y: y + 0.72, w: cw - 0.84, h: 1.05, fontSize: 13.5, fontFace: BODY,
      color: INK, lineSpacing: 20, isTextBox: true, margin: 0, valign: "top",
    });
  });

  s.addNotes("Cross-sectional is the honest label — I am not tracking change over time, and I should not claim to.");
}

// =====================================================================
// 6 — Population and sampling
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Participants", { y: 0.62 });
  title(s, "Population and sampling", { y: 0.95 });

  s.addText("Target population", {
    x: M, y: 2.0, w: 6.4, h: 0.34, fontSize: 15.5, bold: true, fontFace: HEAD,
    color: TEAL, isTextBox: true, margin: 0, valign: "middle",
  });
  s.addText([
    { text: "Professionals who would encounter a risk-prediction output in a screening pathway, either as clinicians acting on it or as analysts producing it.", options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: "Q1 captures six role categories, so responses can be split by professional group rather than pooled into a single average.", options: {} },
  ], {
    x: M, y: 2.45, w: 6.4, h: 1.7, fontSize: 14, fontFace: BODY, color: INK,
    lineSpacing: 21, isTextBox: true, margin: 0, valign: "top",
  });

  s.addText("Sampling", {
    x: M, y: 4.35, w: 6.4, h: 0.34, fontSize: 15.5, bold: true, fontFace: HEAD,
    color: TEAL, isTextBox: true, margin: 0, valign: "middle",
  });
  s.addText("Non-probability purposive sampling, with the inclusion criterion being current work in healthcare or health-related data. Practical for a specialist population, and a stated limitation rather than a hidden one.", {
    x: M, y: 4.8, w: 6.4, h: 1.4, fontSize: 14, fontFace: BODY, color: INK,
    lineSpacing: 21, isTextBox: true, margin: 0, valign: "top",
  });

  // right: the six role categories as chips
  const rx = 7.75, rw = W - rx - M;
  card(s, rx, 2.0, rw, 4.2, PAPER);
  s.addText("Q1 — Primary professional role", {
    x: rx + 0.42, y: 2.3, w: rw - 0.84, h: 0.34, fontSize: 13.5, bold: true,
    fontFace: BODY, color: GREY, isTextBox: true, margin: 0, valign: "middle",
  });
  const roles = ["Clinician", "Nurse or midwife", "Medical laboratory scientist",
                 "Health data scientist or analyst", "Researcher or academic", "Other"];
  let ry = 2.8;
  roles.forEach((r) => {
    s.addShape(pres.ShapeType.ellipse, { x: rx + 0.45, y: ry + 0.165, w: 0.15, h: 0.15, fill: { color: SEA } });
    s.addText(r, {
      x: rx + 0.78, y: ry, w: rw - 1.2, h: 0.48, fontSize: 13.5, fontFace: BODY,
      color: INK, isTextBox: true, margin: 0, valign: "middle",
    });
    ry += 0.545;
  });

  s.addNotes("Be upfront that purposive sampling limits generalisability. The defence is that the population is specialist and small, and that the objective is depth of judgement, not population prevalence.");
}

// =====================================================================
// 7 — Instrument structure
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Instrument", { y: 0.62 });
  title(s, "Twelve items in four sections", { y: 0.95 });

  const secs = [
    ["S1", "Respondent background", "Q1 – Q3", "Role, years of experience, organisation type. Placed first so later answers can be compared across groups.", TEAL],
    ["S2", "Current exposure", "Q4 – Q5", "Frequency of use of automated risk scoring, and which specific tool types have been used in practice.", SEA],
    ["S3", "Trust and error tolerance", "Q6 – Q8", "Confidence in model-supported prioritisation, and the false negative versus false positive trade-off.", MINT],
    ["S4", "Adoption factors", "Q9 – Q12", "What would have to be true before the tool is trusted, plus two open-ended items.", TEAL],
  ];
  let y = 1.95;
  secs.forEach(([tag, head, range, text, col]) => {
    card(s, M, y, CW, 1.07, PAPER);
    badge(s, M + 0.3, y + 0.235, 0.6, tag, col);
    s.addText(head, {
      x: M + 1.1, y: y + 0.17, w: 3.5, h: 0.36, fontSize: 15.5, bold: true,
      fontFace: HEAD, color: INK, isTextBox: true, margin: 0, valign: "middle",
    });
    s.addText(range, {
      x: M + 1.1, y: y + 0.55, w: 3.5, h: 0.3, fontSize: 12, bold: true,
      fontFace: BODY, charSpacing: 1, color: col, isTextBox: true, margin: 0, valign: "middle",
    });
    s.addText(text, {
      x: M + 4.85, y: y + 0.19, w: CW - 5.2, h: 0.72, fontSize: 13.5, fontFace: BODY,
      color: GREY, lineSpacing: 19, isTextBox: true, margin: 0, valign: "middle",
    });
    y += 1.2;
  });

  s.addNotes("Demographics first is a deliberate choice and worth defending: without them I can only report one pooled average, which would hide the disagreement between clinicians and analysts.");
}

// =====================================================================
// 8 — Measurement design decisions (with chart)
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Measurement", { y: 0.62 });
  title(s, "Why the items take the form they do", { y: 0.95 });

  const notes = [
    ["Q7 + Q8", "The same trade-off is asked twice — once as a general attitude, once against a concrete performance figure. The gap between the two answers is itself a finding."],
    ["Q9", "Forced ranking, not a Likert battery. Asked separately, respondents agree with all five desirable properties; ranking is what separates them."],
    ["Q11 + Q12", "Open-ended, to capture concerns the design did not anticipate and to surface real experience of automated decisions."],
  ];
  let y = 2.0;
  notes.forEach(([tag, text]) => {
    s.addText(tag, {
      x: M, y, w: 1.55, h: 0.34, fontSize: 14, bold: true, fontFace: BODY,
      color: TEAL, isTextBox: true, margin: 0, valign: "middle",
    });
    s.addText(text, {
      x: M, y: y + 0.38, w: 6.35, h: 1.1, fontSize: 13.5, fontFace: BODY,
      color: INK, lineSpacing: 20, isTextBox: true, margin: 0, valign: "top",
    });
    y += 1.55;
  });

  const cx = 7.75, cw = W - cx - M;
  card(s, cx, 1.95, cw, 4.25, PAPER);
  s.addText("Item types across the instrument", {
    x: cx + 0.4, y: 2.2, w: cw - 0.8, h: 0.32, fontSize: 13.5, bold: true,
    fontFace: BODY, color: GREY, isTextBox: true, margin: 0, valign: "middle",
  });
  s.addChart(pres.ChartType.bar, [{
    name: "Items",
    labels: ["Multiple choice", "Likert (1–5)", "Open-ended", "Multi-select", "Ranking"],
    values: [5, 3, 2, 1, 1],
  }], {
    x: cx + 0.22, y: 2.6, w: cw - 0.5, h: 3.35,
    barDir: "bar", barGapWidthPct: 45,
    chartColors: [TEAL, SEA, MINT, SEA, TEAL],
    varyColors: true,
    showLegend: false, showTitle: false,
    showValue: true, dataLabelPosition: "outEnd",
    dataLabelColor: INK, dataLabelFontSize: 12, dataLabelFontFace: BODY, dataLabelFontBold: true,
    catAxisLabelColor: INK, catAxisLabelFontSize: 11.5, catAxisLabelFontFace: BODY,
    catAxisLineShow: false, catGridLine: { style: "none" },
    valAxisHidden: true, valAxisLineShow: false,
    valGridLine: { style: "none" },
    valAxisMaxVal: 6,
  });

  s.addNotes("If asked why so few open-ended items: every free-text box costs response rate. Two is what I can justify, and both sit at the end so an abandonment there still leaves the closed items usable.");
}

// =====================================================================
// 9 — The core trade-off (dark)
// =====================================================================
{
  const s = darkSlide();
  s.addShape(pres.ShapeType.ellipse, {
    x: 10.9, y: 5.75, w: 3.4, h: 3.4, fill: { color: TEAL, transparency: 78 },
  });

  kicker(s, "The central question", { y: 0.62, color: MINT });
  title(s, "A missed case and an unnecessary referral are not\nthe same kind of error", { y: 1.0, color: WHITE, fontSize: 29 });

  s.addText("Q7 asks whether a missed positive case is the more serious error as a matter of principle. Q8 puts a number on it and asks the same professional to judge 75% recall as a triage tool. Both answers are needed, because the principle and the number often disagree.", {
    x: M, y: 2.5, w: 6.5, h: 1.8, fontSize: 15, fontFace: BODY, color: "C9DDE1",
    lineSpacing: 24, isTextBox: true, margin: 0, valign: "top",
  });

  const opts = [
    "Not acceptable under any conditions",
    "Acceptable only alongside standard screening",
    "Acceptable as a standalone triage step",
    "Unsure",
  ];
  const ox = 7.6, ow = W - ox - M;
  s.addText("Q8 — response options", {
    x: ox, y: 2.5, w: ow, h: 0.32, fontSize: 12, bold: true, fontFace: BODY,
    charSpacing: 1.2, color: MINT, isTextBox: true, margin: 0, valign: "middle",
  });
  let oy = 2.98;
  opts.forEach((o) => {
    s.addShape(pres.ShapeType.roundRect, {
      x: ox, y: oy, w: ow, h: 0.62, rectRadius: 0.06,
      fill: { color: WHITE, transparency: 90 },
    });
    s.addText(o, {
      x: ox + 0.3, y: oy, w: ow - 0.6, h: 0.62, fontSize: 13, fontFace: BODY,
      color: WHITE, isTextBox: true, margin: 0, valign: "middle",
    });
    oy += 0.75;
  });

  s.addText("A respondent who strongly agrees on Q7 but accepts 75% as a standalone step on Q8 is telling us something the Likert scale alone would have hidden.", {
    x: M, y: 4.85, w: 6.5, h: 0.95, fontSize: 14, italic: true, bold: true,
    fontFace: HEAD, color: MINT, lineSpacing: 22, isTextBox: true, margin: 0, valign: "top",
  });

  s.addNotes("This is the slide to slow down on. The double-ask is the single most defensible design decision in the instrument, and it is the one an examiner is most likely to probe.");
}

// =====================================================================
// 10 — Data collection
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Procedure", { y: 0.62 });
  title(s, "Data collection", { y: 0.95 });

  const steps = [
    ["1", "Consent", "Participant information and the consent statement are shown before the first item. Progression past that screen constitutes consent."],
    ["2", "Administration", "Self-administered online via SurveyMonkey. No interviewer present, so no social-desirability pressure from a researcher in the room."],
    ["3", "Capture", "Closed items export as coded categorical and ordinal data; the two free-text items are exported separately for thematic coding."],
  ];
  const gap = 0.35, cw = (CW - gap * 2) / 3;
  steps.forEach(([n, head, text], i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.05, cw, 3.5, PAPER);
    badge(s, x + 0.4, 2.45, 0.7, n, [TEAL, SEA, MINT][i]);
    s.addText(head, {
      x: x + 0.4, y: 3.35, w: cw - 0.8, h: 0.4, fontSize: 17, bold: true,
      fontFace: HEAD, color: INK, isTextBox: true, margin: 0, valign: "top",
    });
    s.addText(text, {
      x: x + 0.4, y: 3.85, w: cw - 0.8, h: 1.4, fontSize: 13, fontFace: BODY,
      color: GREY, lineSpacing: 19, isTextBox: true, margin: 0, valign: "top",
    });
  });

  s.addText("Implemented instrument:  surveymonkey.com/r/CY6GZLB", {
    x: M, y: 5.85, w: CW, h: 0.4, fontSize: 13, bold: true, fontFace: BODY,
    color: TEAL, isTextBox: true, margin: 0, valign: "middle",
  });
  footnote(s, "No responses have been collected. The instrument is published as a design artefact and as the basis for a planned follow-up study.");

  s.addNotes("Say plainly that no data has been collected yet. The deliverable here is the instrument and its justification, not results.");
}

// =====================================================================
// 11 — Ethics
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Ethics", { y: 0.62 });
  title(s, "Ethical considerations", { y: 0.95 });

  const items = [
    ["Voluntary participation", "No incentive and no obligation. Participants may stop at any point."],
    ["Anonymity", "No personally identifiable information is collected at any stage of the instrument."],
    ["Right of withdrawal", "Responses may be withdrawn at any point before submission."],
    ["Informed consent", "The full participant information and consent text is published in consent.md, so what respondents were told is auditable."],
    ["Secondary data", "The modelling study it accompanies used a publicly available secondary dataset, with no patient contact."],
  ];
  let y = 1.95;
  items.forEach(([h, t], i) => {
    const col = [TEAL, SEA, MINT, TEAL, SEA][i];
    s.addShape(pres.ShapeType.ellipse, { x: M + 0.02, y: y + 0.16, w: 0.36, h: 0.36, fill: { color: col } });
    s.addText(h, {
      x: M + 0.62, y: y + 0.02, w: 3.7, h: 0.4, fontSize: 15, bold: true,
      fontFace: HEAD, color: INK, isTextBox: true, margin: 0, valign: "middle",
    });
    s.addText(t, {
      x: M + 4.45, y: y, w: CW - 4.45, h: 0.68, fontSize: 13.5, fontFace: BODY,
      color: GREY, lineSpacing: 19, isTextBox: true, margin: 0, valign: "middle",
    });
    y += 0.92;
  });

  s.addNotes("The auditable point matters: publishing the consent text means a reader can check what respondents actually agreed to, rather than taking my word for it.");
}

// =====================================================================
// 12 — Analysis plan
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Analysis", { y: 0.62 });
  title(s, "How each objective would be analysed", { y: 0.95 });

  const rows = [
    ["1", "Frequencies and cross-tabulation of Q4 and Q5 by professional role, to describe existing exposure rather than to test a hypothesis.", TEAL],
    ["2", "Medians and distributions for the Likert items Q6 and Q7; Q8 compared against Q7 within respondent to measure how far the stated principle survives a concrete number.", SEA],
    ["3", "Mean rank position for each of the five factors in Q9, with Q10 read alongside it; Q11 and Q12 coded thematically and used to interpret the ranking.", MINT],
  ];
  let y = 2.0;
  rows.forEach(([n, text, col]) => {
    card(s, M, y, CW, 1.25, PAPER);
    badge(s, M + 0.34, y + 0.3, 0.65, n, col);
    s.addText(text, {
      x: M + 1.25, y: y + 0.18, w: CW - 1.7, h: 0.9, fontSize: 14, fontFace: BODY,
      color: INK, lineSpacing: 21, isTextBox: true, margin: 0, valign: "middle",
    });
    y += 1.45;
  });

  s.addText("Comparisons across professional groups are descriptive — purposive sampling does not support inferential claims.", {
    x: M, y: 6.5, w: CW, h: 0.4, fontSize: 12.5, italic: true, fontFace: BODY,
    color: TEAL, isTextBox: true, margin: 0, valign: "middle",
  });

  s.addNotes("Keep the claims proportionate to the design. Descriptive, not inferential — saying this before an examiner does is worth a mark.");
}

// =====================================================================
// 13 — Limitations
// =====================================================================
{
  const s = lightSlide();
  kicker(s, "Limitations", { y: 0.62 });
  title(s, "What this design cannot do", { y: 0.95 });

  const lims = [
    ["Self-report", "Stated attitudes to a hypothetical tool are not the same as behaviour when a real prediction appears in a real pathway."],
    ["Purposive sampling", "The sample will not be representative, so findings describe the respondents rather than the profession."],
    ["Single time point", "A cross-sectional design captures attitudes as they are now, and cannot show how exposure changes them."],
    ["One performance figure", "Q8 anchors on 75% recall. A different figure would likely shift the acceptability judgement, which this design does not vary."],
  ];
  const gx = 0.35, gy = 0.35, cw = (CW - gx) / 2, ch = 1.95;
  lims.forEach(([h, t], i) => {
    const x = M + (i % 2) * (cw + gx);
    const y = 2.05 + Math.floor(i / 2) * (ch + gy);
    card(s, x, y, cw, ch, PAPER);
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.42, y: y + 0.32, w: 0.3, h: 0.3, fill: { color: [TEAL, SEA, MINT, TEAL][i] } });
    s.addText(h, {
      x: x + 0.86, y: y + 0.22, w: cw - 1.3, h: 0.5, fontSize: 15.5, bold: true,
      fontFace: HEAD, color: INK, isTextBox: true, margin: 0, valign: "middle",
    });
    s.addText(t, {
      x: x + 0.42, y: y + 0.85, w: cw - 0.84, h: 0.95, fontSize: 13.5, fontFace: BODY,
      color: GREY, lineSpacing: 20, isTextBox: true, margin: 0, valign: "top",
    });
  });

  s.addNotes("Naming the fourth limitation myself is the strongest move here — anchoring on a single figure is the most obvious attack on the instrument, so I should raise it first.");
}

// =====================================================================
// 14 — Closing (dark)
// =====================================================================
{
  const s = darkSlide();
  [3.9, 2.7, 1.6].forEach((d, i) => {
    s.addShape(pres.ShapeType.ellipse, {
      x: W - d / 2 - 1.1, y: 4.6 - d / 2, w: d, h: d,
      fill: { color: i === 2 ? MINT : TEAL, transparency: i === 2 ? 25 : 80 },
    });
  });

  kicker(s, "In summary", { y: 0.75, color: MINT });
  title(s, "The instrument is the contribution", { y: 1.15, color: WHITE, fontSize: 36 });

  const pts = [
    "A model that finds 75% of positive cases cannot be judged acceptable or unacceptable from its own test set.",
    "Twelve items, three objectives, and a published mapping between them — so coverage can be checked, not asserted.",
    "The false-negative trade-off is asked twice, in principle and against a number, because the two answers diverge.",
    "Published with its consent text and objective mapping as a reusable design artefact.",
  ];
  let y = 2.5;
  pts.forEach((p, i) => {
    s.addShape(pres.ShapeType.ellipse, { x: M + 0.02, y: y + 0.13, w: 0.17, h: 0.17, fill: { color: MINT } });
    s.addText(p, {
      x: M + 0.5, y, w: 7.9, h: 0.9, fontSize: 14.5, fontFace: BODY, color: "C9DDE1",
      lineSpacing: 22, isTextBox: true, margin: 0, valign: "top",
    });
    y += 0.95;
  });

  s.addText("Questions", {
    x: M, y: 6.35, w: 5, h: 0.5, fontSize: 24, bold: true, fontFace: HEAD,
    color: WHITE, isTextBox: true, margin: 0, valign: "middle",
  });

  s.addNotes("Close on the contribution: the instrument, its justification, and the fact that it is published in a form someone else could pick up and run.");
}

const out = "/tmp/claude-0/-home-user-engabdullaalmulla-dev/a3c4fa55-6585-5ba2-9d43-cac84fd4fa24/scratchpad/deck/research-methods-cervical-screening-survey.pptx";
pres.writeFile({ fileName: out }).then(() => console.log("wrote", out));
