const C = {
  ink: "#263238",
  muted: "#59686e",
  blue: "#526b98",
  blueSoft: "#e1e8f3",
  orange: "#ad5736",
  orangeSoft: "#fae8dd",
  green: "#327762",
  greenSoft: "#e3f0e9",
  red: "#af4c4c",
  redSoft: "#f8e2e1",
  line: "#bac9cf",
  white: "#fff",
};
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const t = (
  x,
  y,
  lines,
  size = 20,
  color = "ink",
  anchor = "middle",
  weight = 400,
) =>
  `<text class="diagram-text ${color}" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}">${(Array.isArray(lines) ? lines : [lines]).map((line, i) => `<tspan x="${x}" dy="${i ? size * 1.35 : 0}">${escape(line)}</tspan>`).join("")}</text>`;
const box = (x, y, w, h, fill = "white", stroke = "line", r = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${C[fill] || fill}" stroke="${C[stroke] || stroke}" stroke-width="1.4"/>`;
const line = (x1, y1, x2, y2, color = "line", dash = "") =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${C[color]}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
const arrow = (id, x1, y1, x2, y2, color = "muted") =>
  `<path class="data-flow" d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${C[color]}" stroke-width="1.7" marker-end="url(#${id}-arrow)"/>`;
const route = (id, d, color = "muted", dash = false) =>
  `<path d="${d}" fill="none" stroke="${C[color]}" stroke-width="1.7" ${dash ? 'stroke-dasharray="5 5"' : ""} marker-end="url(#${id}-arrow)"/>`;
function svg(id, w, h, title, body) {
  return `<svg viewBox="0 0 ${w} ${h}" role="group" aria-labelledby="${id}-diagram-title"><title id="${id}-diagram-title">${escape(title)}</title><defs><marker id="${id}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.muted}"/></marker></defs><g class="diagram-enter">${body}</g></svg>`;
}
const node = (x, y, w, h, label, theme = "blue") =>
  box(x, y, w, h, theme + "Soft", theme) +
  t(x + w / 2, y + h / 2 - (Array.isArray(label) ? 5 : -6), label, 18, theme);
const chip = (x, y, w, label, kind = "white") =>
  box(
    x,
    y,
    w,
    39,
    kind === "white" ? "white" : kind + "Soft",
    kind === "white" ? "line" : kind,
    5,
  ) + t(x + w / 2, y + 26, label, 19, kind === "white" ? "ink" : kind);

export const generation = Object.freeze({
  total: 100,
  capacity: 60,
  burst: 30,
  prefix: [20, 15, 25],
});
export function validNext(value) {
  const rest = 40 - value;
  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 60 &&
    rest >= 0 &&
    rest <= 60 &&
    Math.max(value, rest) >= 30
  );
}
export const feasibleValues = Array.from({ length: 61 }, (_, i) => i).filter(
  validNext,
);
export function digitOptions(prefix) {
  return Array.from({ length: 10 }, (_, i) => String(i)).filter((digit) =>
    feasibleValues.some((value) =>
      String(value)
        .padStart(2, "0")
        .startsWith(prefix + digit),
    ),
  );
}
export const samples = Object.freeze({ a: [1, 2], b: [0, 3, 4], c: [3] });
export function coverage(selected) {
  const covered = new Set(selected.flatMap((k) => samples[k] || []));
  return {
    covered: [...covered],
    complete: covered.size === 5,
    minimal:
      covered.size === 5 &&
      selected.every(
        (k) =>
          new Set(selected.filter((v) => v !== k).flatMap((v) => samples[v]))
            .size < 5,
      ),
  };
}
export const packetTimes = Object.freeze({
  original: [0, 20, 40, 60],
  early: [0, 10, 35, 60],
  late: [0, 45, 65, 85],
  valid: [0, 25, 45, 70],
});
export function checkPackets(times) {
  return {
    delay: times.every((v, i) => v >= packetTimes.original[i]),
    order: times.every((v, i) => i === 0 || v >= times[i - 1]),
    budget: times.every((v, i) => v - packetTimes.original[i] <= 20),
  };
}

const tokenRecords = [
  [20, 15, 25, 39, 1],
  [10, 25, 35, 10, 20],
  [30, 10, 20, 25, 15],
  [15, 35, 5, 40, 5],
];
export function lejitTokenFrame(cursor = 0) {
  const record = tokenRecords[Math.floor(cursor / 10) % tokenRecords.length];
  const position = cursor % 10,
    index = Math.floor(position / 2);
  const prefix = position % 2 ? String(record[index]).padStart(2, "0")[0] : "";
  const prior = record.slice(0, index),
    spent = prior.reduce((a, v) => a + v, 0),
    slots = 4 - index;
  const completions = Array.from({ length: 61 }, (_, i) => i).filter(
    (value) => {
      const rest = 100 - spent - value;
      return (
        rest >= 0 &&
        rest <= slots * 60 &&
        (Math.max(...prior, value) >= 30 || (slots > 0 && rest >= 30))
      );
    },
  );
  const allowed = Array.from({ length: 10 }, (_, i) => String(i)).filter(
    (digit) =>
      completions.some((value) =>
        String(value)
          .padStart(2, "0")
          .startsWith(prefix + digit),
      ),
  );
  const chosen = String(record[index]).padStart(2, "0")[position % 2];
  const good = [chosen, ...allowed.filter((v) => v !== chosen)].slice(0, 3);
  const bad = [
    ...Array.from({ length: 10 }, (_, i) => String(i)).filter(
      (d) => !allowed.includes(d),
    ),
    "−",
    "x",
    "+",
    ".",
  ].slice(0, 6 - good.length);
  const candidates = [];
  for (let i = 0; i < 3; i++) {
    if (good[i] !== undefined)
      candidates.push({
        token: good[i],
        allowed: true,
        selected: good[i] === chosen,
      });
    if (bad[i] !== undefined)
      candidates.push({ token: bad[i], allowed: false, selected: false });
  }
  for (const token of bad.slice(3))
    candidates.push({ token, allowed: false, selected: false });
  const emitted = record
    .map((v) => String(v).padStart(2, "0"))
    .join("")
    .slice(0, position);
  const shift = cursor % candidates.length;
  return {
    record,
    position,
    chosen,
    candidates: candidates.slice(shift).concat(candidates.slice(0, shift)),
    emitted,
  };
}

function neuralIcon(x, y, radius = 32, color = "blue") {
  const columns = [
    [-radius * 0.65, [-radius * 0.6, 0, radius * 0.6]],
    [0, [-radius * 0.8, -radius * 0.25, radius * 0.3, radius * 0.8]],
    [radius * 0.65, [-radius * 0.45, radius * 0.45]],
  ];
  let b = "";
  for (let i = 0; i < 2; i++)
    for (const yy of columns[i][1])
      for (const next of columns[i + 1][1])
        b += line(
          x + columns[i][0],
          y + yy,
          x + columns[i + 1][0],
          y + next,
          color,
        );
  for (const [xx, ys] of columns)
    for (const yy of ys)
      b += `<circle cx="${x + xx}" cy="${y + yy}" r="${radius * 0.13}" fill="${C.white}" stroke="${C[color]}" stroke-width="2"/>`;
  return b;
}

