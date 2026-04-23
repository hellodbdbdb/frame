// app.js — frame main logic
// Vanilla ES module, hash router, minimal state. Firestore is source of truth.

import {
  onAuth,
  signIn,
  signOut,
  handleRedirect,
  ensureSeed,
  loadQuestions,
  saveQuestion,
  createQuestion,
  logPractice,
  loadLogs,
  clearAllLogs,
  clearLogsByIds,
  startSession,
  endSession,
  loadSessions
} from "./firebase.js";

import { THEMES } from "./data.js";

// ---------- state ----------

const state = {
  user: null,
  questions: [],      // full array from firestore
  questionsById: {},
  logs: [],           // recent logs
  sessions: [],
  loaded: false,
  route: "home"
};

// Drill queue — used when you enter drill from a home action card (weak spots,
// cold run, neglected theme). "next" then steps through this list instead of
// picking a fresh random.
const drillQueue = {
  list: [],   // array of qids
  idx: 0,
  label: ""   // e.g. "Weak spots"
};

function clearDrillQueue() {
  drillQueue.list = [];
  drillQueue.idx = 0;
  drillQueue.label = "";
}

function startDrillPool(label, qids) {
  if (!qids.length) { alert("No questions in this pool yet."); return; }
  drillQueue.list = qids;
  drillQueue.idx = 0;
  drillQueue.label = label;
  go(`drill/${qids[0]}`);
}

function advanceDrill() {
  if (!drillQueue.list.length) {
    pickRandomAndGoDrill();
    return;
  }
  drillQueue.idx++;
  if (drillQueue.idx >= drillQueue.list.length) {
    clearDrillQueue();
    go("home");
    return;
  }
  go(`drill/${drillQueue.list[drillQueue.idx]}`);
}

// ---------- bootstrap ----------

window.addEventListener("DOMContentLoaded", () => {
  handleRedirect(); // resolves any pending redirect sign-in
  wireTopbar();
  wireBottombar();
  wirePullToRefresh();
  window.addEventListener("hashchange", renderRoute);
  onAuth(onAuthChange);
});

function wirePullToRefresh() {
  const ptr = document.getElementById("ptr");
  if (!ptr) return;
  const label = ptr.querySelector(".ptr-label");
  const THRESHOLD = 72;
  const MAX = 120;
  let startY = 0;
  let pulled = 0;
  let active = false;
  let working = false;

  function canPull() {
    return state.user && state.loaded && state.route === "home" && window.scrollY <= 0 && !working;
  }

  window.addEventListener("touchstart", (e) => {
    if (!canPull()) { active = false; return; }
    startY = e.touches[0].clientY;
    pulled = 0;
    active = true;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!active) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0) {
      ptr.style.transform = "";
      ptr.classList.remove("ready");
      pulled = 0;
      return;
    }
    pulled = Math.min(dy, MAX);
    // diminishing-returns drag feel
    const eased = pulled < THRESHOLD ? pulled : THRESHOLD + (pulled - THRESHOLD) * 0.35;
    ptr.style.transform = `translateY(${eased}px)`;
    const ready = pulled >= THRESHOLD;
    ptr.classList.toggle("ready", ready);
    if (label) label.textContent = ready ? "release to refresh" : "pull to refresh";
  }, { passive: true });

  window.addEventListener("touchend", async () => {
    if (!active) return;
    active = false;
    if (pulled >= THRESHOLD && canPull()) {
      working = true;
      ptr.classList.add("loading");
      if (label) label.textContent = "refreshing…";
      ptr.style.transform = `translateY(${THRESHOLD}px)`;
      try {
        await refreshData();
        if (state.route === "home") renderHome();
      } catch (err) {
        console.error(err);
      } finally {
        ptr.classList.remove("loading", "ready");
        ptr.style.transform = "";
        if (label) label.textContent = "pull to refresh";
        working = false;
      }
    } else {
      ptr.style.transform = "";
      ptr.classList.remove("ready");
    }
    pulled = 0;
  });
}

function wireTopbar() {
  document.querySelector(".brand")?.addEventListener("click", () => go("home"));
  document.getElementById("signoutBtn")?.addEventListener("click", async () => {
    await signOut();
    state.user = null;
    state.loaded = false;
    state.questions = [];
    state.logs = [];
    state.sessions = [];
    hideChrome();
    renderSignin();
  });
}

function wireBottombar() {
  const bar = document.getElementById("bottombar");
  if (!bar) return;
  bar.querySelectorAll("button[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.nav === "drill") {
        pickRandomAndGoDrill();
      } else {
        go(btn.dataset.nav);
      }
    });
  });
}

function showChrome() {
  document.querySelector(".topbar").hidden = false;
  document.getElementById("bottombar").hidden = false;
  document.getElementById("signoutBtn").hidden = false;
}

function hideChrome() {
  document.querySelector(".topbar").hidden = true;
  document.getElementById("bottombar").hidden = true;
  document.getElementById("signoutBtn").hidden = true;
}

async function onAuthChange(user) {
  if (!user) {
    state.user = null;
    state.loaded = false;
    hideChrome();
    renderSignin();
    return;
  }
  state.user = user;
  showChrome();
  renderLoading();
  try {
    await ensureSeed(user);
    await refreshData();
    state.loaded = true;
    renderRoute();
  } catch (err) {
    console.error(err);
    renderError(err);
  }
}

async function refreshData() {
  const [questions, logs, sessions] = await Promise.all([
    loadQuestions(state.user.uid),
    loadLogs(state.user.uid, 500),
    loadSessions(state.user.uid, 30)
  ]);
  state.questions = questions;
  state.questionsById = Object.fromEntries(questions.map((q) => [q.id, q]));
  state.logs = logs;
  state.sessions = sessions;
  updateReadinessChip();
}

// ---------- routing ----------

function go(route) {
  location.hash = "#" + route;
}

function currentHash() {
  return (location.hash || "#home").slice(1);
}

