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
- `assets/site.js`: playback, token selection, packet checks, clause selection, and runtime-protection controls.
- `references.bib`: independently verified references for the five systems.
- `notes/source-map.md`: the paper and slide sources behind each demonstration.

All diagrams are drawn for the web. Paper figures and slide screenshots are not embedded. The demonstrations explain the research methods with small examples; they do not load research language models or reproduce benchmark evaluations. The numeric checks for token completion, timing constraints, and rule coverage run in the browser.

LeJIT continuously illustrates token proposal, masking, and selection, with pause and restart controls. The other four explanations support direct step selection and playback. Packet positions animate when a timing candidate changes. Controller scenes loop their packet streams continuously; the Pensieve protection switch also adds or removes a shield around the RL controller. Diagram tooltips support hover, keyboard focus, and tap. Reduced-motion preferences replace playback with a single-step control. The article and initial diagrams remain available when JavaScript is disabled.

## Design credit

Overall design inspired by [Clarity](https://github.com/lorenmt/clarity-template) by Shikun Liu. The implementation and diagrams were written afresh after the earlier prototype was discarded.
