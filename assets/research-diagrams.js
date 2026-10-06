const C = {
  ink: "#263238",
  muted: "#59686e",
  line: "#bac9cf",
  white: "#fff",
  blue: "#526b98",
  blueSoft: "#e1e8f3",
  orange: "#ad5736",
  orangeSoft: "#fae8dd",
  green: "#327762",
  greenSoft: "#e3f0e9",
  red: "#af4c4c",
  redSoft: "#f8e2e1",
};
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const text = (x, y, words, size = 18, color = "ink", anchor = "middle") =>
  `<text class="diagram-text ${color}" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}">${(Array.isArray(words) ? words : [words]).map((word, i) => `<tspan x="${x}" dy="${i ? size * 1.35 : 0}">${esc(word)}</tspan>`).join("")}</text>`;
const rect = (x, y, w, h, fill = "white", stroke = "line", radius = 10) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${C[fill]}" stroke="${C[stroke]}" stroke-width="1.5"/>`;
const path = (d, color = "line", width = 2, extra = "") =>
  `<path d="${d}" fill="none" stroke="${C[color]}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const circle = (x, y, r, color = "blue", solid = false) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${C[solid ? color : "white"]}" stroke="${C[color]}" stroke-width="2"/>`;
const tip = (body, words) =>
  `<g class="diagram-tip" tabindex="0" data-tooltip="${esc(words)}" aria-label="${esc(words)}">${body}</g>`;
const group = (x, y, body, extra = "") =>
  `<g transform="translate(${x} ${y})" ${extra}>${body}</g>`;
const arrow = (id, d, color = "muted", extra = "") =>
  path(d, color, 1.8, `marker-end="url(#${id}-${color}-arrow)" ${extra}`);
function frame(id, width, height, title, body) {
  const markers = ["muted", "orange", "blue", "green", "red"]
    .map(
      (color) =>
        `<marker id="${id}-${color}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${C[color]}"/></marker>`,
    )
    .join("");
  return `<svg class="research-scene" viewBox="0 0 ${width} ${height}" role="group" aria-labelledby="${id}-title"><title id="${id}-title">${esc(title)}</title><defs>${markers}</defs>${body}</svg>`;
}
const cross = (x, y, color = "red") =>
  path(`M${x - 5} ${y - 5}l10 10m-10 0l10-10`, color, 2.4);
const tick = (x, y) => path(`M${x - 6} ${y}l4 5 9-11`, "green", 2.4);
function brain(x, y, label = "LLM", color = "blue") {
  let b = "";
  for (const a of [-15, 0, 15])
    for (const c of [-12, 12])
      b += path(
        `M${x - 20} ${y + a}L${x} ${y + c}L${x + 20} ${y + a}`,
        color,
        1,
      );
  for (const dx of [-20, 20])
    for (const dy of [-15, 0, 15]) b += circle(x + dx, y + dy, 4, color);
  for (const dy of [-12, 12]) b += circle(x, y + dy, 4, color, true);
  return b + text(x, y + 45, label, 16, color);
}
function documentIcon(x, y, color = "blue", label = "") {
  return (
    rect(x, y, 35, 44, `${color}Soft`, color, 3) +
    [12, 21, 30]
      .map((dy) => path(`M${x + 8} ${y + dy}h19`, color, 1.5))
      .join("") +
    (label ? text(x + 17, y + 65, label, 15, color) : "")
  );
}
function traveler(d, color = "blue", delay = 0) {
  return `<circle class="research-traveler" r="4" fill="${C[color]}" style="offset-path:path('${d}');--travel-delay:${delay}s"/>`;
}
function router(x, y, label, color = "blue") {
  return (
    rect(x - 19, y - 15, 38, 30, `${color}Soft`, color, 6) +
    path(`M${x - 11} ${y}h22m-6-5 6 5-6 5m-10-10-6 5 6 5`, color, 1.5) +
    text(x, y + 35, label, 16, color)
  );
}
function network(x, y, width, failed = false, animate = false) {
  const mid = width / 2;
  let b =
    path(`M20 0H${mid - 20}`, "blue", 3) +
    path(
      `M${mid + 20} 0H${width - 20}`,
      failed ? "red" : "blue",
      3,
      failed ? 'stroke-dasharray="7 6"' : "",
    );
  if (failed) b += cross(mid + (width - mid) / 2, 0);
  if (animate)
    b += traveler(
      `M20 0L${failed ? mid + 32 : width - 20} 0`,
      failed ? "red" : "blue",
    );
  b +=
    router(0, 0, "A") +
    router(mid, 0, "B") +
    router(width, 0, "C", failed ? "red" : "blue");
  return group(x, y, b);
}
const equation = (x, y, width, formula, color = "blue") =>
  rect(x, y, width, 44, `${color}Soft`, color, 6) +
  text(x + width / 2, y + 28, formula, 19, color);