export function lejitDiagram(cursor = 0, compact = false) {
  const w = compact ? 520 : 760,
    id = "lejit",
    frame = lejitTokenFrame(cursor);
  const llmX = compact ? 58 : 83,
    candidateXs = compact ? [151, 217] : [232, 306],
    gate = compact ? 311 : 437,
    picked = compact ? 441 : 651;
  let b = "";
  const ruleW = compact ? 76 : 102;
  ["Capacity", "Totals", "Bursts"].forEach((label, i) => {
    b += tip(
      box(22 + i * (ruleW + 7), 47, ruleW, 36, "white", "orange", 4) +
        t(
          22 + i * (ruleW + 7) + ruleW / 2,
          71,
          label,
          compact ? 15 : 18,
          "orange",
        ),
      [
        "Generated traffic stays within link capacity.",
        "Generated detail agrees with observed totals.",
        "Generated traffic reflects the supplied burst constraint.",
      ][i],
    );
  });
  b += t(22, 29, "Network rules", 18, "orange", "start");
  const solverX = w - (compact ? 154 : 188),
    solverW = compact ? 130 : 164;
  b += arrow(id, 22 + 3 * (ruleW + 7), 65, solverX - 9, 65, "orange");
  b += tip(
    box(solverX, 39, solverW, 53, "orangeSoft", "orange") +
      t(solverX + solverW / 2, 72, "SMT solver", compact ? 20 : 23, "orange"),
    "The SMT solver checks the rules against the generated prefix. LeJIT converts the feasible continuations into a token mask before the LLM samples.",
  );
  b += route(id, `M${solverX + solverW / 2} 95V126H${gate}V182`, "orange");
  b += t(llmX, 163, "LLM", 24, "blue", "middle", 500);
  b += tip(
    `<circle cx="${llmX}" cy="260" r="43" fill="${C.blueSoft}" stroke="${C.blue}" stroke-width="1.8"/>` +
      neuralIcon(llmX, 260, 32),
    "The LLM proposes a distribution over next tokens and samples from the allowed choices.",
  );
  b += arrow(id, llmX + 48, 260, candidateXs[0] - 25, 260, "blue");
  b += t((candidateXs[0] + candidateXs[1]) / 2, 163, "Candidates", 21, "blue");
  b += `<g class="lejit-filter">${box(gate - 18, 187, 36, 156, "orangeSoft", "orange", 4)}${[0, 1, 2, 3, 4, 5, 6].map((i) => line(gate - 13, 198 + i * 22, gate + 13, 198 + i * 22, "orange")).join("")}</g>`;
  b += t(gate, 377, "LeJIT", 23, "orange", "middle", 500);
  b += t(picked, 163, "Next token", 21, "green");
  b += line(gate + 24, 260, picked + 25, 260, "line", "4 5");
  b += `<rect x="${picked - 24}" y="236" width="48" height="48" rx="6" fill="none" stroke="${C.green}" stroke-width="1.4" stroke-dasharray="4 4"/>`;
  b += `<g class="lejit-selection">${box(picked - 24, 236, 48, 48, "greenSoft", "green", 6)}${t(picked, 267, frame.chosen, 26, "green")}</g>`;
  b +=
    t(picked, 316, "Selected by", 17, "muted") +
    t(picked, 340, "the LLM", 17, "muted");
  frame.candidates.forEach((candidate, i) => {
    const x = candidateXs[i % 2],
      y = 210 + Math.floor(i / 2) * 55,
      color = candidate.allowed ? "green" : "red";
    b += tip(
      `<g class="lejit-candidate ${candidate.allowed ? "allowed" : "masked"}" data-token="${escape(candidate.token)}" data-allowed="${candidate.allowed}">${box(x - 21, y - 20, 42, 40, "blueSoft", "blue", 5)}${t(x, y + 7, candidate.token, 24, "blue")}<path class="token-mask-cross" d="M${x - 14} ${y - 13}L${x + 14} ${y + 13}M${x + 14} ${y - 13}L${x - 14} ${y + 13}" stroke="${C.red}" stroke-width="2.5"/></g>`,
      candidate.allowed
        ? `Token “${candidate.token}” remains available to the LLM.`
        : `Token “${candidate.token}” is masked because it cannot satisfy the rules and output format from the current prefix.`,
    );
  });
  b += t(24, 414, "Generated tokens", 18, "muted", "start");
  const tokenW = compact ? 35 : 49,
    tapeX = 27;
  const tape = frame.emitted + frame.chosen;
  b += box(20, 432, w - 40, 62, "white", "line", 6);
  [...tape].forEach((token, i) => {
    const x = tapeX + i * (tokenW + 3),
      pending = i === tape.length - 1;
    b += `<g class="${pending ? "lejit-output-new" : ""}" data-output-token="${token}">${box(x, 442, tokenW, 40, "greenSoft", "green", 4)}${t(x + tokenW / 2, 469, token, 23, "green")}</g>`;
    if (i % 2 === 1 && i < tape.length - 1)
      b += t(x + tokenW + 2, 479, ",", 13, "muted");
  });
  const selected = frame.candidates.findIndex((c) => c.selected),
    fromX = candidateXs[selected % 2],
    fromY = 210 + Math.floor(selected / 2) * 55;
  const outX = tapeX + (tape.length - 1) * (tokenW + 3) + tokenW / 2;
  b += `<g class="lejit-flying-token" style="--from-x:${fromX}px;--from-y:${fromY}px;--gate-x:${gate}px;--pick-x:${picked}px;--out-x:${outX}px" aria-hidden="true">${box(-19, -20, 38, 40, "greenSoft", "green", 5)}${t(0, 7, frame.chosen, 24, "green")}</g>`;
  b += t(
    w / 2,
    527,
    "Propose → mask → select → repeat",
    compact ? 21 : 24,
    "muted",
  );
  return svg(
    id,
    w,
    553,
    "LeJIT masks invalid next tokens using rules and an SMT solver. The LLM selects an allowed token and continues generating.",
    b,
  ).replace('class="diagram-enter"', 'class="lejit-scene"');
}
function lejit(step, compact) {
  return lejitDiagram(step, compact);
}

export const fineTraces = Object.freeze([
  [10, 10, 20, 10, 10, 20, 15, 25, 30, 10, 5, 10, 45, 30, 10],
  [10, 10, 40, 10, 10, 20, 15, 25, 30, 10, 5, 10, 45, 30, 10],
  [10, 10, 60, 10, 10, 20, 15, 25, 30, 10, 5, 10, 45, 30, 10],
]);
const tip = (body, text) =>
  `<g class="diagram-tip" tabindex="0" data-tooltip="${escape(text)}" aria-label="${escape(text)}">${body}</g>`;