function renderRoute() {
  if (!state.user) { renderSignin(); return; }
  if (!state.loaded) { renderLoading(); return; }

  const h = currentHash();
  const [name, ...rest] = h.split("/");
  state.route = name;

  setActiveNav(name);

  switch (name) {
    case "home":    renderHome(); break;
    case "list":    renderList(); break;
    case "detail":  renderDetail(rest[0]); break;
    case "drill":
      if (rest[0]) renderDrill("drill", rest[0]);
      else pickRandomAndGoDrill();
      break;
    case "anchor":  renderDrill("drill", rest[0]); break;
    case "structure": renderDrill("drill", rest[0]); break;
    case "story":   renderDrill("drill", rest[0]); break;
    case "mock":    renderMockIntro(); break;
    case "mock-run": renderMockRun(); break;
    case "mock-rate": renderMockRate(); break;
    case "history": renderHistory(); break;
    case "edit":    renderEdit(rest[0]); break;
    case "new":     renderNew(); break;
    case "weak":    renderSet("weak"); break;
    case "cold":    renderSet("cold"); break;
    case "neglected": renderSet("neglected"); break;
    case "browse":  renderList(); break;
    default: renderHome();
  }
}

function setActiveNav(name) {
  const map = {
    home: "home",
    list: "list",
    mock: "mock",
    "mock-run": "mock",
    "mock-rate": "mock",
    history: "history",
    drill: "drill",
    detail: "list",
    edit: "list",
    new: "list",
    weak: "list",
    cold: "list",
    neglected: "list",
    browse: "list"
  };
  const active = map[name] || "home";
  document.querySelectorAll("#bottombar button").forEach((b) => {
    b.classList.toggle("active", b.dataset.nav === active);
  });
}

// ---------- strength + readiness ----------

// Strength: take most recent N=5 logs for a question, EWMA with decay 0.7.
// If no logs, fall back to baseline from seed.
function strengthFor(qid) {
  const recent = state.logs
    .filter((l) => l.questionId === qid)
    .slice(0, 5); // already desc by ts
  if (!recent.length) return state.questionsById[qid]?.baseline ?? 3;
  let num = 0;
  let den = 0;
  let w = 1;
  for (const l of recent) {
    num += (l.rating || 3) * w;
    den += w;
    w *= 0.7;
  }
  return Math.max(1, Math.min(5, num / den));
}

function lastPracticed(qid) {
  const l = state.logs.find((x) => x.questionId === qid);
  return l?.ts?.toDate?.() || null;
}