function autogramSpace(step, compact) {
  const id = "autogram-space",
    w = compact ? 520 : 760;
  const sw = compact ? 480 : 458,
    sx = 20,
    sy = 58;
  const expanded = step >= 2,
    checked = step === 1 || step === 3;
  const boundary = (wide) =>
    wide
      ? `M70 78C144 25 329 30 397 116C449 188 374 268 267 273C152 301 38 237 44 165C46 126 45 101 70 78Z`
      : `M70 103C111 69 203 75 230 131C259 188 221 234 161 242C101 250 55 216 51 167C49 138 48 122 70 103Z`;
  let b = text(
    w / 2,
    29,
    "Relations the solver can decide",
    compact ? 21 : 22,
    "muted",
  );
  let space = rect(0, 0, sw, 320, "white", "line", 18);
  if (expanded)
    space += path(
      boundary(false),
      "orange",
      1.5,
      'stroke-dasharray="5 6" opacity=".55"',
    );
  space += `<path data-morph="autogram-boundary" d="${boundary(expanded)}" fill="${C.orangeSoft}" fill-opacity=".8" stroke="${C.orange}" stroke-width="2.5"/>`;
  space += text(
    expanded ? 200 : 135,
    expanded ? 94 : 120,
    expanded ? "Expanded grammar Γ" : "Grammar Γ",
    19,
    "orange",
  );
  const points = [
    [100, 145, true],
    [152, 137, false],
    [203, 158, false],
    [90, 195, false],
    [151, 210, true],
    [207, 202, true],
    [280, 130, true],
    [331, 210, false],
    [390, 85, false],
    [370, 280, true],
    [29, 65, false],
    [255, 25, false],
  ];
  points.forEach(([x, y, holds], i) => {
    const inside = i < 6 || (expanded && i < 8);
    const tested = checked && inside;
    const color = tested
      ? holds
        ? "green"
        : "red"
      : inside
        ? "orange"
        : "line";
    const mark =
      tested && !holds ? cross(x, y) : circle(x, y, 6, color, tested && holds);
    space += tip(
      mark,
      tested
        ? holds
          ? "A candidate accepted by logical and statistical checks."
          : "A candidate rejected by logical or statistical checks."
        : inside
          ? "An expressible candidate awaiting evaluation."
          : "Outside the current grammar: the search cannot reach this relation.",
    );
  });
  space += tip(
    `<path class="${step === 2 ? "diagram-pulse" : ""}" d="M321 143l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1Z" fill="${C[step === 3 ? "green" : "blue"]}"/>` +
      text(
        320,
        194,
        step === 3 ? "Recovered ✓" : "Known invariant",
        16,
        step === 3 ? "green" : "blue",
      ),
    "A trusted conservation invariant needs a sum over all links leaving a router. Pairwise comparisons cannot express that sum.",
  );
  if (step === 0 || step === 2)
    space += `<clipPath id="${id}-scan-clip"><path d="${boundary(expanded)}"/></clipPath><g clip-path="url(#${id}-scan-clip)"><path class="research-scan" d="M${expanded ? 60 : 62} 126V211" stroke="${C.blue}" stroke-width="2" opacity=".8" style="--scan-width:${expanded ? 320 : 155}px"/></g>`;
  b += group(sx, sy, space);
  const px = compact ? 20 : 502,
    py = compact ? 406 : 58,
    pw = compact ? 480 : 238;
  let card = rect(0, 0, pw, compact ? 195 : 320, "white", "line");
  card += text(
    pw / 2,
    31,
    expanded ? "Add a sum over links" : "Start with comparisons",
    18,
    "orange",
  );
  card += text(
    pw / 2,
    66,
    expanded ? "t ::= x | Σ egress(X→Y)" : "t ::= x",
    compact ? 22 : 17,
    "ink",
  );
  card += text(pw / 2, 94, "r ::= t ≈ t | t ≤ t", compact ? 21 : 19, "ink");
  if (compact) {
    card += text(
      pw / 2,
      133,
      "out(X) ≈ Σ egress(X→Y)",
      23,
      step === 3 ? "green" : "blue",
    );
    card += text(
      pw / 2,
      170,
      step === 3
        ? "Evidence supports the relation ✓"
        : expanded
          ? "The relation is now expressible"
          : "Needs an aggregation outside Γ",
      17,
      step === 3 ? "green" : "muted",
    );
  } else {
    card += path("M20 118H218");
    card += text(pw / 2, 148, "Flow conservation", 18, "blue");
    card += router(70, 209, "X");
    card += path(
      "M90 205L175 180M90 216L175 246",
      step === 3 ? "green" : "blue",
      2.5,
    );
    card += circle(181, 177, 7, "blue") + circle(181, 249, 7, "blue");
    card += text(143, 171, "Y", 15, "blue") + text(143, 270, "Z", 15, "blue");
    card += text(
      pw / 2,
      303,
      "out(X) ≈ e(X,Y) + e(X,Z)",
      16,
      step === 3 ? "green" : "muted",
    );
  }
  b += group(
    px,
    py,
    tip(
      card,
      "Abbreviated, bounded grammar. All terms have compatible units. Re-induction adds aggregation while staying within the solver's decidable language.",
    ),
  );
  const ly = compact ? 633 : 411;
  b +=
    circle(30, ly - 6, 5, "orange") +
    text(43, ly, "Candidate", 15, "muted", "start") +
    circle(compact ? 183 : 237, ly - 6, 5, "green", true) +
    text(compact ? 196 : 250, ly, "Accepted", 15, "muted", "start") +
    text(compact ? 348 : 485, ly, "★ Known", 15, "blue", "start");
  return frame(id, w, compact ? 654 : 435, researchSteps[id][step].text, b);
}

