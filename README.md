# The Future of Network Management is Neurosymbolic

Interactive research demonstrations for Neurosymbolic Networking. The site follows the draft’s chapter titles and the accompanying Notion brief. The design draws on Clarity’s restrained typography and research-page layout.

## Preview

```sh
npm run dev
```

Open http://127.0.0.1:4175. Set `PORT` to use another port. No package installation is needed; the site uses browser APIs and Node’s standard library.

## Build and check

```sh
npm run build
npm run check
```

The build refreshes the static diagram fallbacks in `index.html` and produces `dist/`. The root site can also be served directly. Asset URLs are relative, so the site works both at a domain root and under a project path. `.nojekyll` supports GitHub Pages hosting. No deployment has been performed.

## Edit

- `index.html`: manuscript-based prose, headings, paper links, and accessible fallbacks.
- `assets/site.css`: responsive layout, typography, and animation styles.
- `assets/diagrams.js`: original SVG renderers, explanatory stages, and small rule-checking functions.
- `assets/research-diagrams.js`: Autogram and TypoNet diagrams, including grammar expansion, evidence filtering, and counterexample loops.
- `assets/background.js`: the three introductory slides, which cycle automatically while visible.
- `assets/site.js`: playback, token selection, packet checks, clause selection, and runtime-protection controls.
- `references.bib`: independently verified references for the research papers and the community reading list.
- `notes/source-map.md`: the paper and slide sources behind each demonstration.

All diagrams are drawn for the web. Paper figures and slide screenshots are not embedded. The demonstrations explain the research methods with small examples; they do not load research language models or reproduce benchmark evaluations. The numeric checks for token completion, timing constraints, and rule coverage run in the browser.

The Testing chapter also includes “No Hyperscaler? No Problem. Your Students also Break (and Fix) Networks.” A four-stage walkthrough redraws Figure 1: two student sessions, name resolution, action abstraction, and template matching. The final view aligns the unordered setup commands while preserving the successful probe as an anchor. Playback, direct step selection, command tooltips, and a stacked mobile layout use the existing diagram controls. The paper is linked in Papers & resources with its full author list.

LeJIT continuously illustrates token proposal, masking, and selection, with pause and restart controls. The other explanations support direct step selection and playback. Autogram and TypoNet each have two animations based on Figures 1 and 2 of their papers. Packet positions animate when a timing candidate changes. Controller scenes loop their packet streams continuously; the Pensieve protection switch also adds or removes a shield around the RL controller. Diagram tooltips support hover, keyboard focus, and tap. Reduced-motion preferences replace playback with a single-step control. The article and initial diagrams remain available when JavaScript is disabled.

## Design credit

Overall design inspired by [Clarity](https://github.com/lorenmt/clarity-template) by Shikun Liu. The implementation and diagrams were written afresh after the earlier prototype was discarded.

## Autogram and TypoNet sources

- [Autogram paper](https://hhy.ee.princeton.edu/papers/2026_hotnets_autogram.pdf), Figures 1–2 and Section 3: grammar-bounded discovery, re-induction, logical screening, data-derived tolerance, and calibration on synthetic proxies. The grammar panel is abbreviated; candidate positions and residual dots are illustrative.
- [TypoNet paper](https://hhy.ee.princeton.edu/papers/2026_preprint_typonet.pdf), Figures 1–2 and Section 3: translation into a symbolic model, independent validation, a reusable foundation, and task specialization through emulated faults. The three-router topology and forwarding rule are simplified examples, not evaluation traces.
- Autogram’s LLM receives metadata. Telemetry reaches the evaluator. TypoNet’s production sources are read-only; fault injection occurs in emulation. Solver answers are relative to the current symbolic model and its validation evidence.
- An independent citation reviewer verified both new titles, author lists, identifiers, and July 24, 2026 submission dates against arXiv and the PDFs. Autogram’s HotNets 2026 status follows the author’s instruction. The resource list retains venue-date ordering and dates TypoNet by its preprint release.

## Community contributions

The Contribute section links to public GitHub issue forms in `.github/ISSUE_TEMPLATE/` for data/applications, research questions, and paper suggestions. GitHub Issues must be enabled for this repository; the forms become available after they are pushed to the default branch.

The Community reading list precedes the final Contribute & collaborate section in both the page and its navigation. It lists MeshAgent, APEX, TraceCodec, Eywa, Canopy, Kepler, PLUME, Agent-C, CEGS, NetDiffusion, and whiRL from newest to oldest, with full author lists, primary paper links, and brief relevance notes. MeshAgent and NetDiffusion use their SIGMETRICS conference years in the list; their BibTeX entries describe the full POMACS articles.

Repository maintainers review paper suggestions for a clear connection between networking, learning, and explicit knowledge or reasoning. Published papers and public preprints from any group are eligible; authors may suggest their own work. Check for duplicates and verify title, authors, publication status, year, and the primary paper link. Add accepted entries to `#community-papers` in `index.html` with a concise relevance note and citation link. Keep papers behind the existing demos in their current list. Link to the website change when closing an accepted issue, or explain the scope decision for other submissions. Submissions are not published automatically.

For data or application proposals, acknowledge the task and discuss access conditions before requesting data. Questions can remain open for discussion or link to related work. No automated response or review turnaround is promised.

## Discover, codify, enforce

The masthead presents discover, codify, and enforce as the common methodology. A dedicated section maps these stages to generation, control, and testing, following slide 18 of the supplied `v7.pdf` deck. The introductory animations follow the masthead without a separate Background heading or introduction.

The three introductory slides autoplay every 3.5 seconds while their diagrams are visible. Research demonstrations advance every 2.4 seconds, and LeJIT illustrates a token choice every 1.7 seconds. Readers can pause or select a slide; a manual pause persists after scrolling away and back. Reduced-motion preferences keep the slides under manual control.

The decorative hero artwork combines formal logic with statistical learning. The built-in image-generation tool created `assets/hero-logic-brain.png` from the supplied visual reference; its prompt is saved in `assets/hero-logic-brain.prompt.txt`. A dark overlay preserves text contrast.
