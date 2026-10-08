import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  validNext,
  feasibleValues,
  digitOptions,
  coverage,
  packetTimes,
  checkPackets,
  renderDiagram,
  steps,
  fineTraces,
  lejitTokenFrame,
} from "../assets/diagrams.js";
import { loadPapers, injectPapers, normalizeTitle } from "./papers.mjs";
let paths = [""];
for (let digit = 0; digit < 2; digit++)
  paths = paths.flatMap((prefix) =>
    digitOptions(prefix).map((next) => prefix + next),
  );
assert.deepEqual(
  paths.map(Number).sort((a, b) => a - b),
  feasibleValues,
);
assert.equal(feasibleValues.length, 22);
for (const value of feasibleValues) {
  assert.equal(validNext(value), true);
  assert.equal(60 + value + (40 - value), 100);
  assert.ok(Math.max(value, 40 - value) >= 30);
}
for (const value of [-1, 11, 20, 29, 41, 70, 3.5, NaN])
  assert.equal(validNext(value), false);
assert.deepEqual(digitOptions(""), ["0", "1", "3", "4"]);
assert.deepEqual(digitOptions("4"), ["0"]);
assert.deepEqual(digitOptions("39"), []);
for (let cursor = 0; cursor < 40; cursor++) {
  const frame = lejitTokenFrame(cursor);
  assert.equal(
    frame.record.reduce((a, b) => a + b, 0),
    100,
  );
  assert.ok(frame.record.every((v) => v >= 0 && v <= 60));
  assert.ok(frame.record.some((v) => v >= 30));
  assert.equal(frame.candidates.filter((c) => c.selected).length, 1);
  assert.ok(frame.candidates.find((c) => c.selected).allowed);
  assert.equal(
    frame.emitted + frame.chosen,
    frame.record
      .map((v) => String(v).padStart(2, "0"))
      .join("")
      .slice(0, frame.position + 1),
  );
}
assert.equal(coverage(["a", "b"]).minimal, true);
assert.equal(coverage(["a", "b", "c"]).minimal, false);
assert.equal(coverage(["a", "c"]).complete, false);
assert.equal(checkPackets(packetTimes.early).delay, false);
assert.equal(checkPackets(packetTimes.late).budget, false);
assert.deepEqual(checkPackets(packetTimes.valid), {
  delay: true,
  order: true,
  budget: true,
});
for (let i = 0; i < 3; i++)
  assert.equal(
    fineTraces[2].slice(i * 5, (i + 1) * 5).reduce((a, b) => a + b, 0),
    100,
  );
for (const name of Object.keys(steps))
  for (let i = 0; i < steps[name].length; i++)
    for (const compact of [false, true]) {
      const svg = renderDiagram(name, i, compact);
      assert.ok(svg.includes("<title"));
      assert.ok(!svg.includes("NaN"));
    }
const pages = {};
for (const page of ["index.html", "reading-list.html"]) {
  const markup = await readFile(page, "utf8");
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
  assert.equal(ids.length, new Set(ids).size, `${page}: every element ID must be unique`);
  pages[page] = { markup, ids };
}
// Checks in-page fragments and links between the two pages.
for (const [page, { markup }] of Object.entries(pages))
  for (const [, target = page, id] of markup.matchAll(/href="((?:index|reading-list)\.html)?(?:#([^"]+))?"/g))
    if (id) assert.ok(pages[target].ids.includes(id), `${page}: missing fragment ${target}#${id}`);
const html = pages["index.html"].markup;
for (const name of Object.keys(steps))
  assert.ok(
    html.includes(`<!-- visual:${name} --><svg`),
    "Static diagrams must exist before JavaScript runs",
  );
assert.ok(!html.includes("text-transform:uppercase"));
const papers = await loadPapers();
const bib = await readFile("references.bib", "utf8");
const bibKeys = [...bib.matchAll(/^@\w+\{([^,\s]+),/gm)].map((m) => m[1]);
assert.equal(bibKeys.length, new Set(bibKeys).size, "references.bib has a duplicate key");
const seen = new Set();
for (const paper of Object.values(papers).flat()) {
  const label = paper.title;
  for (const field of ["venue", "title", "url"])
    assert.ok(paper[field], `${label}: missing ${field}`);
  assert.ok(paper.authors?.length, `${label}: missing authors`);
  for (const { url } of [paper, ...(paper.links ?? [])])
    assert.match(url, /^(https?:\/\/|#)/, `${label}: link must be http(s) or #fragment`);
  for (const id of [paper.url, normalizeTitle(paper.title)]) {
    assert.ok(!seen.has(id), `${label}: duplicate paper (${id})`);
    seen.add(id);
  }
}
const readingList = pages["reading-list.html"].markup;
assert.equal(
  injectPapers(readingList, papers),
  readingList,
  "reading-list.html is out of date with papers.json; run npm run build",
);
console.log(
  "Passed: exhaustive token completions, rules, timing constraints, telemetry totals, every diagram state, anchors, and static fallbacks.",
);
