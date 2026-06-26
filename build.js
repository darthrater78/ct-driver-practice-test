/*
 * Build step: inline styles.css, quiz-engine.js, questions.js and app.js into a
 * single self-contained HTML file the user can double-click to open offline.
 * Keeping the JS in separate source files means the same code is what the test
 * harness validates — the deliverable is just an assembled copy.
 *
 * Run: node build.js
 */
const fs = require("fs");
const path = require("path");

const VERSION = "1.3.0";
const dir = __dirname;
const read = function (f) { return fs.readFileSync(path.join(dir, f), "utf8"); };

let html = read("index.template.html");
html = html.replace("/*__STYLES__*/", function () { return read("styles.css"); });
html = html.replace("/*__QUIZ_ENGINE__*/", function () { return read("quiz-engine.js"); });
html = html.replace("/*__QUESTIONS__*/", function () { return read("questions.js"); });
html = html.replace("/*__APP__*/", function () { return read("app.js"); });
html = html.replace(/__VERSION__/g, VERSION);

const out = path.join(dir, "CT-Driver-Practice-Test.html");
fs.writeFileSync(out, html, "utf8");
console.log("Built " + out + " (" + (html.length / 1024).toFixed(1) + " KB)");
