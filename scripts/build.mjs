import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { renderBackground } from "../assets/background.js";
import {
  renderDiagram,
  steps,
  guardDiagram,
  packetDiagram,
} from "../assets/diagrams.js";
import { loadPapers, injectPapers } from "./papers.mjs";
let html = await readFile("index.html", "utf8");
html = injectPapers(html, await loadPapers());
html = html.replace(/<!-- background-story -->[\s\S]*?<!-- \/background-story -->/, `<!-- background-story -->${renderBackground()}<!-- /background-story -->`);
for (const name of Object.keys(steps)) {
  const start = `<!-- visual:${name} -->`,
    end = `<!-- /visual:${name} -->`;
  html = html.replace(
    new RegExp(`${start}[\\s\\S]*?${end}`),
    start + renderDiagram(name, 0, false) + end,
  );
}
html = html.replace(
  /<div id="guard-visual" class="guard-visual">[\s\S]*?<\/div>/,
  '<div id="guard-visual" class="guard-visual">' + guardDiagram() + "</div>",
);
html = html.replace(
  /<!-- packets -->[\s\S]*?<!-- \/packets -->/,
  "<!-- packets -->" + packetDiagram() + "<!-- /packets -->",
);
html = html.replace(
  '<div id="rule-evidence" class="rule-evidence"></div>',
  '<div id="rule-evidence" class="rule-evidence">' +
    Array.from(
      { length: 5 },
      (_, i) =>
        `<div class="observation covered">Sample ${i + 1}<small>${i === 1 || i === 2 ? "A" : "B"} ✓</small></div>`,
    ).join("") +
    "</div>",
);
await writeFile("index.html", html);
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const file of ["index.html", "references.bib", ".nojekyll"])
  await cp(file, `dist/${file}`);
await cp("assets", "dist/assets", { recursive: true });
console.log(
  "Built static site in dist/. Root index.html also works without a build server.",
);
