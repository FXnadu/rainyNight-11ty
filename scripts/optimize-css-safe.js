const fs = require("fs");
const path = require("path");

const CSS_ROOT = path.join(process.cwd(), "_site", "assets", "css");

function walkCssFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkCssFiles(fullPath));
      return;
    }
    if (entry.isFile() && fullPath.endsWith(".css")) {
      files.push(fullPath);
    }
  });

  return files;
}

function stripComments(css) {
  let result = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    const next = css[i + 1];
    const prev = css[i - 1];

    if (!inDouble && ch === "'" && prev !== "\\") {
      inSingle = !inSingle;
      result += ch;
      continue;
    }

    if (!inSingle && ch === '"' && prev !== "\\") {
      inDouble = !inDouble;
      result += ch;
      continue;
    }

    // Remove block comments only when not inside string literals.
    if (!inSingle && !inDouble && ch === "/" && next === "*") {
      i += 2;
      while (i < css.length) {
        if (css[i] === "*" && css[i + 1] === "/") {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    result += ch;
  }

  return result;
}

function minifyCssSafe(css) {
  const noComments = stripComments(css);

  return noComments
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, arr) => line.length > 0 || (index > 0 && arr[index - 1].length > 0))
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function bytes(n) {
  return `${n} B`;
}

function run() {
  const files = walkCssFiles(CSS_ROOT);
  if (!files.length) {
    console.log("[optimize-css-safe] No CSS files found in _site/assets/css");
    return;
  }

  let beforeTotal = 0;
  let afterTotal = 0;

  files.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const minified = minifyCssSafe(source);

    beforeTotal += Buffer.byteLength(source, "utf8");
    afterTotal += Buffer.byteLength(minified, "utf8");

    fs.writeFileSync(filePath, `${minified}\n`, "utf8");
  });

  const saved = beforeTotal - afterTotal;
  const ratio = beforeTotal > 0 ? ((saved / beforeTotal) * 100).toFixed(2) : "0.00";

  console.log(`[optimize-css-safe] Processed ${files.length} files`);
  console.log(`[optimize-css-safe] Before: ${bytes(beforeTotal)}`);
  console.log(`[optimize-css-safe] After:  ${bytes(afterTotal)}`);
  console.log(`[optimize-css-safe] Saved:  ${bytes(saved)} (${ratio}%)`);
}

run();
