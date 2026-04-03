/**
 * CSS 合并脚本
 * 将多个基础 CSS 文件合并为单一文件，减少 HTTP 请求
 * 
 * 合并顺序：foundation -> layout -> components -> alerts -> code
 * 
 * 输入：_site/assets/css/*.css
 * 输出：_site/assets/css/bundle.css
 * 
 * 同时更新 HTML 文件中的 CSS 引用
 */

const fs = require("fs");
const path = require("path");

const SITE_ROOT = path.join(process.cwd(), "_site");
const CSS_ROOT = path.join(SITE_ROOT, "assets", "css");

// 基础 CSS 文件（按顺序合并）
const BASE_CSS_FILES = [
  "foundation.css",
  "layout.css",
  "components.css",
  "alerts.css",
  "code.css"
];

// 合并后的文件名
const BUNDLE_NAME = "bundle.css";

// 版本号（用于缓存控制）
const VERSION = Date.now().toString();

/**
 * 递归查找所有 HTML 文件
 */
function walkHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(fullPath));
      return;
    }
    if (entry.isFile() && fullPath.endsWith(".html")) {
      files.push(fullPath);
    }
  });

  return files;
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

/**
 * 更新 HTML 文件中的 CSS 引用
 * 将多个基础 CSS link 标签替换为单一的 bundle.css
 */
function updateHtmlReferences(html, bundleVersion) {
  // 匹配基础 CSS 的 link 标签（可能有版本参数）
  // 保留其他 CSS 如 pages/*.css
  const baseCssPattern = /<link[^>]*href="\/assets\/css\/(foundation|layout|components|alerts|code)\.css[^"]*"[^>]*>\s*/gi;
  
  // 检查是否已经有 bundle.css
  if (html.includes(`/assets/css/${BUNDLE_NAME}`)) {
    // 更新版本号
    html = html.replace(
      new RegExp(`href="/assets/css/${BUNDLE_NAME}\\?v=[^"]*"`),
      `href="/assets/css/${BUNDLE_NAME}?v=${bundleVersion}"`
    );
    return html;
  }

  // 找到第一个基础 CSS link 的位置
  const firstMatch = html.match(baseCssPattern);
  if (!firstMatch) {
    return html;
  }

  // 创建新的 link 标签
  const bundleLink = `<link rel="stylesheet" href="/assets/css/${BUNDLE_NAME}?v=${bundleVersion}">`;
  
  // 移除所有基础 CSS link，在第一个位置插入 bundle
  let replaced = false;
  html = html.replace(baseCssPattern, (match) => {
    if (!replaced) {
      replaced = true;
      return bundleLink + "\n    ";
    }
    return "";
  });

  return html;
}

/**
 * 移除旧的 CSS 文件（可选，默认保留）
 */
function removeOriginalFiles() {
  BASE_CSS_FILES.forEach((filename) => {
    const filePath = path.join(CSS_ROOT, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[merge-css] Removed: ${filename}`);
    }
  });
}

function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MiB`;
}

function run() {
  console.log("[merge-css] Starting CSS merge...");
  
  // 检查 _site 目录是否存在
  if (!fs.existsSync(SITE_ROOT)) {
    console.error("[merge-css] Error: _site directory not found. Run eleventy first.");
    process.exit(1);
  }

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

  // 写入 bundle.css
  const bundlePath = path.join(CSS_ROOT, BUNDLE_NAME);
  fs.writeFileSync(bundlePath, bundle, "utf8");
  console.log(`[merge-css] Created: ${BUNDLE_NAME} (${bytes(Buffer.byteLength(bundle, "utf8"))})`);

  // 更新 HTML 文件中的引用
  const htmlFiles = walkHtmlFiles(SITE_ROOT);
  let updatedCount = 0;

  htmlFiles.forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    const updated = updateHtmlReferences(html, VERSION);
    
    if (updated !== html) {
      fs.writeFileSync(filePath, updated, "utf8");
      updatedCount++;
    }
  });

  console.log(`[merge-css] Updated ${updatedCount} HTML files`);

  // 计算节省的请求数
  const existingCount = BASE_CSS_FILES.filter(f => 
    fs.existsSync(path.join(CSS_ROOT, f))
  ).length;
  
  if (existingCount > 1) {
    console.log(`[merge-css] Reduced from ${existingCount} requests to 1`);
  }

  console.log("[merge-css] Done!");
}

run();
