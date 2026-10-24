/**
 * CSS 合并脚本
 * 将多个基础 CSS 文件合并为单一文件，减少 HTTP 请求
 * 
 * 合并顺序：foundation -> layout -> components
 * 
 * 输入：src/assets/css/*.css
 * 输出：src/assets/css/bundle.css
 *
 * 同时写入构建元数据：src/_data/build.json（用于模板中生成版本号）
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SRC_ROOT = path.join(process.cwd(), "src");
const CSS_ROOT = path.join(SRC_ROOT, "assets", "css");
const BUILD_DATA_PATH = path.join(SRC_ROOT, "_data", "build.json");

// 基础 CSS 文件（按顺序合并）
const BASE_CSS_FILES = [
  "foundation.css",
  "layout.css",
  "components.css"
];

// 合并后的文件名
const BUNDLE_NAME = "bundle.css";

// 生成内容哈希（用于缓存控制）
function generateHash(content) {
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
}

/**
 * 合并 CSS 文件
 */
function mergeCssFiles() {
  const parts = [];
  
  BASE_CSS_FILES.forEach((filename) => {
    const filePath = path.join(CSS_ROOT, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      parts.push(`/* === ${filename} === */\n${content}`);
      console.log(`[merge-css] Included: ${filename}`);
    } else {
      console.warn(`[merge-css] Warning: ${filename} not found, skipping`);
    }
  });

  if (parts.length === 0) {
    console.log("[merge-css] No CSS files to merge");
    return null;
  }

  const bundle = parts.join("\n\n");
  return bundle;
}

function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MiB`;
}

function run() {
  console.log("[merge-css] Starting CSS merge...");
  
  // 检查 CSS 目录
  if (!fs.existsSync(CSS_ROOT)) {
    console.log("[merge-css] No CSS directory found, skipping");
    return;
  }

  // 合并 CSS 文件
  const bundle = mergeCssFiles();
  if (!bundle) {
    console.log("[merge-css] No CSS files merged");
    return;
  }

  // 生成内容哈希
  const bundleHash = generateHash(bundle);
  
  // 写入 bundle.css
  const bundlePath = path.join(CSS_ROOT, BUNDLE_NAME);
  fs.writeFileSync(bundlePath, bundle, "utf8");
  console.log(`[merge-css] Created: ${BUNDLE_NAME} (${bytes(Buffer.byteLength(bundle, "utf8"))})`);
  console.log(`[merge-css] Bundle hash: ${bundleHash}`);

  // Write build metadata for templates (Eleventy reads _data at build time)
  const buildDataDir = path.dirname(BUILD_DATA_PATH);
  if (!fs.existsSync(buildDataDir)) {
    fs.mkdirSync(buildDataDir, { recursive: true });
  }

  const buildData = {
    cssBundleHash: bundleHash,
    cssBundleFiles: BASE_CSS_FILES,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(BUILD_DATA_PATH, JSON.stringify(buildData, null, 2) + "\n", "utf8");
  console.log(`[merge-css] Wrote build data: ${path.relative(process.cwd(), BUILD_DATA_PATH)}`);

  console.log("[merge-css] Done!");
}

run();
