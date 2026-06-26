/*
 * Quiz engine — shared by the app (browser) and the test harness (Node).
 *
 * The correctness guarantee: a question's correct answer is tracked by an
 * `isCorrect` flag attached to the option object, NOT by its position. Shuffling
 * reorders the option objects, so the flag always travels with the right text.
 * This is the same logic the de-pattern shuffle in the skill relies on.
 */
(function (global) {
  "use strict";

  // Fisher-Yates shuffle. Accepts an injectable rng (0<=rng()<1) for testability.
  function shuffle(array, rng) {
    rng = rng || Math.random;
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /*
   * Build a runnable attempt from the raw question bank.
   * opts: { shuffleQuestions, shuffleOptions, rng }
   * Returns an array of items shaped:
   *   { q, page, why, options: [{ text, isCorrect }], correctIndex }
   * correctIndex is derived AFTER shuffling, so it always points at the
   * option whose isCorrect flag is true.
   */
  function buildAttempt(bank, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;

    let items = bank.map(function (item, idx) {
      const options = item.options.map(function (text, i) {
        return { text: text, isCorrect: i === item.correct };
      });
      const ordered = opts.shuffleOptions ? shuffle(options, rng) : options;
      return {
        sourceIndex: idx,
        q: item.q,
        page: item.page,
        why: item.why,
        options: ordered,
        correctIndex: ordered.findIndex(function (o) { return o.isCorrect; })
      };
    });

    if (opts.shuffleQuestions) {
      items = shuffle(items, rng);
    }
    return items;
  }

  const api = { shuffle: shuffle, buildAttempt: buildAttempt };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.QuizEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
