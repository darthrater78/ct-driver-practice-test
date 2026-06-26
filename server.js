"use strict";
/*
 * CT Driver Practice Test — tiny zero-dependency backend.
 *
 * Serves the static app and provides simple accounts so a user's score history
 * and in-progress test follow them across devices. State lives in DATA_DIR
 * (bind-mount this in Docker). No external npm dependencies, no native builds.
 *
 * Accounts are intentionally passwordless — a name is just a handle to track and
 * sync progress. Sessions are HMAC-signed httpOnly cookies (secret persisted in
 * DATA_DIR); the name endpoint is rate-limited and input is validated/bounded.
 * Note: without passwords, anyone who knows a name can read/overwrite that
 * progress. Set REGISTRATION_OPEN=false to lock the name list after setup.
 * Runs fine as a non-root user; just make DATA_DIR writable by that user.
 */
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || "8080", 10);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, "public");
const REGISTRATION_OPEN = (process.env.REGISTRATION_OPEN || "true").toLowerCase() !== "false";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const BODY_LIMIT = 1024 * 1024;                  // 1 MB
const HISTORY_CAP = 200;

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;
const RESERVED = new Set(["__proto__", "constructor", "prototype", "hasownproperty"]);

const DB_FILE = path.join(DATA_DIR, "db.json");
const SECRET_FILE = path.join(DATA_DIR, "secret.key");

function fatalDataDir(e) {
  console.error("FATAL: cannot use DATA_DIR=" + DATA_DIR + " (" + (e.code || e.message) + ").");
  console.error("Make the bind-mounted directory writable by the container user (uid 1000), e.g.:");
  console.error("  sudo chown -R 1000:1000 <host data dir>");
  process.exit(1);
}
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { fatalDataDir(e); }

/* ---------- server secret (for signing session cookies) ---------- */
function getSecret() {
  try { return fs.readFileSync(SECRET_FILE); } catch (e) {}
  try {
    const s = crypto.randomBytes(32);
    fs.writeFileSync(SECRET_FILE, s, { mode: 0o600 });
    return s;
  } catch (e) { fatalDataDir(e); }
}
const SECRET = getSecret();

/* ---------- JSON store (atomic writes) ---------- */
// db = { users: { <username>: { createdAt, data: { history:[], inProgress:null } } } }  (passwordless)
function loadDB() {
  try {
    const o = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    const users = Object.create(null);
    if (o && o.users) for (const k of Object.keys(o.users)) users[k] = o.users[k];
    return { users };
  } catch (e) { return { users: Object.create(null) }; }
}
let db = loadDB();
function persist() {
  try {
    const tmp = DB_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify({ users: db.users }), { mode: 0o600 });
    fs.renameSync(tmp, DB_FILE);
  } catch (e) { console.error("persist failed:", e.message); }
}

