#!/usr/bin/env node
/**
 * CSS usage audit (static, best-effort).
 *
 * Reports:
 * - Suspicious unused class selectors (e.g. .btn) not referenced anywhere in src/
 * - Suspicious unused id selectors (e.g. #app) not referenced anywhere in src/
 *
 * Notes:
 * - This is a heuristic. Dynamic class generation, markdown-rendered HTML, and
 *   third-party widgets can create false positives.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CSS_DIR = path.join(ROOT, "src", "assets", "css");
const SRC_DIR = path.join(ROOT, "src");

function walkFiles(dir, predicate) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules") continue;
        if (ent.name === "_site") continue;
        stack.push(full);
      }
      else if (ent.isFile() && predicate(full)) out.push(full);
    }
  }
  return out;
}

function readUtf8Safe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function stripCssComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "");
}

function countOccur(haystack, needle) {
  let c = 0;
  let idx = 0;
  while (true) {
    idx = haystack.indexOf(needle, idx);
    if (idx === -1) return c;
    c += 1;
    idx += needle.length;
  }
}

function main() {
  const includeMd = process.argv.includes("--include-md");
  const scanSite = process.argv.includes("--scan-site");

  const cssFiles = walkFiles(CSS_DIR, (p) => p.endsWith(".css"));
  const codeFiles = scanSite
    ? walkFiles(path.join(ROOT, "_site"), (p) => p.endsWith(".html"))
    : walkFiles(SRC_DIR, (p) =>
        p.endsWith(".njk") ||
        p.endsWith(".js") ||
        p.endsWith(".11ty.js") ||
        (includeMd && p.endsWith(".md"))
      );

  const classRe = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  const idRe = /#([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  const pseudoNoise = new Set([
    "hover",
    "active",
    "focus",
    "focus-visible",
    "visited",
    "before",
    "after",
    "root",
  ]);

  const classes = new Map(); // name -> defs count
  const ids = new Map(); // name -> defs count
  const classFiles = new Map(); // name -> Set<relative css file>
  const idFiles = new Map(); // name -> Set<relative css file>

  for (const f of cssFiles) {
    if (path.basename(f) === "bundle.css") continue; // generated artifact
    const css = stripCssComments(readUtf8Safe(f));
    const relCss = path.relative(ROOT, f).split(path.sep).join("/");
    let m;
    while ((m = classRe.exec(css))) {
      const name = m[1];
      if (pseudoNoise.has(name)) continue;
      classes.set(name, (classes.get(name) || 0) + 1);
      if (!classFiles.has(name)) classFiles.set(name, new Set());
      classFiles.get(name).add(relCss);
    }
    while ((m = idRe.exec(css))) {
      const name = m[1];
      if (pseudoNoise.has(name)) continue;
      ids.set(name, (ids.get(name) || 0) + 1);
      if (!idFiles.has(name)) idFiles.set(name, new Set());
      idFiles.get(name).add(relCss);
    }
  }

  // Filter out false-positive ids that are clearly hex colors (e.g. #fff, #f3f4f6, #FFFFFF)
  const HEX_COLOR_RE = /^[0-9a-fA-F]{3,8}$/;
  for (const name of Array.from(ids.keys())) {
    if (HEX_COLOR_RE.test(name)) ids.delete(name);
  }

  const foundClasses = new Set();
  const foundIds = new Set();
  for (const f of codeFiles) {
    const text = readUtf8Safe(f);
    if (!text) continue;
    // Fast path: mark any selector token that appears literally in file.
    // (Heuristic; reduces false negatives for direct usage.)
    for (const name of classes.keys()) {
      if (foundClasses.has(name)) continue;
      if (text.includes(name)) foundClasses.add(name);
    }
    for (const name of ids.keys()) {
      if (foundIds.has(name)) continue;
      if (text.includes(name)) foundIds.add(name);
    }
    if (foundClasses.size === classes.size && foundIds.size === ids.size) break;
  }

  const unusedClasses = [];
  for (const [name, defs] of classes) {
    if (!foundClasses.has(name)) {
      const files = classFiles.has(name) ? Array.from(classFiles.get(name)) : [];
      unusedClasses.push({ name, defs, files });
    }
  }
  const unusedIds = [];
  for (const [name, defs] of ids) {
    if (!foundIds.has(name)) {
      const files = idFiles.has(name) ? Array.from(idFiles.get(name)) : [];
      unusedIds.push({ name, defs, files });
    }
  }

  unusedClasses.sort((a, b) => b.defs - a.defs || a.name.localeCompare(b.name));
  unusedIds.sort((a, b) => b.defs - a.defs || a.name.localeCompare(b.name));

  console.log(
    `CSS files: ${cssFiles.length}  Scanned files: ${codeFiles.length}  mode: ${scanSite ? "_site html" : "src"}  includeMd: ${includeMd}`
  );
  console.log(`Unique classes: ${classes.size}  Unique ids: ${ids.size}`);

  console.log("\nTop suspicious UNUSED classes (no literal reference in src/):");
  console.log(
    unusedClasses
      .slice(0, 120)
      .map((x) => `${x.name} (defs:${x.defs}) [${(x.files || []).join(", ")}]`)
      .join("\n") || "(none)"
  );

  console.log("\nTop suspicious UNUSED ids (no literal reference in src/):");
  console.log(
    unusedIds.slice(0, 120).map((x) => `${x.name} (defs:${x.defs})`).join("\n") || "(none)"
  );
}

main();

