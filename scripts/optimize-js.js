/**
 * JS 压缩脚本
 * 安全地压缩 _site/assets/js 目录下的 JS 文件
 * 
 * 功能：
 * - 移除单行注释（保留 URL 和正则中的 //）
 * - 移除多行注释
 * - 压缩空白（保持语义正确）
 */

const fs = require("fs");
const path = require("path");

const JS_ROOT = path.join(process.cwd(), "_site", "assets", "js");

function walkJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsFiles(fullPath));
      return;
    }
    if (entry.isFile() && fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  });

  return files;
}

/**
 * 安全地移除 JS 注释
 * 需要处理：字符串、模板字符串、正则表达式中的 // 和 /* 
 */
function stripComments(js) {
  let result = "";
  let i = 0;
  const len = js.length;

  while (i < len) {
    const ch = js[i];
    const next = js[i + 1];

    // 字符串字面量 (单引号)
    if (ch === "'") {
      result += ch;
      i++;
      while (i < len) {
        const c = js[i];
        result += c;
        if (c === "\\" && i + 1 < len) {
          result += js[i + 1];
          i += 2;
          continue;
        }
        if (c === "'") {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // 字符串字面量 (双引号)
    if (ch === '"') {
      result += ch;
      i++;
      while (i < len) {
        const c = js[i];
        result += c;
        if (c === "\\" && i + 1 < len) {
          result += js[i + 1];
          i += 2;
          continue;
        }
        if (c === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // 模板字符串
    if (ch === "`") {
      result += ch;
      i++;
      while (i < len) {
        const c = js[i];
        result += c;
        if (c === "\\" && i + 1 < len) {
          result += js[i + 1];
          i += 2;
          continue;
        }
        if (c === "`") {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // 正则表达式字面量
    // 判断 / 是正则还是除法：前一个非空白字符是特定字符时是正则
    if (ch === "/" && i > 0) {
      const prevNonSpace = js.slice(0, i).replace(/\s+$/, "");
      const lastChar = prevNonSpace[prevNonSpace.length - 1];
      const regexPrecedingChars = "=(:,[!&|?{};~^";
      
      if (regexPrecedingChars.includes(lastChar) && next !== "/" && next !== "*") {
        result += ch;
        i++;
        // 正则内容
        while (i < len) {
          const c = js[i];
          result += c;
          if (c === "\\") {
            if (i + 1 < len) {
              result += js[i + 1];
              i += 2;
              continue;
            }
          }
          if (c === "/" && js[i - 1] !== "\\") {
            i++;
            // 处理正则标志
            while (i < len && /[gimsuy]/.test(js[i])) {
              result += js[i];
              i++;
            }
            break;
          }
          i++;
        }
        continue;
      }
    }

    // 单行注释 //
    if (ch === "/" && next === "/") {
      i += 2;
      while (i < len && js[i] !== "\n") {
        i++;
      }
      // 保留换行符以维护行号
      if (i < len) {
        result += "\n";
        i++;
      }
      continue;
    }

    // 多行注释 /* */
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < len) {
        if (js[i] === "*" && js[i + 1] === "/") {
          i += 2;
          break;
        }
        i++;
      }
      // 保留一个空格避免 token 粘连
      result += " ";
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

/**
 * 压缩空白（保守模式 - 只移除多余空白和空行）
 */
function minifyWhitespace(js) {
  return js
    // 移除行首行尾空白
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    // 多个空行变为单个
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * 压缩 JS（安全模式）
 */
function minifyJs(js) {
  const noComments = stripComments(js);
  return minifyWhitespace(noComments);
}

function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MiB`;
}

function run() {
  const files = walkJsFiles(JS_ROOT);
  if (!files.length) {
    console.log("[optimize-js] No JS files found in _site/assets/js");
    return;
  }

  let beforeTotal = 0;
  let afterTotal = 0;

  files.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const minified = minifyJs(source);

    beforeTotal += Buffer.byteLength(source, "utf8");
    afterTotal += Buffer.byteLength(minified, "utf8");

    fs.writeFileSync(filePath, `${minified}\n`, "utf8");
  });

  const saved = beforeTotal - afterTotal;
  const ratio = beforeTotal > 0 ? ((saved / beforeTotal) * 100).toFixed(2) : "0.00";

  console.log(`[optimize-js] Processed ${files.length} files`);
  console.log(`[optimize-js] Before: ${bytes(beforeTotal)}`);
  console.log(`[optimize-js] After:  ${bytes(afterTotal)}`);
  console.log(`[optimize-js] Saved:  ${bytes(saved)} (${ratio}%)`);
}

run();