function autogramLoop(step, compact) {
  const id = "autogram-loop",
    w = compact ? 520 : 760;
  let b = "";
  const top = compact ? 30 : 25;
  const xLLM = compact ? 260 : 280,
    xGrammar = compact ? 415 : 550;
  b += group(
    0,
    top,
    documentIcon(36, 12, "blue") +
      text(
        103,
        30,
        ["Counter names", "& metadata"],
        compact ? 15 : 17,
        "blue",
        "start",
      ) +
      arrow(id, `M${compact ? 205 : 222} 35H${xLLM - 32}`, "blue") +
      brain(xLLM, 35) +
      arrow(id, `M${xLLM + 36} 35H${xGrammar - 51}`, "blue") +
      equation(xGrammar - 45, 12, 90, "Γ", "orange"),
  );
  if (step === 0 || step === 3)
    b += traveler(
      `M${xLLM + 36} ${top + 35}L${xGrammar - 52} ${top + 35}`,
      "orange",
    );
  b += arrow(
    id,
    `M${xGrammar} ${top + 60}V118H${compact ? 92 : 134}V180`,
    "orange",
  );
  b += path(`M20 137H${w - 20}`, "line", 1.5, 'stroke-dasharray="4 5"');
  b += text(w / 2, 162, "Deterministic search and evaluation", 18, "muted");
  const rowY = 202,
    x1 = compact ? 20 : 32,
    x2 = compact ? 180 : 268,
    x3 = compact ? 342 : 510;
  const cw = compact ? 145 : 205;
  b += group(
    x1,
    rowY,
    text(cw / 2, 0, "Candidates", 18, "orange") +
      ["x = x", "x < x", "out ≈ Σ egress"]
        .map(
          (formula, i) =>
            equation(
              0,
              20 + i * 57,
              cw,
              formula,
              i === 2 ? "orange" : step >= 1 ? "red" : "blue",
            ) + (step >= 1 && i < 2 ? cross(cw - 13, 42 + i * 57) : ""),
        )
        .join(""),
  );
  b += arrow(id, `M${x1 + cw + 5} ${rowY + 109}H${x2 - 8}`, "orange");
  b += group(
    x2,
    rowY,
    text(cw / 2, 0, "Solver", 18, "blue") +
      `<path d="M12 26H${cw - 12}L${cw / 2 + 18} 117V161H${cw / 2 - 18}V117Z" fill="${C.blueSoft}" stroke="${C.blue}" stroke-width="2"/>` +
      text(cw / 2, 72, "⊢", 40, "blue") +
      (step >= 1 ? tick(cw / 2, 137) : text(cw / 2, 144, "?", 22, "blue")),
  );
  b += arrow(id, `M${x2 + cw + 5} ${rowY + 109}H${x3 - 8}`, "blue");
  let chart =
    text(cw / 2, 0, "Statistical test", 18, "green") +
    rect(0, 20, cw, 155, "white", "line");
  chart +=
    rect(13, 67, cw - 26, 48, "greenSoft", "green", 0) +
    path(`M13 91H${cw - 13}`, "green", 1, 'stroke-dasharray="3 4"');
  const residuals = [0, -6, 8, -2, 3, 37, -7, 4, 0, 6, -4];
  residuals.forEach((v, i) => {
    const color = step >= 2 ? (Math.abs(v) > 24 ? "red" : "green") : "line";
    chart += circle(20 + (i * (cw - 40)) / 10, 91 - v, 3.5, color, true);
  });
  chart += text(cw / 2, 158, "Residuals", 15, "muted");
  if (step >= 1)
    b += traveler(
      `M${x1 + cw} ${rowY + 153}L${x2 + cw / 2} ${rowY + 153}L${x2 + cw / 2} ${rowY + 110}L${x3 - 7} ${rowY + 110}`,
      "orange",
    );
  b += group(
    x3,
    rowY,
    tip(
      chart,
      "Each candidate gets a tolerance from its residuals, capped by a global ceiling. Acceptance also requires a conservative hold-rate confidence bound on held-out data. The dots are illustrative.",
    ),
  );
  const inputY = 422;
  b += group(
    30,
    inputY,
    documentIcon(0, 0, "blue") +
      text(48, 18, ["Network", "telemetry"], 16, "blue", "start"),
  );
  b += arrow(id, `M169 ${inputY + 22}H${x3 + cw / 2}V${rowY + 181}`, "blue");
  b += group(
    compact ? 24 : 260,
    inputY + 70,
    tip(
      rect(0, 0, compact ? 245 : 250, 50, "orangeSoft", "orange") +
        text(
          compact ? 122 : 125,
          31,
          "Synthetic calibration data",
          16,
          "orange",
        ),
      "Planted relations and null datasets set generic acceptance thresholds. Known target invariants do not tune those thresholds.",
    ),
  );
  b += arrow(
    id,
    `M${compact ? 274 : 515} ${inputY + 95}H${x3 + cw / 2 + 25}V${rowY + 182}`,
    "orange",
  );
  const outY = 575;
  b += equation(
    30,
    outY,
    w - 60,
    step >= 2 ? "out(X) ≈ Σ egress(X→Y)" : "Candidates await evaluation",
    step >= 2 ? "green" : "blue",
  );
  if (step >= 2) b += tick(w - 50, outY + 23);
  b += text(
    w / 2,
    outY + 73,
    step >= 2
      ? "Accepted with a tolerance and a hold-rate"
      : "A proposed relation still needs evidence",
    17,
    step >= 2 ? "green" : "muted",
  );
  if (step === 3) {
    b += arrow(
      id,
      `M${w - 12} 598V10H${xLLM}V${top + 8}`,
      "orange",
      'stroke-dasharray="6 5" class="research-flow"',
    );
    b += text(
      w / 2,
      692,
      "Missing a known invariant? Refine Γ and search again.",
      compact ? 17 : 19,
      "orange",
    );
  }
  return frame(id, w, compact ? 720 : 720, researchSteps[id][step].text, b);
}

