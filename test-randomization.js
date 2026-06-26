/*
 * Randomization & answer-key accuracy test.
 *
 * Proves three things that matter for a study tool:
 *   1. The static question bank is well-formed (valid correct index, no dup text).
 *   2. Shuffling options NEVER detaches the correct answer from its text.
 *   3. Shuffling questions preserves the full set (no drops, no duplicates).
 *
 * Run: node test-randomization.js
 */
const QUESTIONS = require("./questions.js");
const { buildAttempt, shuffle } = require("./quiz-engine.js");

let failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.error("  FAIL: " + msg); }
}

// A small seedable PRNG (mulberry32) so the stress test is reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

console.log("CT Driver Practice Test — randomization & key accuracy test\n");

// ---- 1. Bank integrity ----
console.log("[1] Question bank integrity (" + QUESTIONS.length + " questions)");
check(QUESTIONS.length === 50, "expected 50 questions, got " + QUESTIONS.length);
const seenText = new Set();
QUESTIONS.forEach(function (item, i) {
  const n = i + 1;
  check(typeof item.q === "string" && item.q.length > 0, "Q" + n + " has question text");
  check(Array.isArray(item.options) && item.options.length >= 2, "Q" + n + " has >=2 options");
  check(Number.isInteger(item.correct) && item.correct >= 0 && item.correct < item.options.length,
    "Q" + n + " correct index in range");
  check(Number.isInteger(item.page) && item.page >= 1 && item.page <= 54, "Q" + n + " has a valid page reference");
  check(typeof item.why === "string" && item.why.length > 0, "Q" + n + " has an explanation");
  const optSet = new Set(item.options);
  check(optSet.size === item.options.length, "Q" + n + " has no duplicate options");
  check(!seenText.has(item.q), "Q" + n + " question text is unique");
  seenText.add(item.q);
});

// Capture the original correct TEXT for every question — the ground truth.
const truth = QUESTIONS.map(function (item) { return item.options[item.correct]; });

// ---- 2. Option shuffle preserves the correct answer text ----
console.log("[2] Option-shuffle correctness (10,000 randomized attempts)");
let optionMoved = 0;
for (let trial = 0; trial < 10000; trial++) {
  const rng = mulberry32(trial + 1);
  const attempt = buildAttempt(QUESTIONS, { shuffleQuestions: false, shuffleOptions: true, rng: rng });
  attempt.forEach(function (it) {
    // exactly one correct option
    const correctCount = it.options.filter(function (o) { return o.isCorrect; }).length;
    check(correctCount === 1, "Q(src " + it.sourceIndex + ") must have exactly one correct option");
    // correctIndex points at the correct option
    check(it.options[it.correctIndex] && it.options[it.correctIndex].isCorrect,
      "correctIndex points at the flagged option");
    // the flagged option's TEXT equals the original correct text
    check(it.options[it.correctIndex].text === truth[it.sourceIndex],
      "correct text preserved for src " + it.sourceIndex);
    if (it.correctIndex !== QUESTIONS[it.sourceIndex].correct) optionMoved++;
  });
}
console.log("    (correct answer changed position in " + optionMoved + " cases — all still mapped correctly)");

// ---- 3. Question shuffle preserves the set ----
console.log("[3] Question-shuffle completeness (10,000 randomized attempts)");
for (let trial = 0; trial < 10000; trial++) {
  const rng = mulberry32(trial + 777);
  const attempt = buildAttempt(QUESTIONS, { shuffleQuestions: true, shuffleOptions: true, rng: rng });
  check(attempt.length === QUESTIONS.length, "attempt keeps all questions");
  const idxs = attempt.map(function (it) { return it.sourceIndex; }).sort(function (a, b) { return a - b; });
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (idxs[i] !== i) { check(false, "question set incomplete/duplicated after shuffle"); break; }
  }
  // every question still resolves to its true correct text
  attempt.forEach(function (it) {
    check(it.options[it.correctIndex].text === truth[it.sourceIndex],
      "post question-shuffle correct text preserved");
  });
}

// ---- 4. Shuffle actually reorders (sanity: not a no-op) ----
console.log("[4] Shuffle actually permutes");
const r = mulberry32(42);
const base = [0,1,2,3,4,5,6,7,8,9];
let anyDifferent = false;
for (let i = 0; i < 20; i++) {
  const s = shuffle(base, r);
  if (s.join() !== base.join()) anyDifferent = true;
}
check(anyDifferent, "shuffle produces a different order at least once");

console.log("");
if (failures === 0) {
  console.log("ALL CHECKS PASSED — answer key is accurate and randomization is safe.");
  process.exit(0);
} else {
  console.error(failures + " CHECK(S) FAILED.");
  process.exit(1);
}
