"use strict";
/*
 * Server account/data round-trip test (passwordless). Runs the real server on a
 * random port against a throwaway DATA_DIR and exercises the name + data flow.
 *
 * Run: node test-server.js
 */
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ctd-test-"));
process.env.DATA_DIR = tmp;
process.env.REGISTRATION_OPEN = "true";
const { server } = require("./server.js");

let failures = 0;
function check(cond, msg) { if (!cond) { failures++; console.error("  FAIL: " + msg); } }

function req(port, method, urlPath, opts) {
  opts = opts || {};
  return new Promise(function (resolve, reject) {
    const data = opts.body != null ? JSON.stringify(opts.body) : null;
    const headers = {};
    if (data) { headers["Content-Type"] = "application/json"; headers["Content-Length"] = Buffer.byteLength(data); }
    if (opts.cookie) headers["Cookie"] = opts.cookie;
    const r = http.request({ host: "127.0.0.1", port: port, method: method, path: urlPath, headers: headers }, function (res) {
      const chunks = [];
      res.on("data", function (c) { chunks.push(c); });
      res.on("end", function () {
        let parsed = null;
        try { parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch (e) {}
        const setCookie = res.headers["set-cookie"];
        resolve({ status: res.statusCode, json: parsed, cookie: setCookie ? setCookie[0].split(";")[0] : null });
      });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

(async function () {
  console.log("CT Driver Practice Test — server account/data test (passwordless)\n");
  await new Promise(function (r) { server.listen(0, r); });
  const port = server.address().port;
  console.log("[server] listening on :" + port + " (data: " + tmp + ")");

  // 1. unauthenticated /api/me -> 401
  let r = await req(port, "GET", "/api/me");
  check(r.status === 401, "/api/me unauthenticated returns 401 (got " + r.status + ")");

  // 2. create a name
  r = await req(port, "POST", "/api/account", { body: { username: "Tester_1" } });
  check(r.status === 200 && r.json.username === "tester_1" && r.json.created === true,
    "creating a new name succeeds + lowercases + created=true");
  const cookie = r.cookie;
  check(!!cookie && cookie.indexOf("sid=") === 0, "account sets sid cookie");

  // 3. invalid names rejected
  r = await req(port, "POST", "/api/account", { body: { username: "no" } });
  check(r.status === 400, "too-short name rejected");
  r = await req(port, "POST", "/api/account", { body: { username: "__proto__" } });
  check(r.status === 400, "reserved name rejected");
  r = await req(port, "POST", "/api/account", { body: { username: "bad name!" } });
  check(r.status === 400, "name with illegal chars rejected");

  // 4. /api/me with cookie -> 200
  r = await req(port, "GET", "/api/me", { cookie: cookie });
  check(r.status === 200 && r.json.username === "tester_1", "/api/me with session returns the name");

  // 5. save data then read it back
  const payload = { history: [{ ts: 1, correct: 49, total: 50, pct: 98, mode: "ordered" }],
    inProgress: { v: 1, mode: "ordered", attempt: [{ q: "x", options: [], correctIndex: 0 }], responses: [null] } };
  r = await req(port, "PUT", "/api/data", { cookie: cookie, body: payload });
  check(r.status === 200, "PUT /api/data succeeds");
  r = await req(port, "GET", "/api/data", { cookie: cookie });
  check(r.status === 200 && r.json.history.length === 1 && r.json.history[0].pct === 98, "GET /api/data returns saved history");
  check(r.json.inProgress && r.json.inProgress.attempt.length === 1, "GET /api/data returns saved inProgress");

  // 6. data without auth -> 401
  r = await req(port, "GET", "/api/data");
  check(r.status === 401, "GET /api/data unauthenticated returns 401");

  // 7. re-entering the same name = continue (created=false) on a new session, data persists
  r = await req(port, "POST", "/api/account", { body: { username: "tester_1" } });
  check(r.status === 200 && r.json.created === false, "re-entering an existing name returns created=false");
  const cookie2 = r.cookie;
  r = await req(port, "GET", "/api/data", { cookie: cookie2 });
  check(r.status === 200 && r.json.history.length === 1, "data persists for the name across sessions/devices");

  // 8. forged/garbage cookie rejected
  r = await req(port, "GET", "/api/me", { cookie: "sid=not.a.valid.token" });
  check(r.status === 401, "forged session cookie rejected");

  // 9. logout clears cookie
  r = await req(port, "POST", "/api/logout", { cookie: cookie2 });
  check(r.status === 200, "logout returns 200");

  // 10. malformed percent-encoding must NOT crash the process (returns 400, stays up)
  r = await req(port, "GET", "/%");
  check(r.status === 400, "malformed URL returns 400 instead of crashing (got " + r.status + ")");
  r = await req(port, "GET", "/api/me");
  check(typeof r.status === "number", "server still responds after a malformed URL");

  // 11. path traversal is refused
  r = await req(port, "GET", "/../server.js");
  check(r.status === 403 || r.status === 404, "path traversal is refused (got " + r.status + ")");

  // (re-establish a session for the management checks)
  r = await req(port, "POST", "/api/account", { body: { username: "tester_1" } });
  const sess = r.cookie;

  // 12. listing accounts requires a session
  r = await req(port, "GET", "/api/accounts");
  check(r.status === 401, "GET /api/accounts unauthenticated returns 401");

  // 13. create a second account, then list shows both
  await req(port, "POST", "/api/account", { body: { username: "tester_2" } });
  r = await req(port, "GET", "/api/accounts", { cookie: sess });
  check(r.status === 200 && Array.isArray(r.json.accounts), "GET /api/accounts returns a list");
  var names = (r.json.accounts || []).map(function (a) { return a.username; });
  check(names.indexOf("tester_1") > -1 && names.indexOf("tester_2") > -1, "list includes both accounts");
  check(r.json.current === "tester_1", "list marks the current account");

  // 14. delete another account; it disappears from the list and from disk
  r = await req(port, "DELETE", "/api/account", { cookie: sess, body: { username: "tester_2" } });
  check(r.status === 200 && r.json.deletedSelf === false, "delete other account succeeds (deletedSelf=false)");
  r = await req(port, "GET", "/api/accounts", { cookie: sess });
  check((r.json.accounts || []).every(function (a) { return a.username !== "tester_2"; }), "deleted account gone from list");
  check(fs.readFileSync(path.join(tmp, "db.json"), "utf8").indexOf("tester_2") === -1, "deleted account purged from db.json");

  // 15. delete requires a session
  r = await req(port, "DELETE", "/api/account", { body: { username: "tester_1" } });
  check(r.status === 401, "DELETE without session returns 401");

  // 16. delete your own account ends the session and the name no longer resolves
  r = await req(port, "DELETE", "/api/account", { cookie: sess, body: { username: "tester_1" } });
  check(r.status === 200 && r.json.deletedSelf === true, "delete own account returns deletedSelf=true");
  r = await req(port, "GET", "/api/me", { cookie: sess });
  check(r.status === 401, "old session is invalid after the account is deleted");

  // 17. on-disk store never held password/hash/salt fields (passwordless)
  const dbRaw = fs.readFileSync(path.join(tmp, "db.json"), "utf8");
  check(dbRaw.indexOf("hash") === -1 && dbRaw.indexOf("salt") === -1 && dbRaw.indexOf("password") === -1,
    "no password/hash/salt fields stored (passwordless)");

  server.close();
  console.log("");
  if (failures === 0) { console.log("ALL SERVER CHECKS PASSED."); process.exit(0); }
  else { console.error(failures + " SERVER CHECK(S) FAILED."); process.exit(1); }
})().catch(function (e) { console.error(e); process.exit(1); });