function typonetReasoning(step, compact) {
  const id = "typonet-reasoning",
    w = compact ? 520 : 760;
  const pw = compact ? 480 : 344,
    left = 20,
    right = compact ? 20 : 396,
    rightY = compact ? 347 : 40;
  let b = "";
  let raw =
    rect(0, 0, pw, 277, "white", "line") +
    text(pw / 2, 30, "Reason from raw records", 20, "muted");
  raw += network(45, 219, pw - 90, false, step === 0);
  raw += arrow(id, `M${pw / 2} 192V180`);
  for (let i = 0; i < 5; i++)
    raw += group(
      pw / 2 - 61 + i * 19,
      127 - i * 6,
      documentIcon(0, 0, i === 4 ? "red" : "blue"),
    );
  raw +=
    brain(pw / 2, 66, "", step === 0 ? "red" : "muted") +
    text(55, 66, ["AI", "agent"], 15, "muted");
  raw += text(pw - 40, 70, "?", 36, "red");
  b += group(left, 40, raw, step > 0 ? 'opacity=".42"' : "");
  let formal =
    rect(0, 0, pw, 277, "white", step > 0 ? "orange" : "line") +
    text(pw / 2, 30, "Query a symbolic model", 20, "orange");
  formal += network(45, 219, pw - 90, false, step > 0);
  formal += arrow(id, `M${pw / 2} 192V168`, "blue");
  formal += documentIcon(25, 108, "blue") + brain(88, 124, "Translate");
  formal += arrow(id, "M123 129H143", "blue");
  formal +=
    rect(
      150,
      99,
      pw - 175,
      65,
      step >= 2 ? "greenSoft" : "orangeSoft",
      step >= 2 ? "green" : "orange",
    ) +
    text(
      (150 + pw - 25) / 2,
      127,
      "Logical rules",
      17,
      step >= 2 ? "green" : "orange",
    );
  formal += text(
    (150 + pw - 25) / 2,
    151,
    step >= 2 ? "Checked ✓" : "Proposed",
    15,
    step >= 2 ? "green" : "orange",
  );
  formal += tip(
    path(
      `M${pw - 13} 210V128H${pw - 24}`,
      step >= 2 ? "green" : "line",
      2,
      step === 2 ? 'class="research-flow" stroke-dasharray="5 5"' : "",
    ),
    "Independent dataplane snapshots, known invariants, and operator procedures challenge the proposed rules.",
  );
  formal += arrow(id, `M${pw / 2 + 54} 92V71`, step >= 2 ? "green" : "muted");
  formal +=
    rect(pw / 2 - 28, 45, 165, 29, "blueSoft", "blue", 5) +
    text(pw / 2 + 54, 65, "Solver", 17, "blue");
  b += group(right, rightY, formal, step === 0 ? 'opacity=".35"' : "");
  const qy = compact ? 670 : 365;
  if (step >= 2) {
    b += text(
      w / 2,
      qy,
      "One symbolic model, many questions",
      compact ? 22 : 24,
      "ink",
    );
    const queries = ["Reachability", "Change impact", "Root cause"];
    queries.forEach((label, i) => {
      const gap = compact ? 12 : 22,
        cw = (w - 40 - gap * 2) / 3,
        x = 20 + i * (cw + gap);
      const col = i === 2 ? "orange" : "green";
      let result = text(cw / 2, 83, "?", 22, col);
      if (step === 3) {
        if (i === 0)
          result =
            path(`M23 83H${cw - 23}`, "green", 2.5) +
            [23, cw / 2, cw - 23]
              .map(
                (cx, j) =>
                  circle(cx, 83, 5, "green", true) +
                  text(cx, 109, ["A", "B", "C"][j], 13, "green"),
              )
              .join("") +
            traveler(`M23 83L${cw - 23} 83`, "orange");
        if (i === 1)
          result =
            path(
              `M27 87H${cw / 2}L${cw - 27} 70M${cw / 2} 87L${cw - 27} 105`,
              "orange",
              2.5,
            ) +
            circle(27, 87, 6, "red", true) +
            circle(cw - 27, 70, 6, "orange", true) +
            circle(cw - 27, 105, 6, "orange", true);
        if (i === 2)
          result =
            arrow(id, `M25 72L${cw - 30} 88`, "orange") +
            arrow(id, `M25 105L${cw - 30} 88`, "orange") +
            circle(25, 72, 5, "orange", true) +
            circle(25, 105, 5, "orange", true) +
            cross(cw - 23, 88);
      }
      b += group(
        x,
        qy,
        tip(
          rect(0, 24, cw, 99, `${col}Soft`, col) +
            text(cw / 2, 51, label, compact ? 15 : 18, col) +
            result,
          i === 2
            ? "Observed symptoms lead back to a possible fault. Root-cause analysis requires a fault-to-symptom theory learned through emulation."
            : i === 1
              ? "A change at one device can affect multiple paths and destinations. The solver derives the impact from the symbolic model."
              : "Validated forwarding rules compose into a multi-hop path from A to C.",
        ),
      );
      if (step === 3)
        b += arrow(id, `M${x + cw / 2} ${qy + 4}V${qy + 20}`, col);
    });
  } else
    b += text(
      w / 2,
      qy + 30,
      step === 0
        ? "Repeated questions re-read the same artifacts"
        : "The LLM translates artifacts into explicit rules",
      compact ? 20 : 23,
      step === 0 ? "muted" : "blue",
    );
  return frame(id, w, compact ? 824 : 521, researchSteps[id][step].text, b);
}

