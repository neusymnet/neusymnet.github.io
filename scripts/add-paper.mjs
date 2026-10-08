// Adds a paper from a "Suggest a paper" issue form to papers.json.
// Reads the issue body from ISSUE_BODY and the issue number from ISSUE_NUMBER;
// writes a pull request body to PR_BODY_FILE when it is set.
import { appendFile, writeFile } from "node:fs/promises";
import { loadPapers, formatPapers, normalizeTitle } from "./papers.mjs";

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

// Issue forms render each field as "### <label>" followed by the answer.
const fields = Object.fromEntries(
  (process.env.ISSUE_BODY ?? "")
    .replace(/\r\n/g, "\n")
    .split(/^### /m)
    .slice(1)
    .map((section) => {
      const [label, ...rest] = section.split("\n");
      const value = rest.join("\n").trim();
      return [label.trim(), value === "_No response_" ? "" : value];
    }),
);
const field = (label) => fields[label] ?? "";

const title = field("Paper title").replace(/\s+/g, " ");
const url = field("Paper link");
const venue = field("Venue or preprint status and year").replace(/\s+/g, " ");
const authors = field("Authors")
  .split(/\s*(?:,|;|\n|\band\b)\s*/)
  .map((name) => name.trim())
  .filter(Boolean);

if (!title || !url || !venue || !authors.length)
  fail("The issue is missing a title, authors, paper link, or venue.");
if (!/^https?:\/\/\S+$/.test(url)) fail(`The paper link is not an http(s) URL: ${url}`);

const lists = await loadPapers();
const papers = lists.community;
if (papers.some((paper) => normalizeTitle(paper.title) === normalizeTitle(title)))
  fail(`"${title}" is already in papers.json.`);

// The list runs newest first: place the paper before the first entry from an
// earlier year. Order within a year is left for the reviewer to adjust.
const year = (text) => Number(text.match(/\b(19|20)\d{2}\b/)?.[0] ?? 0);
const index = papers.findIndex((paper) => year(paper.venue) < year(venue));
papers.splice(index === -1 ? papers.length : index, 0, { venue, title, url, authors });
await writeFile("papers.json", formatPapers(lists));
console.log(`Added "${title}" (${venue}) at position ${(index === -1 ? papers.length - 1 : index) + 1}.`);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `title=${title}\n`);

if (process.env.PR_BODY_FILE) {
  const quote = (text) => text.replace(/^/gm, "> ");
  await writeFile(
    process.env.PR_BODY_FILE,
    [
      `Adds the paper suggested in #${process.env.ISSUE_NUMBER}.`,
      "",
      "Before merging, check the title, author list, venue wording, link, and position in the list. Add a `note` or `links` if wanted.",
      "",
      "**Relevance (from the issue)**",
      "",
      quote(field("How does this relate to neurosymbolic networking?") || "(none given)"),
      "",
      "**Additional resources (from the issue)**",
      "",
      quote(field("Additional resources") || "(none given)"),
      "",
      `Closes #${process.env.ISSUE_NUMBER}`,
    ].join("\n") + "\n",
  );
}