const math = (x, y, content, size = 23, color = "ink", anchor = "start") =>
  `<text class="diagram-text math ${color}" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}">${content}</text>`;
const sub = (value) =>
  `<tspan baseline-shift="sub" font-size="70%">${value}</tspan>`;
const sup = (value) =>
  `<tspan baseline-shift="super" font-size="70%">${value}</tspan>`;

function zoom2net(step, compact) {
  const w = compact ? 520 : 760,
    id = "zoom2net",
    left = 45,
    right = w - 25;
  const width = right - left,
    base = 267,
    height = 166;
  const px = (i) => left + (width * (i + 0.5)) / 15;
  const py = (value) => base - (height * value) / 65;
  const path = (values) =>
    values.map((v, i) => `${i ? "L" : "M"}${px(i)} ${py(v)}`).join(" ");
  let b = t(24, 28, "Traffic per interval", 18, "muted", "start");
  b +=
    line(w - 190, 23, w - 158, 23, "muted", "5 4") +
    t(w - 150, 29, "Observed average", 15, "muted", "start");
  b += box(
    left,
    65,
    width / 3,
    215,
    step === 3 ? "greenSoft" : "orangeSoft",
    "line",
    0,
  );
  for (let v = 0; v <= 60; v += 20)
    b +=
      line(left, py(v), right, py(v)) +
      t(left - 10, py(v) + 6, v, 16, "muted", "end");
  for (let i = 1; i < 3; i++)
    b += line(
      left + (width * i) / 3,
      65,
      left + (width * i) / 3,
      base + 12,
      "line",
      "4 5",
    );
  b += line(left, py(20), right, py(20), "muted", "7 6");
  if (step > 0) {
    const values = fineTraces[step - 1],
      color = step === 3 ? "green" : "blue";
    if (step >= 2) {
      const before = fineTraces[step - 2];
      b +=
        line(w - 190, 47, w - 158, 47, "blue", "3 4") +
        t(w - 150, 53, "Previous prediction", 15, "blue", "start");
      b += `<path d="${path(before)}" fill="none" stroke="${C.blue}" stroke-width="2" stroke-dasharray="3 4" opacity=".7"/>`;
      b += `<path d="M${px(1)} ${py(10)}L${px(2)} ${py(before[2])}L${px(3)} ${py(10)}L${px(2)} ${py(values[2])}Z" fill="${C[color]}" opacity=".18"/>`;
      b += arrow(id, px(2), py(before[2]) - 4, px(2), py(values[2]) + 7, color);
    }
    b += `<path data-morph="zoom-trace" d="${path(values)}" fill="none" stroke="${C[color]}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    values.forEach((v, i) => {
      b += tip(
        `<circle cx="${px(i)}" cy="${py(v)}" r="${i === 2 ? 6 : 3.5}" fill="${C[color]}"/>`,
        `Interval ${i + 1}: ${v} units. Window ${Math.floor(i / 5) + 1} must total 100.`,
      );
    });
    b += t(
      px(2),
      py(values[2]) - 14,
      step === 3 ? "40 → 60" : String(values[2]),
      20,
      color,
    );
  } else {
    for (let i = 0; i < 3; i++)
      b += t(left + (width * (i + 0.5)) / 3, 149, "?", 47, "muted");
  }
  for (let i = 0; i < 3; i++) {
    const x = left + (width * i) / 3 + 9,
      bw = width / 3 - 18;
    const total = step
      ? fineTraces[step - 1]
          .slice(i * 5, (i + 1) * 5)
          .reduce((a, v) => a + v, 0)
      : 100;
    const color =
      i === 0 && step > 0 && step < 3 ? "red" : step === 0 ? "muted" : "green";
    b += t(x + bw / 2, 308, `Window ${i + 1}`, 17, "muted");
    b += tip(
      box(x, 325, bw, 13, "white", "line", 2) +
        box(
          x,
          325,
          (bw * total) / 100,
          13,
          color === "muted" ? "blueSoft" : `${color}Soft`,
          color === "muted" ? "blue" : color,
          2,
        ),
      `Measured total: 100. ${step ? `Reconstruction: ${total}. Missing: ${100 - total}.` : "Five intervals with an average of 20."}`,
    );
    if (total < 100)
      b += `<rect x="${x + (bw * total) / 100}" y="325" width="${(bw * (100 - total)) / 100}" height="13" fill="${C.redSoft}" stroke="${C.red}" stroke-dasharray="3 3"/>`;
    b += t(
      x + bw / 2,
      366,
      step ? `${total} / 100 ${total === 100 ? "✓" : "×"}` : "Total: 100",
      20,
      color,
    );
  }
  b += t(
    w / 2,
    420,
    [
      "Coarse averages leave the detail unknown",
      "Window 1 is missing 40 units",
      "Training reduces the deficit to 20 units",
      "Enforcement adds the missing 20 units",
    ][step],
    compact ? 19 : 23,
    step === 3 ? "green" : step ? "red" : "muted",
  );
  return svg(
    id,
    w,
    450,
    `${steps.zoom2net[step].label}. ${steps.zoom2net[step].text}`,
    b,
  );
}

export function packetDiagram(name = "early", compact = false) {
  const w = compact ? 520 : 760,
    id = "packet-timing",
    left = 45,
    right = w - 28;
  const px = (v) => left + ((right - left) * v) / 100;
  const candidate = packetTimes[name];
  let b = t(25, 25, "Arrival time (ms)", 18, "muted", "start");
  for (let time = 0; time <= 100; time += 20) {
    b +=
      line(px(time), 61, px(time), 245, "line", "3 5") +
      t(px(time), 55, time, 16, "muted");
  }
  b +=
    t(25, 95, "Original", 17, "blue", "start") +
    t(25, 184, "Candidate", 17, "muted", "start");
  [packetTimes.original, candidate].forEach((times, row) => {
    const y = row ? 216 : 123;
    b += line(left, y, right, y);
    times.forEach((time, i) => {
      const original = packetTimes.original[i],
        delta = time - original;
      const bad = row && (delta < 0 || delta > 20);
      const color = row ? (bad ? "red" : "green") : "blue";
      if (row && delta) {
        b += `<g data-shift="${i}" data-start="${px(original)}" data-end="${px(time)}">${box(px(original) - 10, y - 13, 20, 26, "white", "line", 3)}${arrow(id, px(original), y + 27, px(time), y + 27, color)}</g>`;
      }
      const label = `Packet ${i + 1}: ${time} ms${row ? `. ${delta >= 0 ? "+" : ""}${delta} ms relative to its original arrival. ${bad ? "Not allowed by the timing rules." : "Allowed by the timing rules."}` : "."}`;
      b += `<g data-packet-key="${row}-${i}" transform="translate(${px(time)} 0)">${tip(box(-11, y - 15, 22, 30, color + "Soft", color, 4) + t(0, y + 6, i + 1, 16, color) + t(0, y + (row ? 55 : 37), row ? `${delta >= 0 ? "+" : ""}${delta}` : time, 16, color), label)}</g>`;
    });
  });
  b += t(w - 26, 298, "Delay relative to original (ms)", 15, "muted", "end");
  return svg(
    id,
    w,
    315,
    `Packets on a shared 0 to 100 millisecond axis. Original: ${packetTimes.original.join(", ")}. Candidate: ${candidate.join(", ")}.`,
    b,
  );
}

function pants(step, compact) {
  const w = compact ? 520 : 760,
    id = "pants",
    cols = compact ? [20, 190, 360] : [30, 285, 540],
    bw = compact ? 140 : 190;
  let b = "";
  const labels = [
    ["Original", "packets"],
    ["Feature", "extraction"],
    ["Network", "classifier"],
  ];
  labels.forEach((label, i) => {
    b += node(cols[i], 25, bw, 70, label, i === 1 ? "orange" : "blue");
    if (i < 2) b += arrow(id, cols[i] + bw + 5, 60, cols[i + 1] - 7, 60);
  });
  if (step === 0) {
    b += t(
      w / 2,
      144,
      "Packet spacing becomes a classifier input",
      20,
      "muted",
    );
  } else if (step === 1) {
    b +=
      node(
        w / 2 - 125,
        127,
        250,
        64,
        ["Adversarial search", "proposes difficult features"],
        "blue",
      ) + route(id, `M${cols[2] + bw / 2} 97V158H${w / 2 + 130}`);
  } else {
    b +=
      node(
        w / 2 - 125,
        127,
        250,
        64,
        ["Select feature targets", "Check realizable packets"],
        "orange",
      ) + route(id, `M${cols[1] + bw / 2} 96V119`);
  }
  const vals =
    step === 2
      ? packetTimes.early
      : step === 3
        ? packetTimes.valid
        : packetTimes.original;
  b += t(
    24,
    233,
    step === 2
      ? "Rejected candidate"
      : step === 3
        ? "Realizable candidate"
        : "Packet arrival times",
    18,
    step === 2 ? "red" : "muted",
    "start",
  );
  const start = 50,
    end = w - 50;
  b += line(start, 289, end, 289);
  vals.forEach((v, i) => {
    const px = start + ((end - start) * v) / 85;
    const kind =
      step === 2 && i > 0 && i < 3 ? "red" : step === 3 ? "green" : "blue";
    b +=
      box(px - 13, 267, 26, 42, kind + "Soft", kind, 5) +
      t(px, 295, i + 1, 19, kind) +
      t(px, 337, `${v} ms`, 18, "muted");
  });
  const bottom =
    step === 0
      ? ["The classifier uses measurements,", "not the raw timing story."]
      : step === 1
        ? [
            "A difficult feature vector may have",
            "no realizable packet sequence.",
          ]
        : step === 2
          ? [
              "Packets cannot arrive early when",
              "the attacker can only add delay.",
            ]
          : [
              "Recheck the classifier. Use confirmed",
              "failures to strengthen it.",
            ];
  b += t(
    w / 2,
    383,
    bottom,
    20,
    step === 2 ? "red" : step === 3 ? "green" : "muted",
  );
  return svg(
    id,
    w,
    445,
    `${steps.pants[step].label}. ${steps.pants[step].text}`,
    b,
  );
}

function netnomos(step, compact) {
  const w = compact ? 520 : 760,
    id = "netnomos";
  let b = "";
  if (step === 0) {
    b +=
      t(24, 33, "Grammar Γ", 24, "ink", "start", 500) +
      t(w - 24, 33, "Core productions", 16, "muted", "end");
    const rows = [
      [
        "τ ∈ {time, size, id, flag, count}",
        "Every variable has a type. Comparisons join terms of the same type.",
      ],
      [
        `v${sub("τ")} ∈ V,  k ∈ {0, …, K − 1}`,
        "The context contains K consecutive observations. A variable is indexed within that finite context.",
      ],
      [
        `p ::= (ℓ${sub("τ")} ⋈ r${sub("τ")}),  ⋈ ∈ {&lt;, ≤, =, ≠, ≥, &gt;}`,
        "A predicate compares terms of the same type. The left side contains a single variable; the right side contains a constant, single variable, or aggregate.",
      ],
      [
        "φ ::= [¬]p ((∨ | ∧ | ⇒) [¬]p)*",
        "Negation and logical connectives combine predicates. Square brackets mean optional; the star means repetition.",
      ],
      [
        `Q ::= ε | ∀W | ∀W ∃v${sub("k")}`,
        "W is the context. An existential quantifier can only follow a universal quantifier and range within the K-observation context. ε means no quantifier.",
      ],
      [
        "C ::= Q : φ",
        "A candidate constraint consists of a quantifier block followed by a formula. The full grammar also defines constants, arithmetic terms, and aggregates.",
      ],
    ];
    rows.forEach(([formula, description], i) => {
      b += tip(
        box(
          20,
          54 + i * 37,
          w - 40,
          35,
          i % 2 ? "white" : "blueSoft",
          "line",
          3,
        ) + math(32, 78 + i * 37, formula, compact ? 20 : 23),
        description,
      );
    });
    b += t(24, 314, "A concrete window: K = 5", 18, "muted", "start");
    const x0 = compact ? 239 : 362,
      cw = (w - x0 - 24) / 5,
      baseline = 402;
    b += tip(
      math(
        24,
        370,
        `Congestion${sub("t")}${sup("K")} &gt; 0`,
        compact ? 20 : 25,
        "orange",
      ),
      "Congestion was observed in the coarse window starting at t. The example rule looks for a burst somewhere inside that same window.",
    );
    b += arrow(id, compact ? 213 : 298, 364, x0 - 14, 364);
    const vals = [20, 15, 25, 39, 1];
    b +=
      line(x0 - 4, baseline - 60, w - 25, baseline - 60, "orange", "5 4") +
      math(w - 26, baseline - 67, "BW/2", 15, "orange", "end");
    vals.forEach((v, i) => {
      const x = x0 + i * cw + 5;
      b += tip(
        box(
          x,
          baseline - v * 2,
          cw - 10,
          v * 2,
          i === 3 ? "greenSoft" : "blueSoft",
          i === 3 ? "green" : "blue",
          2,
        ) + t(x + (cw - 10) / 2, 426, i === 0 ? "t" : `t+${i}`, 16, "muted"),
        `I at t+${i} is ${v}. ${i === 3 ? "The value 39 is at least BW/2 = 30, so the existential clause is satisfied." : "The burst can occur at another index in the same window."}`,
      );
    });
    b += math(
      w / 2,
      468,
      `∃ 0 ≤ k &lt; 5 : I${sub("t+k")} ≥ BW/2`,
      compact ? 22 : 25,
      "green",
      "middle",
    );
  } else if (step < 3) {
    b += t(
      w / 2,
      35,
      step === 1
        ? "Evaluate each clause on the data"
        : "A ∨ B covers every observation",
      compact ? 22 : 25,
      "ink",
      "middle",
      500,
    );
    const x0 = compact ? 255 : 343,
      cw = (w - x0 - 24) / 5;
    const formulas = [
      `A: Congestion${sub("t")}${sup("K")} ≤ 0`,
      `B: ∃ k &lt; K : I${sub("t+k")} ≥ BW/2`,
      `C: I${sub("t")} ≥ BW/2`,
    ];
    for (let j = 0; j < 5; j++)
      b += t(x0 + cw * (j + 0.5), 90, String(j + 1), 19, "muted");
    formulas.forEach((formula, i) => {
      const y = 151 + i * 78,
        key = ["a", "b", "c"][i],
        selected = step === 2 && i < 2;
      b += tip(
        math(20, y, formula, compact ? 17 : 22, selected ? "blue" : "muted"),
        [
          "A: No congestion occurs in the observation window.",
          "B: At least one interval in the window reaches half the link capacity. The index k ranges from 0 to K−1.",
          "C: The first interval already reaches half the link capacity. This clause covers only an observation already covered by B.",
        ][i],
      );
      for (let j = 0; j < 5; j++) {
        const yes = samples[key].includes(j),
          cx = x0 + cw * (j + 0.5),
          color = selected ? "green" : "blue";
        b += `<circle cx="${cx}" cy="${y - 7}" r="16" fill="${yes ? C[color + "Soft"] : "none"}" stroke="${C[yes ? color : "line"]}"/>`;
        if (yes) b += t(cx, y, "✓", 19, color);
      }
    });
    b += line(20, 342, w - 20, 342);
    b += math(
      w / 2,
      393,
      step === 1
        ? "E(A) = {2, 3},  E(B) = {1, 4, 5}"
        : "E(A) ∪ E(B) = {1, 2, 3, 4, 5}",
      compact ? 22 : 26,
      step === 1 ? "blue" : "green",
      "middle",
    );
    b += t(
      w / 2,
      445,
      step === 1
        ? "✓ Clause is true on that observation"
        : "Removing A or B leaves an observation uncovered",
      compact ? 17 : 20,
      "muted",
    );
  } else {
    const centers = [w * 0.19, w * 0.5, w * 0.81];
    for (let i = 0; i < 3; i++)
      b += t(
        centers[i],
        50,
        ["Candidate rules", "Semantic filter", "Valid generation"][i],
        compact ? 17 : 20,
        "muted",
      );
    for (let i = 0; i < 3; i++)
      b +=
        box(centers[0] - 49 + i * 7, 83 + i * 12, 84, 95, "white", "line", 3) +
        math(
          centers[0] - 29 + i * 7,
          136 + i * 12,
          i === 1 ? "v > c" : "A ∨ B",
          22,
          i === 1 ? "red" : "blue",
        );
    b += tip(
      `<path d="M${centers[1] - 55} 90H${centers[1] + 55}L${centers[1] + 16} 158V194H${centers[1] - 16}V158Z" fill="${C.orangeSoft}" stroke="${C.orange}" stroke-width="2"/>` +
        t(centers[1], 137, "LLM", 22, "orange"),
      "An LLM uses networking knowledge to filter rules that fit the data but lack a meaningful interpretation.",
    );
    b +=
      arrow(id, centers[0] + 55, 140, centers[1] - 61, 140) +
      arrow(id, centers[1] + 61, 140, centers[2] - 55, 140);
    [20, 15, 25, 39, 1].forEach((v, i) => {
      b += box(
        centers[2] - 52 + i * 22,
        195 - v * 2,
        17,
        v * 2,
        "greenSoft",
        "green",
        2,
      );
    });
    b += t(centers[2], 224, "LeJIT", 19, "green");
    b += box(20, 284, w - 40, 139, "greenSoft", "green");
    b += math(
      w / 2,
      329,
      `∀t : Congestion${sub("t")}${sup("K")} &gt; 0`,
      compact ? 23 : 28,
      "green",
      "middle",
    );
    b += math(
      w / 2,
      379,
      `⇒ ∃ 0 ≤ k &lt; K : I${sub("t+k")} ≥ BW/2`,
      compact ? 23 : 28,
      "green",
      "middle",
    );
    b += t(
      w / 2,
      465,
      "Keep the meaningful rule; enforce it during generation.",
      compact ? 17 : 21,
      "muted",
    );
  }
  return svg(
    id,
    w,
    495,
    `${steps.netnomos[step].label}. ${steps.netnomos[step].text}`,
    b,
  );
}

export const bitrateChoices = Object.freeze({
  pensieve: [1850, 1200, 1850],
  reference: [750, 300, 300],
  allowed: [300, 750],
  all: [300, 750, 1200, 1850, 2850, 4300],
});

function videoScene(
  x,
  y,
  width,
  bitrate,
  bad = false,
  healthy = false,
  protectedPolicy = false,
  controllerKind = "pensieve",
) {
  const color = bad ? "red" : healthy ? "blue" : "green";
  const cy = y + 53,
    mid = x + width * 0.52,
    screen = x + width - 67;
  let b = "";
  const controllerX = x + 23;
  if (protectedPolicy) {
    b += `<g class="controller-shield" data-protection-shield="true"><path d="M${controllerX} ${cy - 43}L${controllerX + 37} ${cy - 31}V${cy + 7}Q${controllerX + 37} ${cy + 32} ${controllerX} ${cy + 48}Q${controllerX - 37} ${cy + 32} ${controllerX - 37} ${cy + 7}V${cy - 31}Z" fill="${C.orangeSoft}" stroke="${C.orange}" stroke-width="2.5"/></g>`;
  }
  if (controllerKind === "reference") {
    b += tip(
      box(controllerX - 23, cy - 25, 46, 50, "greenSoft", "green", 4) +
        [0, 1, 2]
          .map((i) =>
            line(
              controllerX - 13,
              cy - 13 + i * 13,
              controllerX + 13,
              cy - 13 + i * 13,
              "green",
            ),
          )
          .join(""),
      "A strong reference policy is selected under the same network conditions. It need not use reinforcement learning.",
    );
    b += t(controllerX, y + 115, "Reference policy", 14, "green");
  } else {
    b += tip(
      `<g data-rl-controller="pensieve">${neuralIcon(controllerX, cy, 29, "blue")}</g>`,
      protectedPolicy
        ? "ReGuard shields the Pensieve RL controller. The learned rule limits its risky bitrate choices."
        : "Pensieve is an RL controller. Its neural policy selects the video bitrate without a symbolic guard.",
    );
    b += t(controllerX, y + 115, "RL controller", 14, "blue");
  }
  b += line(x + 65, cy, mid - 65, cy) + line(mid + 64, cy, screen, cy);
  const throat = healthy ? 17 : 5;
  b += tip(
    `<path d="M${mid - 64} ${cy - 20}H${mid - 35}L${mid - 14} ${cy - throat}H${mid + 14}L${mid + 35} ${cy - 20}H${mid + 64}V${cy + 20}H${mid + 35}L${mid + 14} ${cy + throat}H${mid - 14}L${mid - 35} ${cy + 20}H${mid - 64}Z" fill="${C[healthy ? "blueSoft" : "orangeSoft"]}" stroke="${C[healthy ? "blue" : "orange"]}" stroke-width="1.8"/>`,
    healthy
      ? "Available bandwidth can support the chosen bitrate."
      : "Sparse bandwidth slows chunk downloads. Both controller actions face the same link.",
  );
  b += t(
    mid,
    y + 105,
    healthy ? "Available capacity" : "Bottleneck",
    16,
    healthy ? "muted" : "orange",
  );
  b += t(x + (mid - x + 2) / 2, cy - 25, "Video traffic", 15, color);
  b += tip(
    box(screen, y + 24, 62, 48, "white", color, 4) +
      line(screen + 31, y + 73, screen + 31, y + 83, color) +
      line(screen + 14, y + 83, screen + 48, y + 83, color) +
      (bad
        ? `<path d="M${screen + 23} ${y + 39}v19M${screen + 37} ${y + 39}v19" stroke="${C.red}" stroke-width="5"/>`
        : `<path d="M${screen + 25} ${y + 36}l17 12-17 12Z" fill="${C[color]}"/>`),
    bad
      ? "Playback stalls when the small buffer empties before a large chunk arrives. The scene illustrates the failure mechanism."
      : healthy
        ? "Available bandwidth and buffer support playback without intervention."
        : "The smaller video request helps avoid draining the playback buffer. The scene illustrates the correction, not a measured playback trace.",
  );
  b +=
    box(screen, y + 94, 62, 10, "white", "line", 2) +
    box(
      screen,
      y + 94,
      bad ? 5 : healthy ? 44 : 30,
      10,
      color + "Soft",
      color,
      2,
    ) +
    t(screen + 31, y + 125, "Buffer", 15, "muted");
  const stream = (from, to, count, kind, duration) => {
    const distance = to - from;
    return `<g data-stream="${kind}" data-bitrate="${bitrate}">${Array.from(
      { length: count },
      (_, i) =>
        `<g class="flow-packet" style="--travel:${distance}px;--duration:${duration}s;--delay:${(-i * duration) / count}s;--still:${(distance * i) / count}px">${box(from, cy - 4, 9, 8, color + "Soft", color, 1)}</g>`,
    ).join("")}</g>`;
  };
  const offered =
    bitrate === 1850
      ? width > 500
        ? 18
        : 12
      : bitrate === 300
        ? width > 500
          ? 3
          : 2
        : width > 500
          ? 7
          : 5;
  b += tip(
    stream(x + 65, mid - 69, offered, "offered", 2.4),
    `${bitrate} Kbps requested video bitrate. Packet density illustrates the demand entering the link. Packet motion is schematic.`,
  );
  b += stream(
    mid + 68,
    screen - 12,
    bad ? 4 : healthy ? 7 : bitrate === 300 ? 2 : 3,
    "delivered",
    2.8,
  );
  if (bad) {
    b += tip(
      [0, 1, 2, 3]
        .map((i) =>
          box(
            mid - 42 + (i % 2) * 12,
            cy - 14 + Math.floor(i / 2) * 19,
            9,
            8,
            "redSoft",
            "red",
            1,
          ),
        )
        .join(""),
      "The requested bitrate exceeds what the bottleneck can sustain. Data waits at the narrow link while the playback buffer drains.",
    );
  }
  return b;
}
function shield(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0L50 14V65Q50 97 0 124Q-50 97-50 65V14Z" fill="${C.orangeSoft}" stroke="${C.orange}" stroke-width="2"/>${[-25, 0, 25].flatMap((xx, i) => [-20, 20].map((yy) => line(xx, 35, yy, 78, "blue"))).join("")}${[-25, 0, 25].map((xx) => `<circle cx="${xx}" cy="35" r="7" fill="${C.blueSoft}" stroke="${C.blue}"/>`).join("")}${[-20, 20].map((xx) => `<circle cx="${xx}" cy="78" r="7" fill="${C.blueSoft}" stroke="${C.blue}"/>`).join("")}</g>`;
}
function reguard(step, compact) {
  const w = compact ? 520 : 760,
    id = "reguard";
  let b = "";
  if (step === 0) {
    b += t(
      w / 2,
      30,
      "Test both controllers on the same bottleneck",
      compact ? 20 : 25,
      "ink",
      "middle",
      500,
    );
    b += t(30, 73, "Pensieve · 1850 Kbps", 21, "red", "start");
    b += videoScene(35, 82, w - 85, 1850, true);
    b += line(30, 227, w - 35, 227);
    b += t(30, 263, "Reference · 750 Kbps", 21, "green", "start");
    b += videoScene(35, 272, w - 85, 750, false, false, false, "reference");
    b += route(id, `M${w - 15} 350V118H${w - 40}`, "orange", true);
    b += tip(
      t(
        w / 2,
        462,
        "Network search ↻    Better reference ↻",
        compact ? 20 : 23,
        "orange",
      ),
      "The outer search varies network conditions to increase avoidable loss. The inner search looks for a stronger reference policy under the same conditions.",
    );
  } else if (step === 1) {
    b += t(
      24,
      30,
      "Counterfactual bitrate choices",
      compact ? 23 : 26,
      "ink",
      "start",
      500,
    );
    b +=
      t(24, 67, "■ Pensieve", 18, "red", "start") +
      t(compact ? 175 : 207, 67, "■ Reference", 18, "green", "start") +
      t(w - 25, 67, "Kbps", 17, "muted", "end");
    const left = 65,
      right = w - 22,
      base = 356,
      scale = 230 / 2000,
      span = (right - left) / 3;
    [0, 750, 1850].forEach((v) => {
      b +=
        line(
          left,
          base - v * scale,
          right,
          base - v * scale,
          "line",
          v ? "4 5" : "",
        ) + t(left - 10, base - v * scale + 5, v, 16, "muted", "end");
    });
    for (let i = 0; i < 3; i++) {
      const center = left + span * (i + 0.5),
        bw = compact ? 32 : 51;
      [bitrateChoices.pensieve[i], bitrateChoices.reference[i]].forEach(
        (value, j) => {
          const x = center + (j ? 7 : -bw - 7),
            color = j ? "green" : "red";
          b += tip(
            `<rect class="bitrate-bar" style="--bar-height:${value * scale}px" x="${x}" y="${base - value * scale}" width="${bw}" height="${value * scale}" rx="3" fill="${C[color + "Soft"]}" stroke="${C[color]}" stroke-width="2"/>` +
              t(x + bw / 2, base - value * scale - 12, value, 19, color),
            `${j ? "Reference" : "Pensieve"}, decision ${i + 1}: ${value} Kbps. Values reproduced from ReGuard slide 12.`,
          );
        },
      );
      b += t(center, 391, `Decision ${i + 1}`, 18, "muted");
    }
    b += t(
      w / 2,
      451,
      "Repeated bitrate overshoot",
      compact ? 19 : 23,
      "orange",
    );
    b += t(
      w / 2,
      481,
      "Each pair faces the same network conditions",
      compact ? 17 : 20,
      "muted",
    );
  } else if (step === 2) {
    b += t(
      w / 2,
      30,
      "Match the risky state; bound the next bitrate",
      compact ? 21 : 25,
      "ink",
      "middle",
      500,
    );
    const cw = (w - 40) / 4;
    const labels = [
      "Buffer ≤ p₁₀",
      "Throughput₄ ≤ p₁₀",
      "Delay₃ > p₉₅",
      "NextChunk₃ > p₉₀",
    ];
    for (let i = 0; i < 4; i++) {
      const x = 20 + cw * i,
        center = x + cw / 2;
      let drawing = "";
      if (i === 0)
        drawing =
          box(center - 35, 89, 70, 32, "white", "line", 3) +
          box(center - 35, 89, 10, 32, "redSoft", "red", 3);
      if (i === 1)
        [10, 15, 8, 7].forEach(
          (v, j) =>
            (drawing += box(
              center - 34 + j * 18,
              126 - v,
              12,
              v,
              "redSoft",
              "red",
              1,
            )),
        );
      if (i === 2)
        drawing =
          `<circle cx="${center}" cy="105" r="27" fill="${C.orangeSoft}" stroke="${C.orange}" stroke-width="2"/>` +
          line(center, 105, center, 85, "orange") +
          line(center, 105, center + 17, 112, "orange");
      if (i === 3)
        drawing =
          box(center - 27, 74, 54, 59, "redSoft", "red", 3) +
          `<path d="M${center - 8} 88l23 15-23 15Z" fill="${C.red}"/>`;
      b += tip(
        drawing +
          t(
            center,
            164,
            compact
              ? ["Low buffer", "Low throughput", "Long delay", "Large chunk"][i]
              : labels[i],
            17,
            "orange",
          ),
        [
          "Playback buffer is at or below its 10th-percentile threshold.",
          "The indexed throughput feature is at or below its 10th-percentile threshold.",
          "The indexed download delay is above its 95th-percentile threshold.",
          "The indexed next-chunk size is above its 90th-percentile threshold.",
        ][i],
      );
      if (i < 3) b += math(x + cw, 111, "∧", 23, "orange", "middle");
    }
    b += arrow(id, w / 2, 192, w / 2, 227, "orange");
    b += math(w / 2, 266, "Bitrate ≤ 750 Kbps", 30, "green", "middle");
    const bw = (w - 40) / 6;
    bitrateChoices.all.forEach((value, i) => {
      const x = 20 + i * bw,
        color = i < 2 ? "green" : "red";
      b += tip(
        chip(x, 312, bw - 6, value, color) +
          (i > 1
            ? line(x + 7, 319, x + bw - 13, 344, "red")
            : t(x + (bw - 6) / 2, 384, "✓", 26, "green")),
        `${value} Kbps: ${i < 2 ? "allowed" : "excluded"} when all four learned conditions match.`,
      );
    });
    b += t(
      w / 2,
      430,
      "300 or 750 Kbps remains available",
      compact ? 22 : 25,
      "green",
    );
    b += t(
      w / 2,
      473,
      "The guard intervenes only when the condition matches.",
      compact ? 17 : 20,
      "muted",
    );
  } else {
    const lx = w * 0.24,
      rx = w * 0.76;
    b += t(lx, 38, "Test current protection", compact ? 18 : 22, "ink");
    b += tip(
      shield(lx, 65, 0.8),
      "Search against the protected controller to expose failures that the current rules still miss.",
    );
    b += t(rx, 38, "Find another failure", compact ? 18 : 22, "ink");
    b += line(rx - 73, 145, rx + 68, 145);
    b += `<path d="M${rx - 72} 85h36v53h35v-17h33v8h34" fill="none" stroke="${C.red}" stroke-width="3"/>`;
    b += tip(
      `<circle cx="${rx + 3}" cy="130" r="21" fill="none" stroke="${C.red}" stroke-width="2" stroke-dasharray="4 3"/>`,
      "A newly discovered network scenario exposes a risky controller action.",
    );
    b += arrow(id, lx + 58, 111, rx - 81, 111) + arrow(id, rx, 165, rx, 265);
    b += t(rx, 425, "Keep all trajectories", compact ? 18 : 22, "ink");
    for (let i = 2; i >= 0; i--) {
      const x = rx - 57 - i * 7,
        y = 287 + i * 16;
      b +=
        box(x, y, 112, 58, "white", "line", 4) +
        `<path d="M${x + 10} ${y + 39}l22-16 23 8 24-19 22 4" fill="none" stroke="${C[i ? "blue" : "red"]}" stroke-width="2"/>`;
    }
    b += arrow(id, rx - 85, 328, lx + 68, 328);
    b += t(lx, 425, "Relearn the rule set", compact ? 18 : 22, "ink");
    b += tip(
      box(lx - 45, 280, 90, 99, "orangeSoft", "orange", 3) +
        math(lx, 319, "φ ⇒ a", 27, "orange", "middle") +
        math(lx, 354, "ψ ⇒ b", 27, "orange", "middle"),
      "NetNomos relearns a coherent rule set from every accumulated risky trajectory, rather than appending independent patches.",
    );
    b += arrow(id, lx, 268, lx, 173);
    b += t(
      w / 2,
      479,
      "Retest → accumulate evidence → relearn",
      compact ? 21 : 25,
      "muted",
    );
  }
  return svg(
    id,
    w,
    510,
    `${steps.reguard[step].label}. ${steps.reguard[step].text}`,
    b,
  );
}

export function guardDiagram(name = "pensieve", on = true, compact = false) {
  const w = compact ? 520 : 760,
    id = "guard";
  let b = "";
  if (name === "sage") {
    const left = 46,
      right = w - 25,
      span = right - left;
    const x = (v) => left + v * span,
      y = (v) => 250 - v * 140;
    b +=
      t(24, 30, "Sending window", 22, "ink", "start") +
      t(w - 25, 30, "Schematic", 16, "muted", "end");
    b += box(x(0.26), 58, span * 0.17, 206, "orangeSoft", "orange", 0);
    b +=
      t(x(0.345), 85, "Drop", 17, "orange") +
      t(x(0.73), 85, "Capacity recovers", 18, "muted");
    b += line(left, 250, right, 250);
    const learned = `M${x(0)} ${y(0.75)}L${x(0.26)} ${y(0.85)}L${x(0.28)} ${y(0.06)}L${x(0.43)} ${y(0.08)}L${x(0.7)} ${y(0.2)}L${x(1)} ${y(0.34)}`;
    const corrected = `M${x(0)} ${y(0.75)}L${x(0.26)} ${y(0.85)}L${x(0.28)} ${y(0.06)}L${x(0.43)} ${y(0.08)}L${x(0.56)} ${y(0.72)}L${x(0.68)} ${y(0.86)}L${x(1)} ${y(0.86)}`;
    b += `<path d="${learned}" fill="none" stroke="${C.red}" stroke-width="3" ${on ? 'stroke-dasharray="5 5"' : ""}/>`;
    if (on)
      b += `<path class="diagram-draw" d="${corrected}" fill="none" stroke="${C.green}" stroke-width="3.5"/>`;
    b += tip(
      `<circle cx="${x(0.7)}" cy="${y(0.2)}" r="13" fill="${C.redSoft}" stroke="${C.red}" stroke-width="2"/>`,
      "Sage keeps the sending window small after capacity returns. The documented failure leaves achievable throughput unused.",
    );
    if (on)
      b += tip(
        arrow(id, x(0.7), y(0.2) - 20, x(0.7), y(0.86) + 10, "green"),
        "ReGuard permits a bounded increase when its learned conditions match. The larger sending window helps use the recovered capacity.",
      );
    b +=
      t(x(0.11), 283, "Before drop", 17, "muted") +
      t(x(0.7), 283, "Recovery", 17, "muted");
    b += t(24, 329, "Packets in flight", 18, "muted", "start");
    const bw = (w - 65) / 10;
    for (let i = 0; i < 10; i++)
      b += box(
        25 + i * bw,
        350,
        bw - 7,
        25,
        i < (on ? 7 : 2) ? (on ? "greenSoft" : "redSoft") : "white",
        i < (on ? 7 : 2) ? (on ? "green" : "red") : "line",
        3,
      );
    b += t(
      w / 2,
      416,
      on
        ? "Solid: protected    ·    Dashed: unprotected"
        : "Unprotected: recovered capacity stays unused",
      compact ? 17 : 20,
      on ? "green" : "red",
    );
  } else {
    const healthy = name === "normal";
    b += t(
      25,
      32,
      healthy
        ? "Adequate bandwidth and buffer"
        : "Sparse bandwidth and a low playback buffer",
      compact ? 20 : 24,
      "ink",
      "start",
    );
    b += t(
      25,
      77,
      "Pensieve · 1850 Kbps",
      22,
      healthy ? "blue" : "red",
      "start",
    );
    b += videoScene(28, 86, w - 65, 1850, !healthy, healthy);
    b += line(24, 229, w - 24, 229);
    const corrected = on && !healthy;
    b += t(
      25,
      272,
      healthy
        ? "Rule abstains · 1850 Kbps"
        : corrected
          ? "Protected · 300 Kbps"
          : "Unprotected · 1850 Kbps",
      22,
      healthy ? "blue" : corrected ? "green" : "red",
      "start",
    );
    b += videoScene(
      28,
      282,
      w - 65,
      corrected ? 300 : 1850,
      !healthy && !corrected,
      healthy,
      on,
    );
    b += t(
      w / 2,
      460,
      healthy
        ? "1850 → 1850 Kbps"
        : corrected
          ? "1850 → 300 Kbps"
          : "1850 → 1850 Kbps",
      25,
      healthy ? "blue" : corrected ? "green" : "red",
    );
  }
  return svg(
    id,
    w,
    name === "sage" ? 445 : 480,
    `${name === "sage" ? "Sage recovers too slowly after a bandwidth drop." : name === "normal" ? "Normal conditions: the rule abstains." : "Pensieve requests an oversized video chunk on a bottleneck link."} ${on ? "Protection on." : "Protection off."}`,
    b,
  );
}

export const steps = {
  lejit: [
    { label: "Propose", text: "The LLM proposes candidate tokens." },
    {
      label: "Mask",
      text: "The SMT solver supplies the feasible choices. LeJIT masks invalid tokens before selection.",
    },
    {
      label: "Select",
      text: "The LLM chooses from the allowed tokens using its learned probabilities.",
    },
    {
      label: "Continue",
      text: "The generated prefix updates the next mask. Generation continues token by token.",
    },
  ],
  zoom2net: [
    {
      label: "Observe",
      text: "Each window averages 20, but an average cannot reveal when a burst occurred. Correlated measurements provide additional clues.",
    },
    {
      label: "Reconstruct",
      text: "The transformer learns correlations to reconstruct detailed traffic. An unconstrained prediction can still disagree with an observed total.",
    },
    {
      label: "Teach with rules",
      text: "Training penalizes violations of known rules. Window 1 now totals 80 instead of 60, but it still falls 20 units short of the measured total.",
    },
    {
      label: "Enforce",
      text: "Constraint enforcement raises the highlighted peak from 40 to 60. The green correction fills the remaining 20-unit gap, so every window totals 100. The dashed trace shows the prediction before enforcement.",
    },
  ],
  pants: [
    {
      label: "Extract features",
      text: "The classifier sees features extracted from packets, such as their average spacing. A test must account for the relationship between those features and real packets.",
    },
    {
      label: "Find a weak spot",
      text: "Adversarial search proposes features likely to mislead the classifier. Some proposed combinations cannot be produced by the attacker.",
    },
    {
      label: "Require realism",
      text: "PANTS selects feature targets and asks a solver for packets that satisfy them. It relaxes infeasible feature targets while retaining the network and attacker constraints.",
    },
    {
      label: "Confirm & train",
      text: "PANTS runs realizable packets through the classifier again. Confirmed failures become training examples that improve robustness.",
    },
  ],
  netnomos: [
    {
      label: "Define grammar Γ",
      text: "The grammar defines typed signals, comparisons, logical connectives, and time windows. It gives NetNomos an expressive but bounded search space.",
    },
    {
      label: "Collect evidence",
      text: "For each candidate clause, NetNomos records the observations where the clause is true. The search can reuse those evidence sets.",
    },
    {
      label: "Find a hitting set",
      text: "A and B together cover every observation. Removing either clause loses coverage. The disjunction A or B is therefore a consistent rule with a minimal selection of clauses.",
    },
    {
      label: "Filter & enforce",
      text: "An LLM grounded in networking texts filters candidate rules for meaning. LeJIT then enforces the selected rules during generation.",
    },
  ],
  reguard: [
    {
      label: "Discover",
      text: "The outer search changes network conditions; the inner search finds a strong reference for the same conditions. The performance gap directs the search toward avoidable failures.",
    },
    {
      label: "Explain",
      text: "Pensieve repeatedly requests a higher bitrate than the reference under the same network conditions. ReGuard uses such counterfactual comparisons to identify risky states and useful action corrections.",
    },
    {
      label: "Protect",
      text: "NetNomos learns conditions for useful corrections. ReGuard enforces those rules during deployment, following LeJIT’s principle of guiding decisions as they are made.",
    },
    {
      label: "Refine",
      text: "The search tests the protected controller for new failures. ReGuard accumulates the resulting trajectories and relearns the protection rules from all the evidence.",
    },
  ],
};
const renderers = { lejit, zoom2net, pants, netnomos, reguard };
export function renderDiagram(name, step = 0, compact = false) {
  return renderers[name](step, compact);
}
