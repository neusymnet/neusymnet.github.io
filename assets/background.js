const stages = [
  ["AI works well", "AI promises to automate network management."],
  ["A mistake appears", "AI can make mistakes that violate network knowledge."],
  [
    "Add network knowledge",
    "A neurosymbolic approach incorporates network knowledge into AI.",
  ],
];
const examples = [
  {
    name: "Telemetry imputation",
    notes: [
      "Recovers fine grained measurements from their coarse counterparts.",
      "The neural predictor outputs values that conflict with its input",
      "Knowledge constrains the reconstruction to match the observed totals",
    ],
    foot: [
      "+ less measurement overhead\n+ better debugging and history",
      "Imputed bytes do not add up to the coarse total they came from.",
      "Imputed bytes should add up to the coarse total they came from.",
    ],
  },
  {
    name: "Congestion control",
    notes: [
      "Adapts sending rates to changing network conditions.",
      "Sender stays slow long after the network recovers",
      "A protection rule helps the sender recover when bandwidth returns",
    ],
    foot: [
      "+ higher throughput, lower latency\n+ less manual tuning",
      "After a bandwidth drop, Sage needs about 20 s to recover; BBR needs 1 to 2 s.",
      "When validated recovery conditions hold, increase the sending rate to use available capacity.",
    ],
  },
  {
    name: "Traffic classification",
    notes: [
      "Identify applications from traffic metadata.",
      "The neural classifier mistakes delayed traffic for a different application",
      "Knowledge-guided training preserves the application label in this example",
    ],
    foot: [
      "+ no payload inspection\n+ QoS and anomaly detection",
      "A small delay flips the label, though it is the same application.",
      "A flow under congestion is still the same application",
    ],
  },
];
const fineGood = [
  25, 50, 32, 42, 35, 100, 60, 80, 40, 45, 40, 20, 30, 10, 25, 80, 46, 62, 55,
  57,
];
const fineBad = [
  25, 50, 32, 42, 35, 108, 118, 114, 103, 57, 2, 1, 3, 1, 2, 80, 46, 62, 55, 57,
];
const svg = (id, title, body) =>
  `<svg viewBox="0 0 330 230" role="img" aria-labelledby="bg-${id}-title"><title id="bg-${id}-title">${title}</title>${body}</svg>`;
