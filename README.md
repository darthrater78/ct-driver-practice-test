# Connecticut Driver's Manual — Practice Test (v1.2.0)

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
- **Score history** — every attempt is saved: KPIs (attempts, best, last-5 average,
  pass count), a trend sparkline, and a table.
- **Accounts & cross-device sync** *(when served by the backend)* — pick a name (no
  password) and your score history and in-progress test follow you to any device;
  enter the same name elsewhere to continue. Without a backend (opened as a plain
  file) the app runs in guest mode using `localStorage`.
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
| `server.js` | Zero-dependency Node backend: static serving + accounts API. |
| `test-randomization.js` | Accuracy + randomization test harness. |
| `test-server.js` | Auth/data round-trip test for the backend. |
| `Drivers Manual English.pdf` | The reference manual; answer links open it locally. |
| `manual-source.txt` | Extracted manual text, kept for editing questions later. |

## Run as a Docker container

Lightweight: the runtime is a single `node:alpine` image running a **zero-dependency**
Node server (no npm install, no native builds). A throwaway build stage regenerates the
HTML and runs both tests, so a bad answer key or broken auth fails the image build.

Accounts and score history persist to **`/data`** — bind-mount a host directory there.

```bash
# with docker compose (serves on http://localhost:8080, data in ./data)
docker compose up -d

# or plain docker with a bind mount
docker build -t ct-driver-test .
docker run -d --name ct-driver-test -p 8080:8080 \
  -v /opt/docker/ct-driver-test:/data ct-driver-test
```

Then open <http://localhost:8080>.

**Environment variables**

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `8080` | Port the server listens on. |
| `DATA_DIR` | `/data` | Where accounts + the server secret are stored (bind-mount this). |
| `REGISTRATION_OPEN` | `true` | Set `false` to disable new sign-ups after creating accounts. |

The container runs as the non-root `node` user (uid 1000), so the bind-mounted
`/data` must be writable by uid 1000 — the server prints a `chown` hint and exits
if it isn't:

```bash
sudo mkdir -p /opt/docker/ct-driver-test && sudo chown -R 1000:1000 /opt/docker/ct-driver-test
```

Accounts are **passwordless** — a name is just a handle to sync progress, so anyone
who knows a name can read/overwrite that progress (fine for a study tool). Sessions
are HMAC-signed httpOnly cookies (secret persisted in `DATA_DIR`); the name endpoint
is rate-limited and input is validated/size-bounded. Put it behind your HTTPS reverse
proxy for remote access (the session cookie sets `Secure` automatically over HTTPS).
Set `REGISTRATION_OPEN=false` after creating your names to lock the list.

## Rebuild after editing

```bash
node test-randomization.js   # verify the bank + shuffle
node test-server.js          # verify the accounts/data backend
node build.js                # regenerate CT-Driver-Practice-Test.html
```

*Study aid only — not affiliated with the Connecticut DMV. Confirm rules in the official manual.*
