import {
  steps,
  renderDiagram,
  packetTimes,
  checkPackets,
  samples,
  coverage,
  guardDiagram,
  packetDiagram,
  lejitDiagram,
} from "./diagrams.js";

const compact = matchMedia("(max-width: 600px)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const controllers = [];
const setPressed = (buttons, predicate) =>
  buttons.forEach((button) =>
    button.setAttribute("aria-pressed", String(predicate(button))),
  );

function renderVisual(container, markup) {
  const previous = new Map(
    [...container.querySelectorAll("[data-packet-key], [data-morph]")].map(
      (el) => [
        el.dataset.packetKey || el.dataset.morph,
        el.getAttribute(el.dataset.packetKey ? "transform" : "d"),
      ],
    ),
  );
  container.innerHTML = markup;
  if (reducedMotion.matches) return;
  for (const el of container.querySelectorAll(
    "[data-packet-key], [data-morph]",
  )) {
    const before = previous.get(el.dataset.packetKey || el.dataset.morph);
    if (!before) continue;
    if (el.dataset.packetKey) {
      const beforeX = Number(before.match(/translate\(([-.0-9]+)/)[1]);
      const afterX = Number(
        el.getAttribute("transform").match(/translate\(([-.0-9]+)/)[1],
      );
      el.animate(
        [
          { transform: `translateX(${beforeX}px)` },
          { transform: `translateX(${afterX}px)` },
        ],
        { duration: 850, easing: "cubic-bezier(.25,.7,.2,1)" },
      );
    } else {
      el.animate(
        [{ d: `path("${before}")` }, { d: `path("${el.getAttribute("d")}")` }],
        { duration: 900, easing: "ease-in-out" },
      );
    }
  }
}

for (const figure of document.querySelectorAll("[data-demo]")) {
  const name = figure.dataset.demo;
  const visual = figure.querySelector("[data-visual]");
  const narration = figure.querySelector("[data-narration]");
  const navigation = figure.querySelector(".step-nav");
  const playButton = figure.querySelector("[data-play]");
  let current = 0;
  let timer;
  const buttons = steps[name].map((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<span aria-hidden="true">0${index + 1}</span>${step.label}`;
    button.addEventListener("click", () => {
      pause();
      render(index);
    });
    navigation.append(button);
    return button;
  });
  function render(index) {
    current = index;
    figure.dataset.step = index;
    renderVisual(visual, renderDiagram(name, current, compact.matches));
    narration.textContent = steps[name][current].text;
    setPressed(buttons, (button) => buttons.indexOf(button) === current);
  }
  function pause(stopMotion = true) {
    clearInterval(timer);
    if (stopMotion)
      visual
        .querySelectorAll(".flow-packet")
        .forEach((element) =>
          element.getAnimations().forEach((animation) => animation.pause()),
        );
    timer = undefined;
    figure.classList.remove("is-playing");
    playButton.textContent = reducedMotion.matches ? "Next step →" : "Play ▷";
    playButton.setAttribute(
      "aria-label",
      `${reducedMotion.matches ? "Next step in" : "Play"} ${name === "pants" ? "PANTS" : name} explanation`,
    );
    playButton.setAttribute("aria-pressed", "false");
  }
  playButton.addEventListener("click", () => {
    if (timer) {
      pause();
      return;
    }
    if (reducedMotion.matches) {
      render((current + 1) % steps[name].length);
      return;
    }
    if (current === steps[name].length - 1) render(0);
    visual
      .querySelectorAll(".flow-packet")
      .forEach((element) =>
        element.getAnimations().forEach((animation) => animation.play()),
      );
    playButton.textContent = "Pause Ⅱ";
    figure.classList.add("is-playing");
    playButton.setAttribute("aria-label", `Pause ${name} explanation`);
    playButton.setAttribute("aria-pressed", "true");
    timer = setInterval(() => {
      if (current < steps[name].length - 1) render(current + 1);
      else pause();
    }, 3400);
  });
  figure.querySelector("[data-reset]").addEventListener("click", () => {
    pause();
    render(0);
  });
  navigation.hidden = false;
  figure.querySelector(".player").hidden = false;
  render(0);
  pause(false);
  controllers.push({ pause, redraw: () => render(current) });
}

const liveFigure = document.querySelector("[data-live-demo=lejit]");
const liveVisual = liveFigure.querySelector("[data-visual]");
const livePlay = liveFigure.querySelector("[data-lejit-play]");
const tokenCadence = 2200;
let tokenCursor = 0,
  tokenClock,
  liveRunning = !reducedMotion.matches;
function renderLejit() {
  liveVisual.innerHTML = lejitDiagram(tokenCursor, compact.matches);
  liveFigure.dataset.tokenCursor = tokenCursor;
  liveFigure.classList.toggle("is-paused", !liveRunning);
}
function syncLejit() {
  clearInterval(tokenClock);
  liveFigure.classList.toggle("is-paused", !liveRunning);
  livePlay.textContent = reducedMotion.matches
    ? "Next token →"
    : liveRunning
      ? "Pause Ⅱ"
      : "Play ▷";
  livePlay.setAttribute(
    "aria-label",
    reducedMotion.matches
      ? "Generate the next token"
      : liveRunning
        ? "Pause token generation"
        : "Play token generation",
  );
  livePlay.setAttribute("aria-pressed", String(liveRunning));
  if (liveRunning && !document.hidden)
    tokenClock = setInterval(() => {
      tokenCursor++;
      renderLejit();
    }, tokenCadence);
}
livePlay.addEventListener("click", () => {
  if (reducedMotion.matches) {
    tokenCursor++;
    renderLejit();
    return;
  }
  liveRunning = !liveRunning;
  syncLejit();
});
liveFigure.querySelector("[data-lejit-reset]").addEventListener("click", () => {
  tokenCursor = 0;
  renderLejit();
  syncLejit();
});
liveFigure.addEventListener("focusin", (event) => {
  if (event.target.closest("[data-tooltip]")) {
    liveRunning = false;
    syncLejit();
  }
});
liveFigure.querySelector(".player").hidden = false;
renderLejit();
syncLejit();
compact.addEventListener("change", renderLejit);
reducedMotion.addEventListener("change", () => {
  liveRunning = !reducedMotion.matches;
  renderLejit();
  syncLejit();
});
document.addEventListener("visibilitychange", syncLejit);

let packetCase = "early";
function renderPackets(name) {
  packetCase = name;
  const candidate = packetTimes[name],
    checks = checkPackets(candidate);
  setPressed(
    [...document.querySelectorAll("[data-packet]")],
    (button) => button.dataset.packet === name,
  );
  renderVisual(
    document.querySelector("#packet-comparison"),
    packetDiagram(name, compact.matches),
  );
  document.querySelector("#packet-checks").innerHTML = [
    ["delay", "Only adds delay"],
    ["order", "Preserves order"],
    ["budget", "Within budget"],
  ]
    .map(
      ([key, label]) =>
        `<span class="${checks[key] ? "pass" : "fail"}">${checks[key] ? "✓" : "×"} ${label}</span>`,
    )
    .join("");
  document.querySelector("#packet-status").textContent = {
    early:
      "Packets 2 and 3 move left of their original arrival times. An attacker restricted to adding delay cannot produce those times.",
    late: "Packets 2–4 move 25 ms to the right. Each move exceeds the example’s 20 ms delay budget.",
    valid:
      "The shifted packets satisfy the timing rules. PANTS must still run the classifier to determine whether the packets fool it.",
  }[name];
}
document
  .querySelectorAll("[data-packet]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      renderPackets(button.dataset.packet),
    ),
  );
renderPackets("early");

const selected = new Set(["a", "b"]);
function renderEvidence() {
  const result = coverage([...selected]);
  setPressed([...document.querySelectorAll("[data-clause]")], (button) =>
    selected.has(button.dataset.clause),
  );
  document.querySelector("#rule-evidence").innerHTML = Array.from(
    { length: 5 },
    (_, i) => {
      const clauses = [...selected]
        .filter((key) => samples[key].includes(i))
        .map((key) => key.toUpperCase());
      return `<div class="observation ${clauses.length ? "covered" : ""}">Sample ${i + 1}<small>${clauses.length ? clauses.join(" or ") : "Uncovered"} ${clauses.length ? "✓" : "×"}</small></div>`;
    },
  ).join("");
  document.querySelector("#rule-status").textContent =
    `${result.covered.length} of 5 observations covered. ` +
    (result.minimal
      ? "A or B is consistent with every observation. Removing either clause loses coverage."
      : result.complete
        ? "The extra condition C adds no coverage. The rule is consistent, but the selection is redundant."
        : "The selected clauses do not yet explain every observation. Add a clause that covers the missing evidence.");
}
document.querySelectorAll("[data-clause]").forEach((button) =>
  button.addEventListener("click", () => {
    const key = button.dataset.clause;
    selected.has(key) ? selected.delete(key) : selected.add(key);
    renderEvidence();
  }),
);
renderEvidence();

let guardCase = "pensieve";
function renderGuard() {
  const on = document.querySelector("#protection").checked;
  setPressed(
    [...document.querySelectorAll("[data-case]")],
    (button) => button.dataset.case === guardCase,
  );
  document.querySelector("#guard-visual").innerHTML = guardDiagram(
    guardCase,
    on,
    compact.matches,
  );
  const descriptions = {
    pensieve: [
      "A lower bitrate limits the next request when the playback buffer is low, downloads are slow, and the next chunk is large.",
      "The high-bitrate request goes through. In the documented failure, oversized requests amplify playback stalls.",
    ],
    sage: [
      "A bounded increase helps reopen the sending window after losses subside. Protection can encourage more aggressive sending when the controller leaves capacity unused.",
      "The small sending window passes through unchanged. In the documented failure, slow recovery leaves achievable throughput unused.",
    ],
    normal: [
      "No rule calls for a correction. ReGuard accepts the controller’s proposed action.",
      "The proposed action passes through. Enabling protection would leave the action unchanged in the illustrated state.",
    ],
  };
  document.querySelector("#guard-status").textContent =
    descriptions[guardCase][on ? 0 : 1];
}
document.querySelectorAll("[data-case]").forEach((button) =>
  button.addEventListener("click", () => {
    guardCase = button.dataset.case;
    renderGuard();
  }),
);
document.querySelector("#protection").addEventListener("change", renderGuard);
renderGuard();
document
  .querySelectorAll(".experiment .options,.clause-options,.guard-switch")
  .forEach((el) => (el.hidden = false));

compact.addEventListener("change", () => {
  controllers.forEach((controller) => controller.redraw());
  renderGuard();
  renderPackets(packetCase);
});
reducedMotion.addEventListener("change", () =>
  controllers.forEach((controller) => controller.pause()),
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) controllers.forEach((controller) => controller.pause());
});
const menu = document.querySelector(".mobile-menu");
const paperToc = document.querySelector(".paper-toc");
const masthead = document.querySelector(".masthead");
const tocRail = matchMedia("(min-width: 1440px) and (min-height: 621px)");
const paperLinks = [...paperToc.querySelectorAll("a")];
const paperSections = paperLinks.map((link) =>
  document.querySelector(link.hash),
);
function positionPaperToc() {
  paperToc.open = tocRail.matches;
}
positionPaperToc();
tocRail.addEventListener("change", positionPaperToc);
paperLinks.forEach((link) =>
  link.addEventListener("click", () => {
    if (!tocRail.matches) paperToc.open = false;
  }),
);
document.addEventListener("click", (event) => {
  if (!tocRail.matches && !paperToc.contains(event.target))
    paperToc.open = false;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && paperToc.open) {
    const hadFocus = paperToc.contains(document.activeElement);
    paperToc.open = false;
    if (hadFocus) paperToc.querySelector("summary").focus();
  }
});
let tocFrame;
function highlightPaper() {
  tocFrame = undefined;
  const tocBounds = paperToc.getBoundingClientRect();
  const heroBounds = masthead.getBoundingClientRect();
  const tocMidpoint = tocBounds.top + tocBounds.height / 2;
  const fadeHeight = parseFloat(getComputedStyle(masthead, "::after").height) || 0;
  paperToc.classList.toggle(
    "is-over-hero",
    tocMidpoint >= heroBounds.top && tocMidpoint < heroBounds.bottom - fadeHeight / 2,
  );
  const readingLine =
    document.querySelector(".topbar").getBoundingClientRect().bottom + 60;
  const active = paperSections.find((section) => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= readingLine && bounds.bottom > readingLine;
  });
  paperLinks.forEach((link) => {
    if (active && link.hash === `#${active.id}`)
      link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
function schedulePaperHighlight() {
  if (!tocFrame) tocFrame = requestAnimationFrame(highlightPaper);
}
window.addEventListener("scroll", schedulePaperHighlight, { passive: true });
window.addEventListener("resize", schedulePaperHighlight);
window.addEventListener("load", schedulePaperHighlight);
paperToc.addEventListener("toggle", schedulePaperHighlight);
highlightPaper();
menu
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", () => (menu.open = false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") menu.open = false;
});
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting)
          for (const link of document.querySelectorAll(".topbar>nav a")) {
            if (link.hash === `#${entry.target.id}`)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          }
    },
    { rootMargin: "-10% 0px -70% 0px" },
  );
  document
    .querySelectorAll(".chapter,#papers")
    .forEach((section) => observer.observe(section));
}