function telemetry() {
  const baseline = 178;
  return svg(
    "telemetry",
    "Four coarse measurements become four windows of fine-grained measurements. In the failure state, the middle windows violate the observed totals.",
    '<path d="M8 180H322" stroke="#a5b5bd" stroke-width="2"/>' +
      [52, 100, 40, 80]
        .map(
          (v, i) =>
            `<rect x="${14 + i * 23}" y="${baseline - v}" width="17" height="${v}" fill="#7f99ae"/>`,
        )
        .join("") +
      '<path d="M111 124H140m-9-7 10 7-10 7" fill="none" stroke="#327762" stroke-width="3"/>' +
      [52, 100, 40, 80]
        .map(
          (v, i) =>
            `<rect x="${151 + i * 42}" y="${baseline - v}" width="40" height="${v}" fill="none" stroke="#a5b5bd" stroke-width="1.5" stroke-dasharray="3 3"/>`,
        )
        .join("") +
      fineGood
        .map(
          (v, i) =>
            `<rect class="bg-bar" data-bg-bar="${i}" x="${152 + i * 8.4}" width="5.8" style="y:${baseline - v}px;height:${v}px" fill="#327762"/>`,
        )
        .join("") +
      '<text class="bg-coarse-label" x="9" y="219">coarse → fine-grained</text><text class="bg-impossible-label" x="9" y="219">impossible given the input</text><g class="bg-enforced"><text x="9" y="219">✓ totals match the measurements</text></g>',
  );
}
function control() {
  return svg(
    "control",
    "Sage sending rate and a dashed BBR reference after a bandwidth drop. The failure example recovers slowly even after bandwidth returns.",
    '<path d="M9 79H109V159H181V79H321V179H9Z" fill="#e1e8ed"/><path d="M9 180H321" stroke="#a5b5bd" stroke-width="2"/>' +
      '<path class="bg-rate-good" d="M9 94Q39 84 108 85L115 160H181L186 86H321"/>' +
      '<path class="bg-rate-protected" d="M9 94Q39 84 108 87L115 174H179Q193 91 213 89H321"/>' +
      '<path class="bg-bbr" d="M9 94Q39 84 108 85L115 160H181L189 86H321"/>' +
      '<path class="bg-rate-bad" d="M9 94Q39 84 108 87L115 174Q165 174 200 166T321 143"/>' +
      '<path class="bg-gap" d="M253 90V155" stroke="#b65343" stroke-width="2" stroke-dasharray="3 3"/>' +
      '<text class="bg-track-label" x="9" y="219">tracks the available bandwidth</text><g class="bg-legend"><path d="M9 212H30" stroke="#b65343" stroke-width="3"/><text x="40" y="218">Sage</text><path d="M92 212H114" stroke="#81939d" stroke-width="3" stroke-dasharray="6 5"/><text x="124" y="218">BBR</text></g><g class="bg-enforced"><path d="M9 212H30" stroke="#327762" stroke-width="3"/><text x="39" y="218">Protected</text><path d="M155 212H176" stroke="#b65343" opacity=".45" stroke-dasharray="4 4"/><text x="186" y="218">Original</text></g>',
  );
}
function classification() {
  const xs = [
    16, 31, 43, 69, 82, 94, 123, 136, 162, 174, 186, 213, 225, 239, 257, 270,
  ];
  const heights = [
    40, 74, 27, 81, 48, 23, 78, 35, 67, 32, 61, 74, 40, 30, 81, 53,
  ];
  return svg(
    "classification",
    "Encrypted traffic classified as a video call. Two small packet delays incorrectly change the label to web browsing; knowledge-guided training restores the video-call label for this illustrative perturbed flow.",
    '<path d="M9 153H321" stroke="#a5b5bd" stroke-width="2"/>' +
      '<g fill="none" stroke="#71848c" stroke-width="2"><rect x="297" y="65" width="23" height="19" rx="2"/><path d="M302 65V59a7 7 0 0 1 14 0v6"/></g>' +
      xs
        .map(
          (x, i) =>
            `<rect class="bg-packet ${i === 2 || i === 13 ? "bg-packet-shift" : ""}" x="${x}" y="${152 - heights[i]}" width="7" height="${heights[i]}" fill="#327762"/>`,
        )
        .join("") +
      '<g class="bg-perturb" fill="none" stroke="#b65343" stroke-width="1.5"><path d="M43 125h7v27h-7zM239 122h7v30h-7z" stroke-dasharray="2 2"/><path d="M43 165h18m-5-3 5 3-5 3M239 165h18m-5-3 5 3-5 3"/></g>' +
      '<g class="bg-video-label"><rect x="9" y="194" width="112" height="31" rx="15" fill="#327762"/><text x="65" y="215" text-anchor="middle">Video call</text></g>' +
      '<g class="bg-web-label"><rect x="9" y="194" width="151" height="31" rx="15" fill="#b65343"/><text x="84" y="215" text-anchor="middle">Web browsing</text></g>',
  );
}
export function renderBackground() {
  return `<div class="background-story" data-bg-stage="0" data-bg-case="0">
    <div class="bg-controls" hidden><div class="bg-stages" role="group" aria-label="Explanation stage">${stages.map((s, i) => `<button type="button" data-bg-step="${i}" aria-pressed="${i === 0}"><span>0${i + 1}</span> ${s[0]}</button>`).join("")}</div><button class="bg-play" type="button" aria-pressed="false">Play ▷</button></div>
    <p class="bg-narration" aria-live="polite">${stages[0][1]}</p>
    <div class="bg-cases" role="group" aria-label="Choose use case" hidden>${examples.map((e, i) => `<button type="button" data-bg-case-button="${i}" aria-pressed="${i === 0}">${e.name}</button>`).join("")}</div>
    <div class="bg-panels">${examples.map((e, i) => `<article class="bg-panel" data-bg-panel="${i}"><h3>${e.name}</h3><div class="bg-panel-body"><p class="bg-note">${e.notes[0]}</p>${[telemetry, control, classification][i]()}<p class="bg-outcome">${e.foot[0]}</p></div></article>`).join("")}</div>
    <p class="bg-disclaimer">Illustrative examples, not measured results.</p>
  </div>`;
}
function mountBackground() {
  const root = document.querySelector(".background-story");
  if (!root) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const play = root.querySelector(".bg-play");
  const narration = root.querySelector(".bg-narration");
  let current = 0;
  let timer;
  let wantsPlayback = true;
  let visible = !("IntersectionObserver" in window);
  root.classList.add("is-enhanced");
  root.querySelector(".bg-controls").hidden = false;
  root.querySelector(".bg-cases").hidden = false;

  function render(step) {
    current = step;
    root.dataset.bgStage = step;
    narration.textContent = stages[step][1];
    root
      .querySelectorAll("[data-bg-step]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(Number(button.dataset.bgStep) === step),
        ),
      );
    root.querySelectorAll(".bg-panel").forEach((panel, i) => {
      panel.querySelector(".bg-note").textContent = examples[i].notes[step];
      panel.querySelector(".bg-outcome").textContent = examples[i].foot[step];
      panel.querySelector("svg title").textContent =
        examples[i].notes[step] + ". " + examples[i].foot[step];
    });
    root.querySelectorAll("[data-bg-bar]").forEach((bar, i) => {
      const value = (step === 1 ? fineBad : fineGood)[i];
      bar.style.y = `${178 - value}px`;
      bar.style.height = `${value}px`;
      bar.style.fill = step === 1 && i >= 5 && i < 15 ? "#b65343" : "#327762";
    });
  }
  function syncPlayback() {
    clearInterval(timer);
    timer = undefined;
    const running =
      wantsPlayback && visible && !document.hidden && !motion.matches;
    play.setAttribute("aria-pressed", String(running));
    play.textContent = motion.matches
      ? "Next step →"
      : running
        ? "Pause Ⅱ"
        : "Play ▷";
    play.setAttribute(
      "aria-label",
      motion.matches
        ? "Show the next introductory slide"
        : running
          ? "Pause introductory slides"
          : "Play introductory slides",
    );
    narration.setAttribute("aria-live", running ? "off" : "polite");
    root.classList.toggle("is-playing", running);
    if (running)
      timer = setInterval(() => render((current + 1) % stages.length), 6500);
  }
  root.querySelectorAll("[data-bg-step]").forEach((button) =>
    button.addEventListener("click", () => {
      wantsPlayback = false;
      syncPlayback();
      render(Number(button.dataset.bgStep));
    }),
  );
  root.querySelectorAll("[data-bg-case-button]").forEach((button) =>
    button.addEventListener("click", () => {
      root.dataset.bgCase = button.dataset.bgCaseButton;
      root
        .querySelectorAll("[data-bg-case-button]")
        .forEach((other) =>
          other.setAttribute("aria-pressed", String(other === button)),
        );
    }),
  );
  play.addEventListener("click", () => {
    if (motion.matches) {
      wantsPlayback = false;
      render((current + 1) % stages.length);
    } else {
      wantsPlayback = !timer;
    }
    syncPlayback();
  });
  motion.addEventListener("change", syncPlayback);
  document.addEventListener("visibilitychange", syncPlayback);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        visible =
          entries[0].isIntersecting && entries[0].intersectionRatio >= 0.15;
        syncPlayback();
      },
      { threshold: [0, 0.15] },
    );
    observer.observe(root.querySelector(".bg-panels"));
  }
  syncPlayback();
}
if (typeof document !== "undefined") mountBackground();