function stalenessDays(qid) {
  const d = lastPracticed(qid);
  if (!d) return 999;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// Readiness: mean strength (normalized 0-1) minus staleness penalty.
function readiness() {
  if (!state.questions.length) return 0;
  const strengths = state.questions.map((q) => strengthFor(q.id));
  const mean = strengths.reduce((a, b) => a + b, 0) / strengths.length;
  const strengthNorm = (mean - 1) / 4; // 0..1

  // coverage: share of questions practiced in last 7 days
  const recentCount = state.questions.filter((q) => stalenessDays(q.id) <= 7).length;
  const coverage = recentCount / state.questions.length;

  // composite: 70% strength, 30% coverage
  const composite = 0.7 * strengthNorm + 0.3 * coverage;
  return Math.round(composite * 100);
}

function updateReadinessChip() {
  const chip = document.getElementById("readinessChip");
  if (chip) chip.textContent = `ready ${readiness()}/100`;
}

function themeLastPracticed(theme) {
  const qids = state.questions.filter((q) => q.theme === theme).map((q) => q.id);
  const dates = qids.map((id) => lastPracticed(id)).filter(Boolean);
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

function neglectedTheme() {
  const scored = Object.keys(THEMES).map((t) => {
    const d = themeLastPracticed(t);
    return { theme: t, last: d ? d.getTime() : 0 };
  });
  scored.sort((a, b) => a.last - b.last);
  return scored[0].theme;
}

function weakSpots(n = 3) {
  const scored = state.questions.map((q) => ({
    q,
    score: (5 - strengthFor(q.id)) * 1 + Math.min(stalenessDays(q.id), 30) / 30
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((s) => s.q);
}

function repsThisWeek() {
  const cutoff = Date.now() - 7 * 86400000;
  return state.logs.filter((l) => {
    const t = l.ts?.toDate?.();
    return t && t.getTime() >= cutoff;
  }).length;
}

// ---------- view helpers ----------

const $view = () => document.getElementById("view");

function el(tag, props = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
    else if (v === true) n.setAttribute(k, "");
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return n;
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function mount(...nodes) {
  const v = $view();
  clear(v);
  for (const n of nodes) v.appendChild(n);
  window.scrollTo(0, 0);
}

function strengthDot(s) {
  const n = Math.max(1, Math.min(5, Math.round(s)));
  return el("span", { class: `strength-dot s${n}`, title: `strength ${s.toFixed(1)}/5` });
}

function stalenessLabel(qid) {
  const d = stalenessDays(qid);
  if (d >= 999) return "never";
  if (d === 0) return "today";
  if (d === 1) return "1d ago";
  return d + "d ago";
}

function mdToHtml(md) {
  if (!md) return "";
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const lines = md.split("\n");
  let out = "";
  let inList = false;
  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      if (!inList) { out += "<ul>"; inList = true; }
      out += "<li>" + esc(line.replace(/^\s*-\s+/, "")) + "</li>";
    } else {
      if (inList) { out += "</ul>"; inList = false; }
      if (line.trim()) out += "<p>" + esc(line) + "</p>";
    }
  }
  if (inList) out += "</ul>";
  return out;
}

// ---------- views ----------

function renderSignin() {
  mount(
    el("section", { class: "signin" }, [
      el("h1", { text: "frame" }),
      el("p", { class: "tagline", text: "A quiet place to rehearse your voice. No streaks. No noise. Just you and the questions." }),
      el("button", { class: "btn", onClick: () => signIn().catch((e) => alert(e.message)) }, [
        el("span", { text: "sign in with Google" }),
        el("span", { class: "arrow", "aria-hidden": "true", text: "\u2192" })
      ])
    ])
  );
}

function renderLoading() {
  mount(el("section", { class: "empty" }, [el("p", { text: "loading…" })]));
}

function renderError(err) {
  mount(
    el("section", { class: "card" }, [
      el("h2", { text: "Something went wrong." }),
      el("p", { class: "muted", text: String(err?.message || err) }),
      el("button", { class: "btn secondary", onClick: () => location.reload() }, ["reload"])
    ])
  );
}

function renderHome() {
  const r = readiness();
  const weak = weakSpots(3);

  // --- compact stat bar ---
  const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const ratingsOn = (date) => state.logs
    .map((l) => ({ t: l.ts?.toDate?.(), rating: l.rating }))
    .filter((x) => x.t && sameDay(x.t, date) && typeof x.rating === "number");
  const avg = (arr) => arr.length
    ? arr.reduce((s, x) => s + (x.rating || 0), 0) / arr.length
    : null;

  const todayRatings = ratingsOn(today);
  const yesterdayRatings = ratingsOn(yesterday);
  const allRatings = state.logs
    .map((l) => l.rating)
    .filter((v) => typeof v === "number");

  const todayCount = todayRatings.length;
  const todayAvg = avg(todayRatings);
  const yAvg = avg(yesterdayRatings);
  const allAvg = allRatings.length
    ? allRatings.reduce((s, v) => s + v, 0) / allRatings.length
    : null;

  let trendSym = "\u2192"; // neutral
  let trendCls = "";
  if (todayAvg != null && yAvg != null) {
    if (todayAvg > yAvg + 0.05) { trendSym = "\u2191"; trendCls = "up"; }
    else if (todayAvg < yAvg - 0.05) { trendSym = "\u2193"; trendCls = "down"; }
  }

  function stat(label, valueText, extra) {
    const valueChildren = [document.createTextNode(valueText)];
    if (extra) valueChildren.push(extra);
    return el("div", { class: "stat" }, [
      el("div", { class: "stat-label", text: label }),
      el("div", { class: "stat-value" }, valueChildren)
    ]);
  }

  const hero = el("section", { class: "hero-readiness" }, [
    stat("Ready", String(r)),
    stat("Today", String(todayCount)),
    stat("Today avg", todayAvg != null ? todayAvg.toFixed(1) : "\u2014"),
    stat(
      "All avg",
      allAvg != null ? allAvg.toFixed(1) : "\u2014",
      el("span", { class: `stat-trend ${trendCls}`, text: trendSym, "aria-hidden": "true" })
    )
  ]);

  // --- tile factory ---
  function tile({ variant, kicker, title, copy, cta, extraClass, onClick }) {
    const cls = "action-card"
      + (variant ? " " + variant : "")
      + (extraClass ? " " + extraClass : "");
    return el("button", { class: cls, onClick }, [
      el("div", {}, [
        el("div", { class: "kicker", text: kicker }),
        el("h3", { text: title }),
        el("p", { text: copy })
      ]),
      el("div", { class: "card-cta" }, [
        el("span", { text: cta }),
        el("span", { class: "arrow", "aria-hidden": "true", text: "\u2192" })
      ])
    ]);
  }

  const tiles = el("div", { class: "bento" }, [
    tile({
      variant: "mint",
      kicker: "focus",
      title: "Improve",
      copy: `${weak.length} questions picked by low strength × high staleness`,
      cta: "Start learning",
      letter: "i",
      onClick: () => startDrillPool("Improve", weak.map((q) => q.id))
    }),
    tile({
      variant: "mint",
      kicker: "breadth",
      title: "Random",
      copy: "10 picks — least-practiced first, shuffled within ties",
      cta: "Start run",
      letter: "r",
      onClick: () => {
        const repCount = Object.fromEntries(state.questions.map((q) => [q.id, 0]));
        for (const l of state.logs) {
          if (l.questionId in repCount) repCount[l.questionId] += 1;
        }
        const byCount = new Map();
        for (const q of state.questions) {
          const c = repCount[q.id];
          if (!byCount.has(c)) byCount.set(c, []);
          byCount.get(c).push(q);
        }
        const picked = [];
        for (const c of [...byCount.keys()].sort((a, b) => a - b)) {
          if (picked.length >= 10) break;
          const bucket = [...byCount.get(c)].sort(() => Math.random() - 0.5);
          for (const q of bucket) {
            picked.push(q.id);
            if (picked.length >= 10) break;
          }
        }
        startDrillPool("Random", picked);
      }
    }),
    tile({
      variant: "mint",
      kicker: "timed",
      title: "Live",
      copy: "Cold draw, timed per question. Rate each one after.",
      cta: "Start live",
      letter: "l",
      extraClass: "span-2",
      onClick: () => go("mock")
    })
  ]);

  mount(
    el("div", { class: "home-tagline" }, [
      el("div", {}, [
        el("span", { class: "soft", text: "rehearse " }),
        el("span", { class: "hard", text: "your voice." })
      ]),
      el("button", { class: "btn ghost small", onClick: () => go("history") }, ["history \u2192"])
    ]),
    hero,
    tiles
  );
}

// pickRandomAndGoDrill is defined later in the file (after renderDrill)
// and used both from the bottombar and from home action cards.

function renderList() {
  const grouped = {};
  for (const q of state.questions) {
    (grouped[q.theme] ||= []).push(q);
  }
  const nodes = [
    el("div", { class: "list-head" }, [
      el("h1", { text: "library", style: { margin: "0" } }),
      el("button", { class: "btn small", onClick: () => go("new") }, [
        el("span", { text: "new" }),
        el("span", { class: "arrow", "aria-hidden": "true", text: "+" })
      ])
    ])
  ];
  for (const [t, name] of Object.entries(THEMES).map(([k, v]) => [k, v.name])) {
    const items = grouped[t] || [];
    if (!items.length) continue;
    nodes.push(el("div", { class: "theme-block" }, [
      el("div", { class: "theme-head" }, [
        el("span", { class: "theme-name", text: name })
      ]),
      ...items.map((q) => {
        const qLogs = state.logs.filter((l) => l.questionId === q.id && typeof l.rating === "number");
        const count = qLogs.length;
        const avg = count ? qLogs.reduce((s, l) => s + l.rating, 0) / count : null;
        const metaText = count ? `${count}\u00d7 \u00b7 ${avg.toFixed(1)}` : "new";
        return el("button", { class: "question-row", onClick: () => go(`detail/${q.id}`) }, [
          strengthDot(strengthFor(q.id)),
          el("span", { class: "qtitle", text: q.title }),
          el("span", { class: "qmeta", text: metaText })
        ]);
      })
    ]));
  }
  mount(...nodes);
}

function renderSet(kind) {
  let list = [];
  let title = "";
  if (kind === "weak") {
    list = weakSpots(3);
    title = "Improve";
  } else if (kind === "cold") {
    list = [...state.questions].sort(() => Math.random() - 0.5).slice(0, 10);
    title = "Cold run · 10 random";
  } else {
    const theme = neglectedTheme();
    list = state.questions.filter((q) => q.theme === theme);
    title = `Neglected · ${THEMES[theme]?.name}`;
  }
  mount(
    el("h1", { text: title }),
    el("p", { class: "muted", text: "Tap a question to learn or browse." }),
    ...list.map((q) =>
      el("button", { class: "question-row", onClick: () => go(`detail/${q.id}`) }, [
        strengthDot(strengthFor(q.id)),
        el("span", { class: "qtitle", text: q.title }),
        el("span", { class: "qmeta", text: stalenessLabel(q.id) })
      ])
    )
  );
}

function renderDetail(qid) {
  const q = state.questionsById[qid];
  if (!q) { go("list"); return; }
  const logs = state.logs.filter((l) => l.questionId === qid).slice(0, 10);

  // library-ordered flat list for prev/next nav
  const order = [];
  for (const t of Object.keys(THEMES)) {
    for (const x of state.questions) if (x.theme === t) order.push(x);
  }
  const idx = order.findIndex((x) => x.id === qid);
  const prevQ = idx > 0 ? order[idx - 1] : null;
  const nextQ = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

  const nav = el("div", { class: "detail-nav" }, [
    el("button", {
      class: "btn ghost small",
      disabled: !prevQ,
      onClick: () => prevQ && go(`detail/${prevQ.id}`)
    }, ["\u2190 prev"]),
    el("span", { class: "detail-nav-count", text: `${idx + 1} / ${order.length}` }),
    el("button", {
      class: "btn ghost small",
      disabled: !nextQ,
      onClick: () => nextQ && go(`detail/${nextQ.id}`)
    }, ["next \u2192"])
  ]);

  const nodes = [
    nav,
    el("h1", { text: q.title }),
    buildPromptCard(q, qid),
    buildMetaCard(q, qid),
    buildAnchorCard(q, qid),
    buildBeatsCard(q, qid),
    el("div", { class: "card" }, [
      el("h3", { text: "Your answer" }),
      el("div", { class: "answer-body", html: mdToHtml(q.answer) })
    ])
  ];

  nodes.push(el("h2", { text: "Practice" }));
  nodes.push(el("div", { class: "row stretch" }, [
    el("button", { class: "btn", onClick: () => go(`drill/${qid}`) }, [
      el("span", { text: "learn this question" }),
      el("span", { class: "arrow", "aria-hidden": "true", text: "\u2192" })
    ])
  ]));

  nodes.push(el("div", { class: "row", style: { marginTop: "8px" } }, [
    el("button", { class: "btn ghost small", onClick: () => go(`edit/${qid}`) }, ["edit"])
  ]));

  if (logs.length) {
    nodes.push(el("h2", { text: "Recent reps" }));
    nodes.push(el("div", {}, logs.map((l) => {
      const t = l.ts?.toDate?.();
      const when = t ? t.toLocaleString() : "—";
      return el("div", { class: "log-row" }, [
        el("span", { class: "log-mode", text: modeLabel(l.mode) }),
        el("span", { text: `rated ${l.rating}/5` }),
        el("span", { class: "muted", text: when })
      ]);
    })));
  }

  mount(...nodes);
}

function renderDrill(mode, qid) {
  const q = state.questionsById[qid];
  if (!q) { go("list"); return; }

  const closeBtn = el("button", { class: "drill-close", "aria-label": "close", onClick: async () => {
    clearDrillQueue();
    await refreshData();
    go("home");
  }}, ["\u00d7"]);

  const flipcard = el("div", { class: "flipcard" });
  flipcard.appendChild(closeBtn);
  const inner = el("div", { class: "flipcard-inner" });

  // --- front: the question ---
  const front = el("div", { class: "flipcard-face card" }, [
    el("div", { class: "drill-prompt", text: q.prompt }),
    el("button", { class: "btn block", onClick: flipToBack }, ["reveal answer"])
  ]);

  // --- back: question reminder + anchor + story beats + answer + rating ---
  const backInner = el("div", {}, [
    el("p", { class: "back-question", text: q.prompt }),
    el("hr", { class: "hair" }),
    buildDrillAnchorSection(q, qid),
    buildDrillBeatsSection(q, qid),
    buildDrillAnswerSection(q, qid)
  ]);

  const ratingRow = el("div", { class: "rating-row" }, [1, 2, 3, 4, 5].map((n) => {
    const b = el("button", { class: "btn secondary", onClick: () => handleRate(n, b) }, [String(n)]);
    return b;
  }));
  const ratingBox = el("div", { class: "rating-box" }, [
    el("h3", { text: "Rate yourself" }),
    el("p", { class: "muted", text: "1 = fumbled · 5 = clean" }),
    ratingRow
  ]);

  const back = el("div", { class: "flipcard-face flipcard-back card" }, [
    backInner,
    ratingBox
  ]);

  inner.appendChild(front);
  inner.appendChild(back);
  flipcard.appendChild(inner);

  const feedbackEl = el("div", { class: "drill-feedback", text: "" });

  const repeatBtnEl = el("button", { class: "btn secondary", onClick: () => flipToFront() }, ["repeat"]);
  const nextBtnEl = el("button", { class: "btn", disabled: true, onClick: advanceDrill }, ["next"]);

  function flipToBack() {
    flipcard.classList.add("flipped");
  }
  function flipToFront() {
    flipcard.classList.remove("flipped");
    ratingRow.querySelectorAll("button").forEach((b) => b.classList.remove("chosen"));
    feedbackEl.textContent = "";
    feedbackEl.classList.remove("saved");
    nextBtnEl.setAttribute("disabled", "");
  }

  async function handleRate(n, btn) {
    ratingRow.querySelectorAll("button").forEach((b) => b.classList.remove("chosen"));
    btn.classList.add("chosen");
    try {
      await logPractice(state.user.uid, { questionId: qid, mode: "drill", rating: n, durationSec: 0 });
      feedbackEl.textContent = `saved · ${n}/5`;
      feedbackEl.classList.add("saved");
      nextBtnEl.removeAttribute("disabled");
    } catch (err) {
      console.error(err);
      alert("Could not save rating: " + err.message);
    }
  }

  const actions = el("div", { class: "drill-actions" }, [repeatBtnEl, nextBtnEl]);

  const queueIndicator = drillQueue.list.length
    ? el("div", { class: "queue-indicator", text: `${drillQueue.label} · ${drillQueue.idx + 1} / ${drillQueue.list.length}` })
    : null;

  mount(
    el("div", { class: "drill-view" }, [
      queueIndicator,
      flipcard,
      actions,
      feedbackEl
    ].filter(Boolean))
  );
}

function pickRandomAndGoDrill() {
  clearDrillQueue();
  const pool = state.questions;
  const q = pool[Math.floor(Math.random() * pool.length)];
  go(`drill/${q.id}`);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function modeLabel(mode) {
  if (mode === "mock") return "live";
  if (mode === "drill") return "learn";
  return mode;
}

function buildPromptCard(q, qid) {
  const card = el("div", { class: "card anchor-card" }, []);

  function showView() {
    card.innerHTML = "";
    card.appendChild(el("div", { class: "anchor-head" }, [
      el("h3", { text: "Question" }),
      el("button", { class: "btn ghost small", onClick: showEdit }, ["edit"])
    ]));
    card.appendChild(el("p", {
      text: q.prompt || "\u2014",
      style: { margin: "6px 0 0" }
    }));
  }

  function showEdit() {
    card.innerHTML = "";
    const ta = el("textarea", {}, [q.prompt || ""]);
    const saveBtn = el("button", { class: "btn small", onClick: async () => {
      const next = ta.value.trim();
      saveBtn.setAttribute("disabled", "");
      try {
        await saveQuestion(state.user.uid, qid, { prompt: next });
        q.prompt = next;
        if (state.questionsById[qid]) state.questionsById[qid].prompt = next;
        showView();
      } catch (err) {
        saveBtn.removeAttribute("disabled");
        alert("Could not save: " + (err?.message || err));
      }
    }}, ["save"]);
    card.appendChild(el("h3", { text: "Question" }));
    card.appendChild(ta);
    card.appendChild(el("div", { class: "row", style: { marginTop: "10px", gap: "8px" } }, [
      saveBtn,
      el("button", { class: "btn ghost small", onClick: showView }, ["cancel"])
    ]));
    ta.focus();
  }

  showView();
  return card;
}

function buildMetaCard(q, qid) {
  const card = el("div", { class: "card anchor-card" }, []);

  function showView() {
    card.innerHTML = "";
    card.appendChild(el("div", { class: "anchor-head" }, [
      el("h3", { text: "Theme & type" }),
      el("button", { class: "btn ghost small", onClick: showEdit }, ["edit"])
    ]));
    const themeName = THEMES[q.theme]?.name || q.theme || "\u2014";
    card.appendChild(el("p", { style: { margin: "6px 0 0" } }, [
      document.createTextNode(`${themeName} · ${q.type || "\u2014"}`)
    ]));
  }

  function showEdit() {
    card.innerHTML = "";
    const themeSelect = el("select", {},
      Object.entries(THEMES).map(([k, v]) =>
        el("option", { value: k, selected: k === q.theme }, [`${k} · ${v.name}`])
      )
    );
    const typeSelect = el("select", {}, [
      el("option", { value: "framework", selected: q.type === "framework" }, ["framework"]),
      el("option", { value: "story", selected: q.type === "story" }, ["story"])
    ]);
    // ensure value reflects q even when el helper skipped the attribute
    themeSelect.value = q.theme || themeSelect.options[0]?.value;
    typeSelect.value = q.type || typeSelect.options[0]?.value;

    const saveBtn = el("button", { class: "btn small", onClick: async () => {
      const nextTheme = themeSelect.value;
      const nextType = typeSelect.value;
      saveBtn.setAttribute("disabled", "");
      try {
        await saveQuestion(state.user.uid, qid, { theme: nextTheme, type: nextType });
        q.theme = nextTheme;
        q.type = nextType;
        if (state.questionsById[qid]) {
          state.questionsById[qid].theme = nextTheme;
          state.questionsById[qid].type = nextType;
        }
        showView();
      } catch (err) {
        saveBtn.removeAttribute("disabled");
        alert("Could not save: " + (err?.message || err));
      }
    }}, ["save"]);

    card.appendChild(el("h3", { text: "Theme" }));
    card.appendChild(themeSelect);
    card.appendChild(el("h3", { text: "Type" }));
    card.appendChild(typeSelect);
    card.appendChild(el("div", { class: "row", style: { marginTop: "10px", gap: "8px" } }, [
      saveBtn,
      el("button", { class: "btn ghost small", onClick: showView }, ["cancel"])
    ]));
  }

  showView();
  return card;
}

function buildAnchorCard(q, qid) {
  const card = el("div", { class: "card anchor-card" }, []);

  function showView() {
    card.innerHTML = "";
    card.appendChild(el("div", { class: "anchor-head" }, [
      el("h3", { text: "Anchor phrase" }),
      el("button", { class: "btn ghost small", onClick: showEdit }, ["edit"])
    ]));
    card.appendChild(el("p", {
      class: "anchor-text",
      text: q.anchor || "—",
      style: { margin: "6px 0 0" }
    }));
  }

  function showEdit() {
    card.innerHTML = "";
    const ta = el("textarea", { class: "compact" }, [q.anchor || ""]);
    const saveBtn = el("button", { class: "btn small", onClick: async () => {
      const next = ta.value.trim();
      saveBtn.setAttribute("disabled", "");
      try {
        await saveQuestion(state.user.uid, qid, { anchor: next });
        q.anchor = next;
        if (state.questionsById[qid]) state.questionsById[qid].anchor = next;
        showView();
      } catch (err) {
        saveBtn.removeAttribute("disabled");
        alert("Could not save: " + (err?.message || err));
      }
    }}, ["save"]);
    card.appendChild(el("h3", { text: "Anchor phrase" }));
    card.appendChild(ta);
    card.appendChild(el("div", { class: "row", style: { marginTop: "10px", gap: "8px" } }, [
      saveBtn,
      el("button", { class: "btn ghost small", onClick: showView }, ["cancel"])
    ]));
    ta.focus();
  }

  showView();
  return card;
}

function buildDrillAnchorSection(q, qid) {
  const wrap = document.createElement("div");
  wrap.className = "drill-section";

  function showView() {
    wrap.innerHTML = "";
    wrap.appendChild(el("div", { class: "drill-section-head" }, [
      el("h3", { text: "anchor" }),
      el("button", { class: "btn ghost small", onClick: showEdit }, ["edit"])
    ]));
    wrap.appendChild(el("p", { class: "anchor-text", text: q.anchor || "\u2014" }));
  }

  function showEdit() {
    wrap.innerHTML = "";
    const ta = el("textarea", { class: "compact" }, [q.anchor || ""]);
    const saveBtn = el("button", { class: "btn small", onClick: async () => {
      const next = ta.value.trim();
      saveBtn.setAttribute("disabled", "");
      try {
        await saveQuestion(state.user.uid, qid, { anchor: next });
        q.anchor = next;
        if (state.questionsById[qid]) state.questionsById[qid].anchor = next;
        showView();
      } catch (err) {
        saveBtn.removeAttribute("disabled");
        alert("Could not save: " + (err?.message || err));
      }
    }}, ["save"]);
    wrap.appendChild(el("h3", { text: "anchor" }));
    wrap.appendChild(ta);
    wrap.appendChild(el("div", { class: "row", style: { marginTop: "8px", gap: "8px" } }, [
      saveBtn,
      el("button", { class: "btn ghost small", onClick: showView }, ["cancel"])
    ]));
    ta.focus();
  }

  showView();
  return wrap;
}

function buildDrillBeatsSection(q, qid) {
  const wrap = document.createElement("div");
  wrap.className = "drill-section";

  function showView() {
    wrap.innerHTML = "";
    wrap.appendChild(el("div", { class: "drill-section-head" }, [
      el("h3", { text: "story beats" }),
      el("button", { class: "btn ghost small", onClick: showEdit }, ["edit"])
    ]));
    const beats = q.beats || [];
    if (beats.length) {
      const ol = document.createElement("ol");
      for (const b of beats) ol.appendChild(el("li", { text: b }));
      wrap.appendChild(ol);
    } else {
      wrap.appendChild(el("p", { class: "muted", text: "No beats yet. Tap edit to add." }));
    }
  }

  function showEdit() {
    wrap.innerHTML = "";
    const ta = el("textarea", { class: "compact" }, [(q.beats || []).join("\n")]);
    const saveBtn = el("button", { class: "btn small", onClick: async () => {
      const next = ta.value.split("\n").map((s) => s.trim()).filter(Boolean);
      saveBtn.setAttribute("disabled", "");
      try {
        await saveQuestion(state.user.uid, qid, { beats: next });
        q.beats = next;
        if (state.questionsById[qid]) state.questionsById[qid].beats = next;
        showView();
      } catch (err) {
        saveBtn.removeAttribute("disabled");
        alert("Could not save: " + (err?.message || err));
      }
    }}, ["save"]);
    wrap.appendChild(el("h3", { text: "story beats" }));
    wrap.appendChild(el("p", { class: "muted", text: "One beat per line." }));
    wrap.appendChild(ta);
    wrap.appendChild(el("div", { class: "row", style: { marginTop: "8px", gap: "8px" } }, [
      saveBtn,
      el("button", { class: "btn ghost small", onClick: showView }, ["cancel"])
    ]));
    ta.focus();
  }

  showView();
  return wrap;
}

function buildDrillAnswerSection(q, qid) {
  const wrap = document.createElement("div");
  wrap.className = "drill-section";

  function showView() {
    wrap.innerHTML = "";
    wrap.appendChild(el("div", { class: "drill-section-head" }, [
      el("h3", { text: "answer" }),
      el("button", { class: "btn ghost small", onClick: showEdit }, ["edit"])
    ]));
    const body = document.createElement("div");
    body.className = "answer-body";
    body.innerHTML = mdToHtml(q.answer || "");
    wrap.appendChild(body);
  }

  function showEdit() {
    wrap.innerHTML = "";
    const ta = el("textarea", {}, [q.answer || ""]);
    const saveBtn = el("button", { class: "btn small", onClick: async () => {
      const next = ta.value;
      saveBtn.setAttribute("disabled", "");
      try {
        await saveQuestion(state.user.uid, qid, { answer: next });
        q.answer = next;
        if (state.questionsById[qid]) state.questionsById[qid].answer = next;
        showView();
      } catch (err) {
        saveBtn.removeAttribute("disabled");
        alert("Could not save: " + (err?.message || err));
      }
    }}, ["save"]);
    wrap.appendChild(el("h3", { text: "answer" }));
    wrap.appendChild(el("p", { class: "muted", text: "Markdown bullets supported." }));
    wrap.appendChild(ta);
    wrap.appendChild(el("div", { class: "row", style: { marginTop: "8px", gap: "8px" } }, [
      saveBtn,
      el("button", { class: "btn ghost small", onClick: showView }, ["cancel"])
    ]));
    ta.focus();
  }

  showView();
  return wrap;
}

function buildBeatsCard(q, qid) {
  const card = el("div", { class: "card anchor-card" }, []);

  function showView() {
    card.innerHTML = "";
    card.appendChild(el("div", { class: "anchor-head" }, [
      el("h3", { text: "Story beats" }),
      el("button", { class: "btn ghost small", onClick: showEdit }, ["edit"])
    ]));
    const beats = q.beats || [];
    if (beats.length) {
      const ol = document.createElement("ol");
      ol.style.paddingLeft = "20px";
      ol.style.margin = "6px 0 0";
      for (const b of beats) ol.appendChild(el("li", { text: b }));
      card.appendChild(ol);
    } else {
      card.appendChild(el("p", { class: "muted", text: "No beats yet. Tap edit to add.", style: { margin: "6px 0 0" } }));
    }
  }

  function showEdit() {
    card.innerHTML = "";
    const ta = el("textarea", { class: "compact" }, [(q.beats || []).join("\n")]);
    const saveBtn = el("button", { class: "btn small", onClick: async () => {
      const next = ta.value.split("\n").map((s) => s.trim()).filter(Boolean);
      saveBtn.setAttribute("disabled", "");
      try {
        await saveQuestion(state.user.uid, qid, { beats: next });
        q.beats = next;
        if (state.questionsById[qid]) state.questionsById[qid].beats = next;
        showView();
      } catch (err) {
        saveBtn.removeAttribute("disabled");
        alert("Could not save: " + (err?.message || err));
      }
    }}, ["save"]);
    card.appendChild(el("h3", { text: "Story beats" }));
    card.appendChild(el("p", { class: "muted", text: "One beat per line.", style: { margin: "2px 0 8px" } }));
    card.appendChild(ta);
    card.appendChild(el("div", { class: "row", style: { marginTop: "10px", gap: "8px" } }, [
      saveBtn,
      el("button", { class: "btn ghost small", onClick: showView }, ["cancel"])
    ]));
    ta.focus();
  }

  showView();
  return card;
}

// ---------- mock mode ----------

const mockState = {
  count: 10,
  themes: new Set(Object.keys(THEMES)),
  queue: [],
  idx: 0,
  startedAt: 0,
  questionStartedAt: 0,
  secondsPerQ: 60,
  tickerId: null,
  sessionId: null,
  ratings: {} // qid -> rating
};

function renderMockIntro() {
  const countSelect = el("select", { id: "mockCount" },
    [5, 10, 15].map((n) =>
      el("option", { value: n, selected: n === mockState.count }, [String(n)])
    )
  );
  const secSelect = el("select", { id: "mockSec" },
    [45, 60, 90].map((n) =>
      el("option", { value: n, selected: n === mockState.secondsPerQ }, [String(n) + "s per question"])
    )
  );
  const themeBoxes = Object.entries(THEMES).map(([t, v]) => {
    const id = "th_" + t;
    return el("label", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "6px 0" } }, [
      el("input", { type: "checkbox", id, value: t, checked: mockState.themes.has(t) }),
      el("span", { text: `${t} · ${v.name}` })
    ]);
  });

  mount(
    el("h1", { text: "Live" }),
    el("p", { class: "muted", text: "Random draw, timed, no pauses. Rate each one after." }),
    el("div", { class: "card" }, [
      el("h3", { text: "How many?" }),
      countSelect,
      el("h3", { text: "Time per question" }),
      secSelect,
      el("h3", { text: "Themes to include" }),
      ...themeBoxes
    ]),
    el("button", { class: "btn block", onClick: startMock }, [
      el("span", { text: "start live" }),
      el("span", { class: "arrow", "aria-hidden": "true", text: "\u2192" })
    ])
  );
}

async function startMock() {
  mockState.count = Number(document.getElementById("mockCount").value);
  mockState.secondsPerQ = Number(document.getElementById("mockSec").value);
  const selected = new Set();
  document.querySelectorAll("#view input[type=checkbox]").forEach((el) => {
    if (el.checked) selected.add(el.value);
  });
  mockState.themes = selected.size ? selected : new Set(Object.keys(THEMES));

  const pool = state.questions.filter((q) => mockState.themes.has(q.theme));
  if (!pool.length) { alert("No questions in those themes."); return; }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  mockState.queue = shuffled.slice(0, mockState.count);
  mockState.idx = 0;
  mockState.ratings = {};
  mockState.startedAt = Date.now();
  mockState.sessionId = await startSession(state.user.uid, "mock", {
    count: mockState.queue.length,
    secondsPerQ: mockState.secondsPerQ
  });
  go("mock-run");
}

function renderMockRun() {
  if (!mockState.queue.length) { go("mock"); return; }
  const q = mockState.queue[mockState.idx];
  mockState.questionStartedAt = Date.now();

  const timerEl = el("div", { class: "timer", text: formatSecs(mockState.secondsPerQ) });
  const promptEl = el("h1", { class: "drill-prompt", text: q.prompt });
  const anchorDetail = el("details", {}, [
    el("summary", { text: "peek anchor" }),
    el("p", { text: q.anchor })
  ]);

  const nextBtn = el("button", { class: "btn block", onClick: advance }, ["next"]);

  function advance() {
    if (mockState.tickerId) { clearInterval(mockState.tickerId); mockState.tickerId = null; }
    mockState.idx++;
    if (mockState.idx >= mockState.queue.length) {
      go("mock-rate");
    } else {
      renderMockRun();
    }
  }

  mount(
    el("div", { class: "qmeta", style: { margin: "6px 0" } }, [
      document.createTextNode(`${mockState.idx + 1} / ${mockState.queue.length}`)
    ]),
    timerEl,
    promptEl,
    anchorDetail,
    nextBtn,
    el("button", { class: "btn ghost", style: { marginTop: "8px" }, onClick: () => {
      if (confirm("End live and rate?")) { if (mockState.tickerId) clearInterval(mockState.tickerId); go("mock-rate"); }
    }}, ["end early"])
  );

  // ticker
  const end = mockState.questionStartedAt + mockState.secondsPerQ * 1000;
  mockState.tickerId = setInterval(() => {
    const left = Math.ceil((end - Date.now()) / 1000);
    timerEl.textContent = formatSecs(Math.max(0, left));
    timerEl.classList.toggle("warning", left <= 15 && left > 5);
    timerEl.classList.toggle("over", left <= 5);
    if (left <= 0) {
      clearInterval(mockState.tickerId);
      mockState.tickerId = null;
      advance();
    }
  }, 250);
}

function formatSecs(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function renderMockRate() {
  if (!mockState.queue.length) { go("mock"); return; }

  const saveAll = async () => {
    const tasks = mockState.queue
      .map((q) => {
        const r = mockState.ratings[q.id];
        if (!r) return null;
        return logPractice(state.user.uid, {
          questionId: q.id,
          mode: "mock",
          rating: r,
          durationSec: mockState.secondsPerQ,
          sessionId: mockState.sessionId
        });
      })
      .filter(Boolean);
    await Promise.all(tasks);
    await endSession(state.user.uid, mockState.sessionId, {
      ratedCount: Object.keys(mockState.ratings).length
    });
    await refreshData();
    go("home");
  };

  const cards = mockState.queue.map((q, idx) => {
    const rateRow = el("div", { class: "rating-row" }, [1, 2, 3, 4, 5].map((n) => {
      const btn = el("button", { class: "btn secondary", onClick: () => {
        mockState.ratings[q.id] = n;
        rateRow.querySelectorAll("button").forEach((b) => b.classList.remove("chosen"));
        btn.classList.add("chosen");
      }}, [String(n)]);
      return btn;
    }));

    const beatsHtml = q.beats?.length
      ? `<h3>beats</h3><ol>${q.beats.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ol>`
      : "";

    const detailsContent = document.createElement("div");
    detailsContent.innerHTML = `
      <p class="anchor-text">${escapeHtml(q.anchor || "")}</p>
      <div class="answer-body">${mdToHtml(q.answer || "")}</div>
      ${beatsHtml}
    `;

    const details = el("details", { open: idx === 0 }, [
      el("summary", { text: "show anchor + answer" }),
      detailsContent
    ]);

    return el("div", { class: "card mock-rate-card" }, [
      el("div", { class: "qmeta" }, [
        document.createTextNode(`${idx + 1} / ${mockState.queue.length}`)
      ]),
      el("div", { class: "qtitle", text: q.title }),
      el("p", { class: "qprompt", text: q.prompt }),
      details,
      rateRow
    ]);
  });

  mount(
    el("h1", { text: "Rate the live run" }),
    el("p", { class: "muted", text: "1 = fumbled · 5 = clean. Open the answer while rating if it helps." }),
    ...cards,
    el("button", { class: "btn block", style: { marginTop: "16px" }, onClick: saveAll }, ["save + finish"])
  );
}

// ---------- history ----------

async function handleResetReadiness() {
  const n = state.logs.length;
  const msg = n
    ? `Reset readiness? This permanently deletes ${n} practice log${n === 1 ? "" : "s"}.`
    : "Reset readiness? There is nothing to delete right now.";
  if (!confirm(msg)) return;
  try {
    await clearAllLogs(state.user.uid);
    await refreshData();
    go("home");
  } catch (err) {
    alert("Could not reset: " + (err?.message || err));
  }
}

function renderHistory() {
  const header = el("div", { class: "history-head" }, [
    el("h1", { text: "history", style: { margin: "0" } }),
    el("button", { class: "btn ghost small", onClick: handleResetReadiness }, ["reset readiness"])
  ]);
  const nodes = [header];

  if (!state.logs.length) {
    nodes.push(el("div", { class: "empty" }, [el("p", { text: "No practice yet. Start from home." })]));
    mount(...nodes);
    return;
  }

  // group by date
  const byDate = {};
  for (const l of state.logs) {
    const t = l.ts?.toDate?.();
    if (!t) continue;
    const key = t.toLocaleDateString();
    (byDate[key] ||= []).push(l);
  }

  for (const [date, logs] of Object.entries(byDate)) {
    nodes.push(el("div", { class: "history-day-head" }, [
      el("h2", { text: date, style: { margin: "0" } }),
      el("button", { class: "btn ghost small", onClick: () => handleDeleteDay(date, logs) }, ["delete"])
    ]));
    nodes.push(el("div", { class: "card" }, logs.map((l) => {
      const q = state.questionsById[l.questionId];
      return el("div", { class: "log-row" }, [
        el("span", { class: "log-mode", text: modeLabel(l.mode) }),
        el("span", { text: q?.title || l.questionId, style: { flex: "1", overflow: "hidden", textOverflow: "ellipsis" } }),
        el("span", { text: `${l.rating}/5`, class: "qmeta" })
      ]);
    })));
  }

  mount(...nodes);
}

async function handleDeleteDay(date, logs) {
  const n = logs.length;
  if (!confirm(`Delete ${n} log${n === 1 ? "" : "s"} from ${date}?`)) return;
  try {
    const ids = logs.map((l) => l.id).filter(Boolean);
    await clearLogsByIds(state.user.uid, ids);
    await refreshData();
    renderHistory();
  } catch (err) {
    alert("Could not delete: " + (err?.message || err));
  }
}

// ---------- edit ----------

function renderEdit(qid) {
  const q = state.questionsById[qid];
  if (!q) { go("list"); return; }

  const titleInput = el("input", { type: "text", value: q.title });
  const anchorInput = el("textarea", { class: "compact" }, [q.anchor || ""]);
  const answerInput = el("textarea", {}, [q.answer || ""]);
  const beatsInput = el("textarea", { class: "compact" }, [(q.beats || []).join("\n")]);

  async function save() {
    const patch = {
      title: titleInput.value.trim() || q.title,
      anchor: anchorInput.value.trim(),
      answer: answerInput.value,
      beats: beatsInput.value.split("\n").map((s) => s.trim()).filter(Boolean)
    };
    await saveQuestion(state.user.uid, qid, patch);
    await refreshData();
    go(`detail/${qid}`);
  }

  mount(
    el("h1", { text: "edit" }),
    el("div", { class: "card" }, [
      el("h3", { text: "title" }),
      titleInput,
      el("h3", { text: "anchor phrase" }),
      anchorInput,
      el("h3", { text: "answer (markdown bullets)" }),
      answerInput,
      q.type === "story" ? el("h3", { text: "story beats (one per line)" }) : null,
      q.type === "story" ? beatsInput : null
    ]),
    el("div", { class: "row stretch" }, [
      el("button", { class: "btn", onClick: save }, ["save"]),
      el("button", { class: "btn ghost", onClick: () => go(`detail/${qid}`) }, ["cancel"])
    ])
  );
}

// ---------- new question ----------

function renderNew() {
  const titleInput = el("input", { type: "text", placeholder: "Short title" });
  const promptInput = el("textarea", { class: "compact", placeholder: "The interviewer's question as you want it framed" });

  const themeSelect = el("select", { id: "newTheme" },
    Object.entries(THEMES).map(([k, v]) =>
      el("option", { value: k }, [`${k} · ${v.name}`])
    )
  );

  const typeSelect = el("select", { id: "newType" }, [
    el("option", { value: "framework" }, ["framework"]),
    el("option", { value: "story" }, ["story"])
  ]);

  const anchorInput = el("textarea", { class: "compact", placeholder: "One or two sentences to land" });
  const beatsInput = el("textarea", { class: "compact", placeholder: "One beat per line" });
  const answerInput = el("textarea", { placeholder: "Use - bullets. Markdown supported." });

  async function save() {
    const title = titleInput.value.trim();
    if (!title) { alert("A title helps you find it later."); titleInput.focus(); return; }
    const data = {
      title,
      prompt: promptInput.value.trim(),
      theme: themeSelect.value,
      type: typeSelect.value,
      anchor: anchorInput.value.trim(),
      beats: beatsInput.value.split("\n").map((s) => s.trim()).filter(Boolean),
      answer: answerInput.value
    };
    saveBtn.setAttribute("disabled", "");
    try {
      const newId = await createQuestion(state.user.uid, data);
      await refreshData();
      go(`detail/${newId}`);
    } catch (err) {
      saveBtn.removeAttribute("disabled");
      alert("Could not save: " + (err?.message || err));
    }
  }

  const saveBtn = el("button", { class: "btn", onClick: save }, [
    el("span", { text: "save" }),
    el("span", { class: "arrow", "aria-hidden": "true", text: "\u2192" })
  ]);

  mount(
    el("h1", { text: "new question" }),
    el("p", { class: "muted", text: "Stored in your library. You can drill, live-run and edit it like any seed question." }),
    el("div", { class: "card" }, [
      el("h3", { text: "title" }),
      titleInput,
      el("h3", { text: "prompt" }),
      promptInput,
      el("h3", { text: "theme" }),
      themeSelect,
      el("h3", { text: "type" }),
      typeSelect,
      el("h3", { text: "anchor phrase" }),
      anchorInput,
      el("h3", { text: "story beats (one per line)" }),
      beatsInput,
      el("h3", { text: "answer (markdown bullets)" }),
      answerInput
    ]),
    el("div", { class: "row stretch", style: { marginTop: "12px" } }, [
      saveBtn,
      el("button", { class: "btn ghost", onClick: () => go("list") }, ["cancel"])
    ])
  );
  setTimeout(() => titleInput.focus(), 0);
}