function typonetLoops(step, compact) {
  const id = "typonet-loops",
    w = compact ? 520 : 760,
    pw = compact ? 480 : 346;
  function loop(x, y, special) {
    const active = special ? step >= 2 : step <= 1,
      repaired = special ? step === 3 : step >= 1;
    let b = rect(
      0,
      0,
      pw,
      355,
      special ? "orangeSoft" : "white",
      special ? "orange" : "line",
    );
    b += text(
      pw / 2,
      29,
      special ? "Specialization loop" : "Foundation loop",
      22,
      special ? "orange" : "blue",
    );
    b +=
      brain(66, 90, "Constructor") +
      brain(pw - 66, 90, "Detractor", special ? "orange" : "blue");

    b +=
      arrow(id, `M66 138V180H${pw / 2 - 85}`, "blue") +
      arrow(
        id,
        `M${pw / 2 + 85} 181H${pw - 66}V139`,
        special ? "orange" : "blue",
      );
    b += rect(
      pw / 2 - 87,
      152,
      174,
      63,
      repaired ? "greenSoft" : "blueSoft",
      repaired ? "green" : "blue",
      5,
    );
    b += text(
      pw / 2,
      177,
      special
        ? ["Fault → symptoms", repaired ? "Checked ✓" : "Proposed"]
        : repaired
          ? ["Route ∧ up ∧ permits", "⇒ forward ✓"]
          : ["Route ⇒ forward", "Proposed"],
      16,
      repaired ? "green" : "blue",
    );
    if (special ? step === 2 : step === 1) {
      b += text(pw / 2, 119, "Counterexample", 13, "red");
      b += arrow(
        id,
        `M${pw - 100} 78C${pw - 140} 44 142 44 101 78`,
        "red",
        'stroke-dasharray="4 5" class="research-flow"',
      );
      b += tip(
        cross(pw / 2, 96),
        "A counterexample identifies the rule that disagrees with network evidence and sends it back for repair.",
      );
    }
    const failed = step >= 1 && (!special || step >= 2);
    b += network(53, 282, pw - 106, failed, active);
    b += arrow(
      id,
      `M${pw - 20} 278V110H${pw - 41}`,
      special ? "orange" : "blue",
    );
    b += text(
      pw / 2,
      340,
      special
        ? "Emulated network · inject & restore"
        : "Snapshots · invariants · procedures",
      compact ? 18 : 15,
      special ? "orange" : "muted",
    );
    if (failed)
      b += tip(
        text(pw / 2 + 46, 246, "Link down", 16, "red"),
        special
          ? "The proactive Detractor causes a fault in an emulated network, observes symptoms, then restores the network."
          : "A recorded snapshot shows a route whose outgoing link is down. The proposed forwarding rule missed the link-state condition.",
      );
    return group(x, y, b, !active && !repaired ? 'opacity=".35"' : "");
  }
  let b =
    loop(20, 30, false) + loop(compact ? 20 : 394, compact ? 434 : 30, true);
  const fy = compact ? 811 : 414;
  if (step >= 2) {
    const d = compact ? "M260 392V423" : "M372 209H386";
    b += arrow(id, d, "green");
  }
  b +=
    rect(
      20,
      fy,
      w - 40,
      56,
      step >= 1 ? "greenSoft" : "blueSoft",
      step >= 1 ? "green" : "blue",
      7,
    ) +
    text(
      w / 2,
      fy + 35,
      step >= 1
        ? "Reusable foundation theory"
        : "Foundation theory under construction",
      compact ? 21 : 22,
      step >= 1 ? "green" : "blue",
    );
  if (step === 3)
    b +=
      rect(38, fy + 68, w - 76, 43, "orangeSoft", "orange", 7) +
      text(w / 2, fy + 96, "+ Root-cause analysis layer", 20, "orange");
  else
    b += text(
      w / 2,
      fy + 96,
      step >= 2
        ? "Add task-specific knowledge through emulation"
        : "Build behavior from facts and check every layer",
      compact ? 18 : 20,
      "muted",
    );
  return frame(id, w, fy + 135, researchSteps[id][step].text, b);
}

