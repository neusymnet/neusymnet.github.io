import { readFile } from "node:fs/promises";

const externalIcon =
  '<svg class="external-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 3h7v7M21 3 10 14M10 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-4"/></svg>';
const escape = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const authorList = (names) =>
  names.length <= 2
    ? names.join(" and ")
    : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;

export const loadPapers = async () =>
  JSON.parse(await readFile("papers.json", "utf8"));

// Writes papers.json with one key per line, matching the hand-edited layout.
export const formatPapers = (lists) =>
  "{\n" +
  Object.entries(lists)
    .map(
      ([name, papers]) =>
        `  "${name}": [\n` +
        papers
          .map((paper) => "    " + JSON.stringify(paper, null, 2).replace(/\n/g, "\n    "))
          .join(",\n") +
        "\n  ]",
    )
    .join(",\n") +
  "\n}\n";

export const normalizeTitle = (title) => title.toLowerCase().replace(/[^a-z0-9]/g, "");

export const renderPaper = (paper) =>
  [
    "          <li>",
    `            <div class="paper-meta">${escape(paper.venue)}</div>`,
    `            <h3><a href="${escape(paper.url)}">${escape(paper.title)}&nbsp;${externalIcon}</a></h3>`,
    `            <p><strong>${escape(authorList(paper.authors))}</strong></p>`,
    ...(paper.note ? [`            <p>${escape(paper.note)}</p>`] : []),
    ...(paper.links ?? []).map(
      (link) =>
        `            <a class="resource" href="${escape(link.url)}">${escape(link.label)}${
          link.url.startsWith("#")
            ? ' <span aria-hidden="true">↑</span>'
            : `&nbsp;${externalIcon}`
        }</a>`,
    ),
    "          </li>",
  ].join("\n");

// Compares markup while ignoring line wrapping, so hand-formatted entries that
// still match papers.json are kept verbatim instead of being regenerated.
const normalize = (markup) =>
  markup.replace(/\s+/g, " ").replace(/\s*>\s*/g, ">").replace(/\s*</g, "<").trim();

export const renderPaperList = (papers, existing = "") => {
  const kept = new Map(
    (existing.match(/^ *<li>[\s\S]*?<\/li>/gm) ?? []).map((li) => [normalize(li), li]),
  );
  return (
    "\n" +
    papers
      .map((paper) => {
        const rendered = renderPaper(paper);
        return kept.get(normalize(rendered)) ?? rendered;
      })
      .join("\n") +
    "\n          "
  );
};

export const isPreprint = (paper) => /^preprint\b/i.test(paper.venue);

// Each list renders as two blocks derived from the venue, so an accepted
// preprint moves sections by editing its venue alone.
const groups = {
  published: (paper) => !isPreprint(paper),
  preprints: isPreprint,
};

export const injectPapers = (html, lists) => {
  for (const [list, papers] of Object.entries(lists))
    for (const [group, belongs] of Object.entries(groups)) {
      const name = `${list}:${group}`;
      const start = `<!-- papers:${name} -->`,
        end = `<!-- /papers:${name} -->`;
      const pattern = new RegExp(`${start}([\\s\\S]*?)${end}`);
      if (!pattern.test(html)) throw new Error(`Missing ${start} in the page`);
      html = html.replace(
        pattern,
        (_, existing) => start + renderPaperList(papers.filter(belongs), existing) + end,
      );
    }
  return html;
};