const tooltip = document.createElement("div");
tooltip.id = "diagram-tooltip";
tooltip.className = "diagram-tooltip";
tooltip.setAttribute("role", "tooltip");
tooltip.hidden = true;
document.body.append(tooltip);
let tooltipTarget;
function hideTooltip() {
  tooltip.hidden = true;
  tooltipTarget?.removeAttribute("aria-describedby");
  tooltipTarget = undefined;
}
function showTooltip(target) {
  if (!target) return;
  hideTooltip();
  tooltipTarget = target;
  tooltip.textContent = target.dataset.tooltip;
  tooltip.hidden = false;
  target.setAttribute("aria-describedby", tooltip.id);
  const rect = target.getBoundingClientRect();
  const width = tooltip.offsetWidth,
    height = tooltip.offsetHeight;
  tooltip.style.left = `${Math.max(12, Math.min(innerWidth - width - 12, rect.left + rect.width / 2 - width / 2))}px`;
  tooltip.style.top = `${Math.max(12, Math.min(innerHeight - height - 12, rect.top - height - 10 > 12 ? rect.top - height - 10 : rect.bottom + 10))}px`;
}
document.addEventListener("pointerover", (event) => {
  const target = event.target.closest("[data-tooltip]");
  if (target && target !== tooltipTarget) showTooltip(target);
});
document.addEventListener("pointerout", (event) => {
  if (
    tooltipTarget &&
    !tooltipTarget.contains(event.relatedTarget) &&
    !tooltip.contains(event.relatedTarget)
  )
    hideTooltip();
});
tooltip.addEventListener("pointerleave", hideTooltip);
document.addEventListener("focusin", (event) =>
  showTooltip(event.target.closest("[data-tooltip]")),
);
document.addEventListener("focusout", hideTooltip);
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-tooltip]");
  if (target) showTooltip(target);
  else hideTooltip();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideTooltip();
});
window.addEventListener("scroll", hideTooltip, { passive: true });
window.addEventListener("resize", hideTooltip);