const studentSessions = [
  {
    name: "Student A",
    commands: [
      ["ip addr add 55.200.0.1/24", "dev 55-S2"],
      ["ip route add default", "via 55.102.0.2"],
      ["ip addr show"],
      ["ip r"],
      ["ping 55.102.0.2"],
    ],
    normalized: [
      "ip address add A_EUH dev S2",
      "ip route add default via ATLrouter",
      "ip address show",
      "ip route show",
      "ping ATLrouter",
    ],
    actions: ["Create · address", "Create · protocol", "Read · state", "Read · state", "Probe · state"],
  },
  {
    name: "Student B",
    commands: [
      ["ip address add 24.200.0.11/24", "dev 24-S2"],
      ["ifconfig"],
      ["ip route add default", "via 24.200.0.254"],
      ["ip route list default"],
      ["ping group24.ATLrouter"],
    ],
    normalized: [
      "ip address add A_EUH dev S2",
      "ifconfig",
      "ip route add default via ATLrouter",
      "ip route show",
      "ping ATLrouter",
    ],
    actions: ["Create · address", "Read · state", "Create · protocol", "Read · state", "Probe · state"],
  },
];

function studentPatterns(step, compact) {
  const id = "student-patterns";
  const w = compact ? 520 : 760;
  const cardWidth = compact ? 480 : 350;
  const cardHeight = 355;
  const bottom = compact ? 825 : 445;
  const headings = [
    "Two students configure a host",
    "Local names become shared roles",
    "Commands become symbolic actions",
    "Both sessions match one template",
  ];
  let body = text(w / 2, 30, headings[step], compact ? 23 : 25);
  studentSessions.forEach((session, student) => {
    const x = compact ? 20 : 20 + student * 370;
    const y = compact ? 55 + student * 380 : 55;
    let panel = rect(0, 0, cardWidth, cardHeight, "white", student ? "orange" : "blue");
    panel += text(20, 29, session.name, 20, student ? "orange" : "blue", "start");
    if (step === 3) {
      panel += tip(
        rect(10, 43, cardWidth - 20, 232, "blueSoft", "blue", 8),
        "The template treats setup and inspection commands as an unordered set on the same device. Display order is aligned here only to expose the match.",
      );
      panel += text(cardWidth - 20, 64, "Any order", 14, "blue", "end");
    }
    session.commands.forEach((raw, row) => {
      const slot = step === 3 && student === 1 ? [0, 2, 1, 3, 4][row] : row;
      const action = session.actions[row];
      const color = row === 4 ? "green" : step >= 2 ? (action.startsWith("Create") ? "blue" : "orange") : "muted";
      const words = step === 0 ? raw : step === 1 ? [session.normalized[row]] : [action];
      const rowY = 78 + slot * 53;
      let content = rect(20, rowY - 10, cardWidth - 40, 44, `${color === "muted" ? "blue" : color}Soft`, "line", 6);
      content += text(32, rowY + (words.length > 1 ? 6 : 17), words, step >= 2 ? 20 : compact ? 18 : 15, color, "start");
      if (row === 4) content += tick(cardWidth - 39, rowY + 11);
      const description = step >= 2
        ? `${raw.join(" ")} maps to (${action.replace(" · ", ", ")}).`
        : row === 4 ? "The first successful connectivity probe anchors the preceding commands." : "Command sequence adapted from Figure 1.";
      panel += `<g class="student-command" style="--row-shift:${(row - slot) * 53}px">${tip(content, description)}</g>`;
    });
    body += group(x, y, panel);
  });
  if (!compact) {
    body += arrow(id, `M195 410V426H380V${bottom}`, "blue");
    body += arrow(id, `M565 410V426H380V${bottom}`, "orange");
  } else {
    body += arrow(id, `M260 790V${bottom}`, "blue");
  }
  let result = rect(20, bottom, w - 40, 172, step === 3 ? "greenSoft" : "white", step === 3 ? "green" : "line");
  if (step === 0) {
    result += text(w / 2, bottom + 35, "Same goal: configure, inspect, connect", 21);
    result += router(w / 2 - 115, bottom + 94, "Host", "blue");
    result += arrow(id, `M${w / 2 - 90} ${bottom + 94}H${w / 2 + 90}`, "green");
    result += router(w / 2 + 115, bottom + 94, "Gateway", "green");
    result += text(w / 2, bottom + 83, "ping ✓", 18, "green");
  } else if (step === 1) {
    result += text(w / 2, bottom + 33, "Resolve names and expand shortcuts", 21);
    result += text(w / 2 - 120, bottom + 75, ["55-S2", "24-S2"], 19, "muted");
    result += arrow(id, `M${w / 2 - 60} ${bottom + 80}H${w / 2 + 20}`, "blue");
    result += text(w / 2 + 92, bottom + 87, "S2", 22, "blue");
    result += text(w / 2, bottom + 145, "ip r  →  ip route show", 20, "blue");
  } else if (step === 2) {
    result += text(w / 2, bottom + 33, "Different syntax, the same action", 21);
    result += text(w / 2 - 120, bottom + 75, ["ip addr show", "ifconfig"], 18, "muted");
    result += arrow(id, `M${w / 2 - 40} ${bottom + 80}H${w / 2 + 20}`, "orange");
    result += text(w / 2 + 125, bottom + 87, "Read · state", 20, "orange");
    result += text(w / 2, bottom + 145, "Names and spelling no longer hide the pattern", compact ? 17 : 19, "muted");
  } else {
    result += text(w / 2, bottom + 32, "One shared configuration pattern", 22, "green");
    const left = compact ? 35 : 75;
    result += tip(
      rect(left, bottom + 52, compact ? 255 : 300, 68, "blueSoft", "blue") +
      text(left + (compact ? 127 : 150), bottom + 77, ["Create address + protocol", "Read state · any order"], 18, "blue"),
      "Figure 1 specializes a high-level template to a repeated host-configuration pattern. The inspection set contains two Read · state actions.",
    );
    const anchorX = compact ? 335 : 490;
    result += arrow(id, `M${left + (compact ? 255 : 300)} ${bottom + 85}H${anchorX - 10}`, "green");
    result += rect(anchorX, bottom + 52, compact ? 150 : 190, 68, "white", "green");
    result += text(anchorX + (compact ? 75 : 95), bottom + 77, ["Probe succeeds", "Anchor ✓"], 18, "green");
    result += text(w / 2, bottom + 150, "Matched episodes → reusable runbook", 20, "green");
  }
  body += `<g class="diagram-enter">${result}</g>`;
  return frame(id, w, bottom + 195, researchSteps[id][step].text, body);
}