/* ---------- session tokens: base64url(payload).hmac ---------- */
function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return body + "." + mac;
}
function verifyToken(token) {
  if (!token || token.indexOf(".") < 0) return null;
  const i = token.indexOf(".");
  const body = token.slice(0, i), mac = token.slice(i + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (e) { return null; }
}

/* ---------- validation ---------- */
function validUsername(u) {
  return typeof u === "string" && USERNAME_RE.test(u) && !RESERVED.has(u.toLowerCase());
}

function sanitizeData(d) {
  const out = { history: [], inProgress: null };
  if (d && Array.isArray(d.history)) {
    out.history = d.history.slice(-HISTORY_CAP).filter(function (r) {
      return r && typeof r === "object" && typeof r.pct === "number";
    });
  }
  if (d && d.inProgress && typeof d.inProgress === "object" && Array.isArray(d.inProgress.attempt)) {
    out.inProgress = d.inProgress;
  }
  return out;
}

/* ---------- rate limiting (auth endpoints) ---------- */
const rl = new Map(); // ip -> [timestamps]
function rateLimited(ip) {
  const now = Date.now(), windowMs = 5 * 60 * 1000, max = 12;
  const hits = (rl.get(ip) || []).filter(function (t) { return now - t < windowMs; });
  hits.push(now);
  rl.set(ip, hits);
  if (rl.size > 5000) rl.clear(); // crude prune
  return hits.length > max;
}

/* ---------- http helpers ---------- */
function parseCookies(req) {
  const out = {};
  const h = req.headers.cookie;
  if (!h) return out;
  h.split(";").forEach(function (p) {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function isHttps(req) {
  return (req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
}
function setSessionCookie(req, res, token) {
  const parts = ["sid=" + token, "Path=/", "HttpOnly", "SameSite=Lax",
    "Max-Age=" + Math.floor(SESSION_TTL_MS / 1000)];
  if (isHttps(req)) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}
function clearSessionCookie(req, res) {
  const parts = ["sid=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isHttps(req)) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}
function json(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(s);
}
function readBody(req) {
  return new Promise(function (resolve, reject) {
    let size = 0; const chunks = [];
    req.on("data", function (c) {
      size += c.length;
      if (size > BODY_LIMIT) { reject(new Error("body too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", function () {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { reject(new Error("invalid json")); }
    });
    req.on("error", reject);
  });
}
function currentUser(req) {
  const payload = verifyToken(parseCookies(req).sid);
  if (!payload || !payload.u) return null;
  return db.users[payload.u] ? payload.u : null;
}

/* ---------- static files ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".pdf": "application/pdf",
  ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon" };
function serveStatic(req, res) {
  let rel;
  try { rel = decodeURIComponent(req.url.split("?")[0]); }
  catch (e) { res.writeHead(400, { "Content-Type": "text/plain" }); res.end("bad request"); return; }
  if (rel === "/" || rel === "") rel = "/index.html";
  const full = path.normalize(path.join(PUBLIC_DIR, rel));
  // Must stay within PUBLIC_DIR — require an exact match or a path-separator boundary
  // so a sibling like "<public>-x" can't slip past a bare prefix check.
  if (full !== PUBLIC_DIR && !full.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403); res.end("forbidden"); return;
  }
  fs.readFile(full, function (err, buf) {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full).toLowerCase()] || "application/octet-stream" });
    res.end(buf);
  });
}

/* ---------- API ---------- */
async function handleApi(req, res) {
  const url = req.url.split("?")[0];
  // Rate-limit key: trust the rightmost X-Forwarded-For entry (added by our proxy),
  // not the leftmost (client-spoofable); fall back to the socket address.
  const xff = req.headers["x-forwarded-for"];
  const ip = xff ? xff.split(",").pop().trim() : (req.socket.remoteAddress || "");

  if (url === "/api/me" && req.method === "GET") {
    const u = currentUser(req);
    return u ? json(res, 200, { username: u, registrationOpen: REGISTRATION_OPEN })
             : json(res, 401, { error: "not signed in", registrationOpen: REGISTRATION_OPEN });
  }

  // Passwordless: pick a name to start tracking, or enter an existing name to
  // continue it on another device. Creates the name if new (when allowed).
  if (url === "/api/account" && req.method === "POST") {
    if (rateLimited(ip)) return json(res, 429, { error: "Too many attempts. Try again later." });
    const body = await readBody(req).catch(function () { return null; });
    if (!body) return json(res, 400, { error: "Bad request." });
    const username = String(body.username || "").trim().toLowerCase();
    if (!validUsername(username)) return json(res, 400, { error: "Name must be 3–32 chars: letters, numbers, . _ -" });
    let created = false;
    if (!db.users[username]) {
      if (!REGISTRATION_OPEN) return json(res, 403, { error: "That name doesn't exist and new names are disabled." });
      db.users[username] = { createdAt: Date.now(), data: { history: [], inProgress: null } };
      persist();
      created = true;
    }
    setSessionCookie(req, res, signToken({ u: username, exp: Date.now() + SESSION_TTL_MS }));
    return json(res, 200, { username: username, created: created });
  }

  if (url === "/api/logout" && req.method === "POST") {
    clearSessionCookie(req, res);
    return json(res, 200, { ok: true });
  }

  // List all accounts. Public so the dashboard can show the picker before sign-in.
  // Trusted-network feature (passwordless): gate exposure with REGISTRATION_OPEN +
  // your reverse proxy. `current` reflects the caller's session if any.
  if (url === "/api/accounts" && req.method === "GET") {
    const u = currentUser(req); // may be null
    const accounts = Object.keys(db.users).map(function (name) {
      const d = (db.users[name] && db.users[name].data) || {};
      return { username: name, attempts: Array.isArray(d.history) ? d.history.length : 0,
        hasInProgress: !!d.inProgress, createdAt: db.users[name].createdAt || null };
    }).sort(function (a, b) { return a.username < b.username ? -1 : 1; });
    return json(res, 200, { accounts: accounts, current: u });
  }

  // Delete an account and purge its stored data. Public (rate-limited) so it can be
  // managed from the dashboard without signing in first.
  if (url === "/api/account" && req.method === "DELETE") {
    if (rateLimited(ip)) return json(res, 429, { error: "Too many attempts. Try again later." });
    const body = await readBody(req).catch(function () { return null; });
    if (!body) return json(res, 400, { error: "Bad request." });
    const target = String(body.username || "").trim().toLowerCase();
    if (!validUsername(target)) return json(res, 400, { error: "Invalid name." });
    if (!db.users[target]) return json(res, 404, { error: "No such account." });
    const deletedSelf = currentUser(req) === target; // capture before deleting
    delete db.users[target];
    persist();
    if (deletedSelf) clearSessionCookie(req, res); // you deleted the name you were using
    return json(res, 200, { ok: true, deletedSelf: deletedSelf });
  }

  if (url === "/api/data") {
    const u = currentUser(req);
    if (!u) return json(res, 401, { error: "not signed in" });
    if (req.method === "GET") return json(res, 200, db.users[u].data || { history: [], inProgress: null });
    if (req.method === "PUT") {
      const body = await readBody(req).catch(function () { return null; });
      if (!body) return json(res, 400, { error: "Bad request." });
      db.users[u].data = sanitizeData(body);
      persist();
      return json(res, 200, { ok: true });
    }
  }

  return json(res, 404, { error: "not found" });
}

/* ---------- server ---------- */
const server = http.createServer(function (req, res) {
  try {
    if (req.url.startsWith("/api/")) {
      handleApi(req, res).catch(function () { try { json(res, 500, { error: "server error" }); } catch (e) {} });
    } else {
      serveStatic(req, res);
    }
  } catch (e) {
    // Never let a single bad request take the process down.
    try { res.writeHead(500, { "Content-Type": "text/plain" }); res.end("server error"); } catch (e2) {}
  }
});

if (require.main === module) {
  server.listen(PORT, function () {
    console.log("CT Driver Practice Test listening on :" + PORT + " (data: " + DATA_DIR +
      ", registration " + (REGISTRATION_OPEN ? "open" : "closed") + ")");
  });
}

module.exports = { server, _internal: { signToken, verifyToken, validUsername, sanitizeData } };
