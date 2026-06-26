/* App UI — depends on globals QUESTIONS and QuizEngine (inlined by build). */
(function () {
  "use strict";

  var PASS_PCT = 80;                              // CT knowledge test pass mark is 20/25 = 80%
  var HISTORY_KEY = "ctDriverTest.history.v1";
  var PROGRESS_KEY = "ctDriverTest.inProgress.v1"; // saved mid-test session
  var THEME_KEY = "ctDriverTest.theme";            // "auto" | "light" | "dark"
  var THEMES = [
    { id: "auto", label: "Auto", icon: "🖥️" },
    { id: "light", label: "Light", icon: "☀️" },
    { id: "dark", label: "Dark", icon: "🌙" }
  ];
  var MANUAL_FILE = "Drivers Manual English.pdf";  // local reference, kept beside this app
  // Printed page numbers are offset from PDF page indices by 2 (printed p.1 == PDF page 3,
  // verified end-to-end). #page= jumps the viewer to the right section.
  var PDF_PAGE_OFFSET = 2;
  var LETTERS = ["A", "B", "C", "D", "E"];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // Live session. responses[i] = chosen option index, or null if unanswered.
  var state = { attempt: [], responses: [], mode: "ordered" };

  /* ---------- persistence: in-progress session ---------- */
  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        v: 1, mode: state.mode, attempt: state.attempt, responses: state.responses
      }));
    } catch (e) {}
  }
  function loadProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      // sanity-check shape so a stale/corrupt blob can't wedge the app
      if (!p || !Array.isArray(p.attempt) || !Array.isArray(p.responses) ||
          p.attempt.length !== p.responses.length || !p.attempt.length) return null;
      var ok = p.attempt.every(function (it) {
        return it && Array.isArray(it.options) && typeof it.correctIndex === "number" && typeof it.q === "string";
      });
      return ok ? p : null;
    } catch (e) { return null; }
  }
  function clearProgress() {
    try { localStorage.removeItem(PROGRESS_KEY); } catch (e) {}
  }
  function progressCounts(p) {
    var answered = 0, correct = 0;
    p.responses.forEach(function (r, i) {
      if (r != null) { answered++; if (r === p.attempt[i].correctIndex) correct++; }
    });
    return { answered: answered, correct: correct, total: p.attempt.length };
  }

  /* ---------- persistence: score history ---------- */
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveHistory(list) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function recordAttempt(correct, total, mode) {
    var list = loadHistory();
    list.push({ ts: Date.now(), correct: correct, total: total, pct: Math.round((correct / total) * 100), mode: mode });
    if (list.length > 100) list = list.slice(list.length - 100);
    saveHistory(list);
    renderHistory();
  }

  function fmtDate(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  /* ---------- dashboard (start screen) ---------- */
  function renderResumeBanner() {
    var banner = $("#resume-banner");
    var p = loadProgress();
    banner.innerHTML = "";
    if (!p) { banner.classList.add("hidden"); return; }
    banner.classList.remove("hidden");

    var c = progressCounts(p);
    banner.appendChild(el("div", "resume-title", "You have a test in progress"));
    banner.appendChild(el("div", "hint",
      c.answered + " of " + c.total + " answered · " +
      (p.mode === "random" ? "randomized" : "in order")));

    var row = el("div", "row");
    row.style.marginTop = "10px";
    var resume = el("button", "btn primary", "Resume test");
    resume.onclick = function () { resumeProgress(); };
    var discard = el("button", "btn ghost", "Discard & start over");
    discard.onclick = function () {
      if (confirm("Discard your in-progress test? Your saved answers will be lost.")) {
        clearProgress(); renderResumeBanner();
      }
    };
    row.appendChild(resume); row.appendChild(discard);
    banner.appendChild(row);
    banner.appendChild(el("hr", "sep"));
  }

  function showDashboard() {
    $("#scorebar").classList.add("hidden");
    $("#quiz").classList.add("hidden");
    $("#results").classList.add("hidden");
    $("#start").classList.remove("hidden");
    renderResumeBanner();
    renderHistory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- score history view ---------- */
  function renderHistory() {
    var box = $("#history");
    var list = loadHistory();
    box.innerHTML = "";
    box.appendChild(el("h2", null, "Score History"));

    if (!list.length) {
      box.appendChild(el("p", "empty", "No attempts yet. Take the test and your progress will show up here."));
      return;
    }

    var attempts = list.length;
    var best = list.reduce(function (m, r) { return Math.max(m, r.pct); }, 0);
    var recent = list.slice(-5);
    var recentAvg = Math.round(recent.reduce(function (s, r) { return s + r.pct; }, 0) / recent.length);
    var passes = list.filter(function (r) { return r.pct >= PASS_PCT; }).length;

    var kpis = el("div", "kpis");
    [["Attempts", attempts], ["Best", best + "%"], ["Last 5 avg", recentAvg + "%"], ["Passed", passes + "/" + attempts]]
      .forEach(function (k) {
        var d = el("div", "kpi");
        d.appendChild(el("b", null, String(k[1])));
        d.appendChild(el("span", null, k[0]));
        kpis.appendChild(d);
      });
    box.appendChild(kpis);

    var spark = el("div", "spark");
    list.slice(-20).forEach(function (r) {
      var bar = el("div", "bar " + (r.pct >= PASS_PCT ? "pass" : "fail"));
      bar.style.height = Math.max(8, r.pct) + "%";
      bar.title = fmtDate(r.ts) + " — " + r.pct + "%";
      spark.appendChild(bar);
    });
    box.appendChild(spark);
    box.appendChild(el("div", "hint", "Trend of your last " + Math.min(20, list.length) + " attempts (green = pass, red = below " + PASS_PCT + "%)"));

    var tableWrap = el("div", "history");
    var table = el("table");
    var thead = el("thead");
    var htr = el("tr");
    ["When", "Score", "%", "Mode"].forEach(function (h) { htr.appendChild(el("th", null, h)); });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = el("tbody");
    list.slice().reverse().slice(0, 12).forEach(function (r) {
      var tr = el("tr");
      tr.appendChild(el("td", null, fmtDate(r.ts)));
      tr.appendChild(el("td", null, r.correct + " / " + r.total));
      var sc = el("td", "score");
      sc.appendChild(el("b", r.pct >= PASS_PCT ? "pass" : "fail", r.pct + "%"));
      tr.appendChild(sc);
      tr.appendChild(el("td", "muted", r.mode === "random" ? "Randomized" : "In order"));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); tableWrap.appendChild(table); box.appendChild(tableWrap);

    var clear = el("button", "btn ghost small", "Clear history");
    clear.style.marginTop = "12px";
    clear.onclick = function () {
      if (confirm("Delete all saved attempts? This cannot be undone.")) { saveHistory([]); renderHistory(); }
    };
    box.appendChild(clear);
  }

  /* ---------- live score bar ---------- */
  function recomputeCounts() {
    var answered = 0, correct = 0;
    state.responses.forEach(function (r, i) {
      if (r != null) { answered++; if (r === state.attempt[i].correctIndex) correct++; }
    });
    return { answered: answered, correct: correct };
  }
  function renderScorebar() {
    var total = state.attempt.length;
    var c = recomputeCounts();
    var pct = c.answered ? Math.round((c.correct / c.answered) * 100) : 0;
    $("#sb-answered").textContent = c.answered + " / " + total;
    $("#sb-correct").textContent = c.correct;
    $("#sb-pct").textContent = pct + "%";
    $("#sb-fill").style.width = (total ? (c.answered / total) * 100 : 0) + "%";
  }

  /* ---------- start / resume a test ---------- */
  function startTest(randomize) {
    state.mode = randomize ? "random" : "ordered";
    state.attempt = QuizEngine.buildAttempt(QUESTIONS, {
      shuffleQuestions: randomize, shuffleOptions: randomize
    });
    state.responses = state.attempt.map(function () { return null; });
    saveProgress();
    enterQuiz();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resumeProgress() {
    var p = loadProgress();
    if (!p) { showDashboard(); return; }
    state.mode = p.mode;
    state.attempt = p.attempt;
    state.responses = p.responses;
    enterQuiz();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enterQuiz() {
    $("#start").classList.add("hidden");
    $("#results").classList.add("hidden");
    $("#scorebar").classList.remove("hidden");
    $("#quiz").classList.remove("hidden");

    var quiz = $("#quiz");
    quiz.innerHTML = "";
    state.attempt.forEach(function (item, qi) { quiz.appendChild(renderQuestion(item, qi)); });
    renderScorebar();

    // If a resumed session is already complete, jump straight to results.
    if (state.responses.every(function (r) { return r != null; })) showResults(false);
  }

  function renderQuestion(item, qi) {
    var card = el("div", "card q");

    var meta = el("div", "meta");
    meta.appendChild(el("span", null, "Question " + (qi + 1) + " of " + state.attempt.length));
    meta.appendChild(el("span", null, "Manual p." + item.page));
    card.appendChild(meta);

    card.appendChild(el("p", "stem", item.q));

    var opts = el("div", "opts");
    item.options.forEach(function (opt, oi) {
      var row = el("div", "opt");
      row.appendChild(el("div", "mark", LETTERS[oi]));
      row.appendChild(el("div", "txt", opt.text));
      row.onclick = function () { choose(card, item, qi, oi); };
      opts.appendChild(row);
    });
    card.appendChild(opts);
    card.appendChild(el("div", "feedback"));

    // Replay answered state on resume.
    if (state.responses[qi] != null) applyAnswer(card, item, state.responses[qi]);
    return card;
  }

  // Pure UI: lock the card, reveal correct/wrong, show feedback. No state writes.
  function applyAnswer(card, item, chosen) {
    if (card.dataset.answered === "1") return;
    card.dataset.answered = "1";
    var rows = card.querySelectorAll(".opt");
    var isRight = chosen === item.correctIndex;
    rows.forEach(function (row, oi) {
      row.classList.add("locked");
      row.onclick = null;
      if (oi === item.correctIndex) row.classList.add(isRight ? "correct" : "reveal");
      if (oi === chosen && !isRight) row.classList.add("wrong");
    });
    var fb = $(".feedback", card);
    fb.className = "feedback show " + (isRight ? "ok" : "no");
    fb.innerHTML = "";
    fb.appendChild(el("div", null, (isRight ? "✓ Correct. " : "✗ Not quite. ") + item.why));
    var ref = el("div", "pageref");
    ref.appendChild(document.createTextNode("Reference: "));
    var link = el("a", null, MANUAL_FILE);
    link.href = encodeURI(MANUAL_FILE) + "#page=" + (item.page + PDF_PAGE_OFFSET);
    link.target = "_blank"; link.rel = "noopener";
    ref.appendChild(link);
    ref.appendChild(document.createTextNode(", page " + item.page));
    fb.appendChild(ref);
  }

  function choose(card, item, qi, chosen) {
    if (state.responses[qi] != null) return;       // already answered
    state.responses[qi] = chosen;
    applyAnswer(card, item, chosen);
    renderScorebar();
    saveProgress();
    if (state.responses.every(function (r) { return r != null; })) showResults(true);
  }

  /* ---------- results ---------- */
  function showResults(record) {
    var total = state.attempt.length;
    var c = recomputeCounts();
    var pct = Math.round((c.correct / total) * 100);
    var passed = pct >= PASS_PCT;

    if (record) { recordAttempt(c.correct, total, state.mode); }
    clearProgress();                                // test finished — no longer "in progress"
    renderResumeBanner();

    var box = $("#results");
    box.classList.remove("hidden");
    box.innerHTML = "";
    var card = el("div", "card result");
    card.appendChild(el("div", "big", pct + "%"));
    card.appendChild(el("div", null, c.correct + " of " + total + " correct"));
    card.appendChild(el("div", "verdict " + (passed ? "pass" : "fail"),
      passed ? "PASS — you'd meet the 80% mark" : "Keep studying — " + PASS_PCT + "% needed to pass"));

    var actions = el("div", "row");
    actions.style.marginTop = "14px";
    var again = el("button", "btn primary", "Retake (same order)");
    again.onclick = function () { startTest(false); };
    var rand = el("button", "btn", "New randomized test");
    rand.onclick = function () { startTest(true); };
    var review = el("button", "btn ghost", "Review answers above");
    review.onclick = function () { $("#quiz").scrollIntoView({ behavior: "smooth" }); };
    var dash = el("button", "btn ghost", "Back to dashboard");
    dash.onclick = function () { showDashboard(); };
    actions.appendChild(again); actions.appendChild(rand); actions.appendChild(review); actions.appendChild(dash);
    card.appendChild(actions);
    box.appendChild(card);
    box.scrollIntoView({ behavior: "smooth" });
  }

  /* ---------- theme toggle (Auto / Light / Dark) ---------- */
  function currentTheme() {
    try { return localStorage.getItem(THEME_KEY) || "auto"; } catch (e) { return "auto"; }
  }
  function applyTheme(id) {
    if (!THEMES.some(function (t) { return t.id === id; })) id = "auto";
    document.documentElement.setAttribute("data-theme", id);
    try { localStorage.setItem(THEME_KEY, id); } catch (e) {}
    var t = THEMES.filter(function (x) { return x.id === id; })[0];
    var btn = $("#theme-toggle");
    if (btn) {
      btn.textContent = t.icon + " " + t.label;
      btn.setAttribute("aria-label", "Theme: " + t.label + " (click to change)");
    }
  }
  function initTheme() {
    applyTheme(currentTheme());
    $("#theme-toggle").onclick = function () {
      var ids = THEMES.map(function (x) { return x.id; });
      applyTheme(ids[(ids.indexOf(currentTheme()) + 1) % ids.length]);
    };
  }

  /* ---------- init ---------- */
  function init() {
    initTheme();
    $("#btn-start").onclick = function () {
      // Starting a brand-new test replaces any in-progress one.
      var p = loadProgress();
      if (p && !confirm("Start a new test? This replaces your in-progress test.")) return;
      startTest($("#opt-random").checked);
    };
    $("#sb-exit").onclick = function () {
      saveProgress();          // already saved on each answer, but be explicit
      showDashboard();
    };

    // Refreshing mid-test resumes instead of dumping you on the dashboard.
    var p = loadProgress();
    if (p && progressCounts(p).answered < p.attempt.length) {
      resumeProgress();
    } else {
      showDashboard();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