export const researchSteps = {
  "student-patterns": [
    { label: "Two sessions", text: "Two students configure equivalent hosts with different addresses, command spellings, and operation orders. Both finish with a successful ping." },
    { label: "Resolve names", text: "Topology roles replace local addresses and device names. Expanding command shortcuts makes equivalent syntax comparable." },
    { label: "Abstract actions", text: "Each command becomes an action and resource pair. Commands such as ifconfig and ip addr show map to Read · state in the figure’s abstraction." },
    { label: "Match a template", text: "A template groups setup and inspection commands before the first successful probe. Ignoring order within that set reveals a shared configuration pattern that can become a runbook." },
  ],
  "autogram-space": [
    {
      label: "Bound the search",
      text: "The grammar defines which relationships Autogram can express. A known flow-conservation rule lies outside a grammar limited to pairwise comparisons.",
    },
    {
      label: "Test candidates",
      text: "Logical and statistical checks accept supported candidates inside Γ. Searching harder cannot recover a rule that the grammar cannot express.",
    },
    {
      label: "Expand Γ",
      text: "A missing known invariant prompts grammar re-induction. Adding a sum over outgoing links expands the search while staying within the solver’s language.",
    },
    {
      label: "Recover the rule",
      text: "The expanded grammar can express flow conservation. The evaluator checks the new candidates against telemetry before accepting them.",
    },
  ],
  "autogram-loop": [
    {
      label: "Propose Γ",
      text: "Counter names and metadata go to the LLM, which proposes a typed grammar. Network measurements go directly to the evaluator.",
    },
    {
      label: "Screen",
      text: "The search enumerates the bounded grammar. A solver removes tautologies, contradictions, and logically redundant candidates.",
    },
    {
      label: "Check evidence",
      text: "Statistical tests assess surviving candidates with data-derived tolerances and hold-rate confidence bounds. Synthetic datasets calibrate the generic thresholds.",
    },
    {
      label: "Refine Γ",
      text: "When recovery of held-out known invariants stalls, Autogram asks for a more expressive grammar and repeats the search.",
    },
  ],
  "typonet-reasoning": [
    {
      label: "Read artifacts",
      text: "Operators and AI agents face a large collection of configurations, topology records, and routing state. Re-reading those artifacts makes each new question expensive.",
    },
    {
      label: "Translate",
      text: "TypoNet uses an LLM to translate network artifacts into explicit logical rules.",
    },
    {
      label: "Validate",
      text: "Independent network evidence challenges the proposed rules. The resulting symbolic model becomes an artifact that a solver can reason over.",
    },
    {
      label: "Reuse",
      text: "Operators and AI agents query the solver for reachability and change impact. A specialized theory also supports root-cause analysis. Answers follow from the current symbolic model.",
    },
  ],
  "typonet-loops": [
    {
      label: "Propose rules",
      text: "The Constructor AI agent builds rules from source-of-truth records. The Detractor AI agent checks them against snapshots, known invariants, and operator procedures.",
    },
    {
      label: "Refute & repair",
      text: "A recorded link failure exposes a missing condition in the illustrative forwarding rule. The counterexample returns to the Constructor AI agent for repair.",
    },
    {
      label: "Emulate faults",
      text: "The reusable foundation supports a second loop. The proactive Detractor AI agent injects faults into an emulated network and observes their effects.",
    },
    {
      label: "Specialize",
      text: "Checked fault-to-symptom rules form a root-cause analysis layer on the foundation. Production contributes read-only artifacts; perturbations stay in emulation.",
    },
  ],
};
export const researchRenderers = {
  "student-patterns": studentPatterns,
  "autogram-space": autogramSpace,
  "autogram-loop": autogramLoop,
  "typonet-reasoning": typonetReasoning,
  "typonet-loops": typonetLoops,
};
