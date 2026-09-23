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
  for (let i = 0; i < 4; i++)
    for (const compact of [false, true]) {
      const svg = renderDiagram(name, i, compact);
      assert.ok(svg.includes("<title"));
      assert.ok(!svg.includes("NaN"));
    }
const html = await readFile("index.html", "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
assert.equal(ids.length, new Set(ids).size, "Every element ID must be unique");
for (const [, id] of html.matchAll(/href="#([^"]+)"/g))
  assert.ok(ids.includes(id), `Missing fragment ${id}`);
for (const name of Object.keys(steps))
  assert.ok(
    html.includes(`<!-- visual:${name} --><svg`),
    "Static diagrams must exist before JavaScript runs",
  );
assert.ok(!html.includes("text-transform:uppercase"));
console.log(
  "Passed: exhaustive token completions, rules, timing constraints, telemetry totals, every diagram state, anchors, and static fallbacks.",
);
