# Connecticut Driver's Manual — Practice Test (v1.4.1)

[GitHub](https://github.com/darthrater78/ct-driver-practice-test) · [Release notes for v1.4.1](https://github.com/darthrater78/ct-driver-practice-test/releases/tag/v1.4.1) · [Changelog](CHANGELOG.md)

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
- **Choose how many** — chips pick a **10**, **25** (matches the real exam), or **50**
  (all) question test. Shorter tests draw a random subset when Randomize is on.
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
  enter the same name elsewhere to continue. The dashboard always lists all accounts
  (tap a name to continue as it) and lets you **delete** one (purging its data from
  `db.json`). Listing and deletion are public — a trusted-network feature; gate it with
  `REGISTRATION_OPEN=false` and your proxy. Without a backend (opened as a plain file)
  the app runs in guest mode using `localStorage`.
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
| `CHANGELOG.md` | Release notes; the release workflow publishes each version's section. |
| `.github/workflows/` | CI (build + tests on PRs), release (publishes `v*` tags), weekly image scan, CodeQL, workflow lint. |
| `scripts/ci-changes.sh` | Lets CI skip the build for docs-only changes. |
| `trivy.yaml`, `.trivyignore.yaml` | Image scan settings and the (dated, expiring) list of accepted findings. |

## Run as a Docker container

Lightweight: the runtime is a single `node:alpine` image running a **zero-dependency**
Node server (no npm install, no native builds). A throwaway build stage regenerates the
HTML and runs both tests, so a bad answer key or broken auth fails the image build.

Accounts and score history persist to **`/data`** — bind-mount a host directory there.

### Quickstart (published image)

```bash
sudo mkdir -p /opt/docker/ct-driver-test/data && sudo chown -R 1000:1000 /opt/docker/ct-driver-test/data && cd /opt/docker/ct-driver-test
```

```yaml
services:
  ct-driver-test:
    image: ghcr.io/darthrater78/ct-driver-practice-test:1.4.1
    container_name: ct-driver-test
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - REGISTRATION_OPEN=true
    volumes:
      - /opt/docker/ct-driver-test/data:/data

# image: pinned to this release (1.4.1), updated with every release
# ports: 8080 is the web UI. Change the left side for a different host port
# REGISTRATION_OPEN: set to false after creating your names to lock the list
# /opt/docker/ct-driver-test/data: accounts, score history and the session secret.
#   Must be writable by uid 1000 (the mkdir line above does that). Back it up
```

Save it as **`compose.yaml`** in `/opt/docker/ct-driver-test`, then run
`docker compose up -d` and open `http://<host>:8080`.

### Build it yourself

The repo's `docker-compose.yml` builds from source (data in `./data`):

```bash
mkdir -p data && sudo chown -R 1000:1000 data && docker compose up -d --build
```

**Environment variables**

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `8080` | Port the server listens on. |
| `DATA_DIR` | `/data` | Where accounts + the server secret are stored (bind-mount this). |
| `REGISTRATION_OPEN` | `true` | Set `false` to disable new sign-ups after creating accounts. |

The container runs as the non-root `node` user (uid 1000), so the bind-mounted
`/data` must be writable by uid 1000 — the server prints a `chown` hint and exits
if it isn't.

Accounts are **passwordless** — a name is just a handle to sync progress, so anyone
who knows a name can read/overwrite that progress (fine for a study tool). Sessions
are HMAC-signed httpOnly cookies (secret persisted in `DATA_DIR`); the name endpoint
is rate-limited and input is validated/size-bounded. Put it behind your HTTPS reverse
proxy for remote access (the session cookie sets `Secure` automatically over HTTPS).
Set `REGISTRATION_OPEN=false` after creating your names to lock the list.

## Security architecture

**Design**
- **Input:** the browser talks to `server.js` over HTTP on port 8080. Names and
  progress are validated and size-bounded; the name and delete endpoints are
  rate-limited per client IP.
- **Accounts:** passwordless. A name is a handle, not a secret: anyone who knows a
  name can read or overwrite its progress, and the account list and deletion are
  public. Meant for a trusted network; `REGISTRATION_OPEN=false` stops new names.
- **Sessions:** HMAC-SHA256-signed cookies, `HttpOnly`, `SameSite=Lax`, and
  `Secure` when the request arrived over HTTPS (`X-Forwarded-Proto`).
- **Storage:** `DATA_DIR/db.json` (names, scores, in-progress tests) and
  `DATA_DIR/secret.key` (the cookie-signing key), both written mode `0600`. Neither
  is encrypted at rest; protect the host directory.
- **Network:** plain HTTP. Put it behind an HTTPS reverse proxy for anything beyond
  the LAN.
- **Runtime:** `node:22-alpine`, runs as the non-root `node` user (uid 1000), no npm
  dependencies.
- **Releases:** images are published only from `v*` tags that are on `main`, match
  `VERSION` in `build.js`, and whose commit passed CI. Each image is pushed by
  digest, must pass a Trivy scan (no fixable HIGH/CRITICAL) before it gets a version
  tag, and carries a signed build-provenance attestation. All GitHub Actions are
  pinned to commit SHAs and kept current by Dependabot.

**Changes**
- 2026-10-22 (risk accepted): the rate limit keys on the last `X-Forwarded-For`
  entry, which a client can forge when nothing sits in front of the server. Accepted
  because this app is only run behind a reverse proxy, which sets that header.
- 2026-10-22: runtime moved from Node 20 (end of life, no fix for the October 2026
  Node.js security release) to Node 22.23.4.
- 2026-10-22: release workflow replaced. The old one published any `v*` tag from any
  branch with unpinned actions and no scan; see **Releases** above.

## Rebuild after editing

```bash
node test-randomization.js   # verify the bank + shuffle
node test-server.js          # verify the accounts/data backend
node build.js                # regenerate CT-Driver-Practice-Test.html
```

*Study aid only — not affiliated with the Connecticut DMV. Confirm rules in the official manual.*
