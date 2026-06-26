# Connecticut Driver's Manual — Practice Test (v1.1.0)

A self-contained Windows/browser app: a 50-question practice test built from the
**State of Connecticut DMV Driver's Manual (rev. March 2023)**.

## Use it

Double-click **`CT-Driver-Practice-Test.html`** — it opens in any browser, works
fully offline, installs nothing.

Features:
- **Live scoring** — sticky bar shows answered / correct / running % as you go.
- **Instant feedback** — each answer locks, reveals the correct choice, explains it,
  and cites the **manual page number**. The reference is a relative link to the local
  `Drivers Manual English.pdf` (no internet / external links) and **jumps to the right
  page** via `#page=`. The manual's printed page numbers are offset from the PDF's page
  indices by **+2** (printed p.1 = PDF page 3, verified end-to-end), so the link adds 2.
- **Randomize** — checkbox shuffles question order *and* answer choices for a fresh
  test every time. Correctness always follows the answer text, never its position.
- **Theme toggle** — a header button cycles **Auto / Light / Dark**. Auto follows the
  OS; the choice is saved and applied before first paint (no flash).
- **Resume / Save & exit** — your progress is saved on every answer. Refreshing the
  page resumes the test where you left off (it won't dump you on the dashboard). A
  **Save & exit** button returns to the dashboard, which then offers **Resume test**.
- **Score history** — every attempt is saved (in this browser's `localStorage`):
  KPIs (attempts, best, last-5 average, pass count), a trend sparkline, and a table.
- Pass mark is **80%**, matching the real 25-question knowledge test.

## Accuracy

- Questions 1–10 are the manual's own Study Questions, verbatim, keyed to the
  official answer key on printed page 54.
- Questions 11–50 are authored from the manual text; each carries its page reference.
- `node test-randomization.js` validates the bank (valid keys, unique text, valid
  pages) and hammers the shuffle with 20,000 randomized attempts, asserting the
  correct answer text is never detached from its option. All checks pass.

## Project layout

| File | Purpose |
|------|---------|
| `CT-Driver-Practice-Test.html` | **The deliverable** — single self-contained file. |
| `questions.js` | The 50-question bank (source of truth). |
| `quiz-engine.js` | Shuffle/build logic shared by the app and the test. |
| `app.js` | UI: rendering, live scoring, history. |
| `styles.css` | Styling (auto light/dark). |
| `index.template.html` | HTML shell with inline-injection markers. |
| `build.js` | Inlines the above into the single HTML file. |
| `test-randomization.js` | Accuracy + randomization test harness. |
| `Drivers Manual English.pdf` | The reference manual; answer links open it locally. |
| `manual-source.txt` | Extracted manual text, kept for editing questions later. |

## Run as a Docker container

Super lightweight: the runtime image is just `nginx:alpine` serving the assembled
HTML and the PDF. A throwaway build stage regenerates the HTML from source and runs
the accuracy test, so a bad answer key fails the image build.

```bash
# with docker compose (serves on http://localhost:8080)
docker compose up -d

# or plain docker
docker build -t ct-driver-test .
docker run -d --name ct-driver-test -p 8080:80 ct-driver-test
```

Then open <http://localhost:8080>. The container is stateless — score history and
in-progress tests are saved in the visitor's browser (`localStorage`), not the server.

## Rebuild after editing

```bash
node test-randomization.js   # verify the bank + shuffle
node build.js                # regenerate CT-Driver-Practice-Test.html
```

*Study aid only — not affiliated with the Connecticut DMV. Confirm rules in the official manual.*
