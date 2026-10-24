#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const ROOT = process.cwd();
const SITE_DIR = path.join(ROOT, "_site");

const BUDGETS = {
  maxHtmlTotalBytes: 800 * 1024,
  maxCssTotalBytes: 300 * 1024,
  maxJsTotalBytes: 350 * 1024,
  maxSingleAssetBytes: 500 * 1024,
};

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (entry.isFile()) files.push(full);
  }
  return files;
}

function bytesToKiB(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function getKind(ext) {
  if (ext === ".html") return "html";
  if (ext === ".css") return "css";
  if (ext === ".js") return "js";
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"].includes(ext)) return "image";
  if ([".woff", ".woff2", ".ttf", ".otf"].includes(ext)) return "font";
  return "other";
}

function analyzeFiles(files) {
  const records = files.map((file) => {
    const stat = fs.statSync(file);
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    const ext = path.extname(file).toLowerCase();
    const kind = getKind(ext);
    const raw = fs.readFileSync(file);
    const gzip = zlib.gzipSync(raw, { level: 9 }).length;

    return {
      file: rel,
      kind,
      sizeBytes: stat.size,
      gzipBytes: gzip,
    };
  });

  const totals = records.reduce(
    (acc, cur) => {
      acc.all += cur.sizeBytes;
      acc.gzipAll += cur.gzipBytes;
      acc.byType[cur.kind] = (acc.byType[cur.kind] || 0) + cur.sizeBytes;
      return acc;
    },
    { all: 0, gzipAll: 0, byType: {} }
  );

  const largestFiles = [...records]
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 10)
    .map((item) => ({
      file: item.file,
      kind: item.kind,
      sizeKiB: bytesToKiB(item.sizeBytes),
      gzipKiB: bytesToKiB(item.gzipBytes),
    }));

  const checks = [
    {
      key: "maxHtmlTotalBytes",
      label: "Total HTML size",
      actual: totals.byType.html || 0,
      limit: BUDGETS.maxHtmlTotalBytes,
    },
    {
      key: "maxCssTotalBytes",
      label: "Total CSS size",
      actual: totals.byType.css || 0,
      limit: BUDGETS.maxCssTotalBytes,
    },
    {
      key: "maxJsTotalBytes",
      label: "Total JS size",
      actual: totals.byType.js || 0,
      limit: BUDGETS.maxJsTotalBytes,
    },
    {
      key: "maxSingleAssetBytes",
      label: "Largest single asset",
      actual: largestFiles.length > 0 ? largestFiles[0].sizeKiB * 1024 : 0,
      limit: BUDGETS.maxSingleAssetBytes,
    },
  ].map((item) => ({
    ...item,
    passed: item.actual <= item.limit,
  }));

  const passed = checks.every((item) => item.passed);

  return {
    totals,
    largestFiles,
    checks,
    passed,
    fileCount: records.length,
  };
}

function toMarkdown(report) {
  const lines = [];
  lines.push("# Build Performance Report");
  lines.push("");
  lines.push(`- Time: ${report.generatedAt}`);
  lines.push(`- Site dir: \`${report.siteDir}\``);
  lines.push(`- Status: **${report.passed ? "PASS" : "WARN"}**`);
  lines.push(`- File count: ${report.fileCount}`);
  lines.push(`- Total size: ${formatBytes(report.totalBytes)}`);
  lines.push(`- Total gzip size: ${formatBytes(report.totalGzipBytes)}`);
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  lines.push("| Metric | Actual | Budget | Result |");
  lines.push("| --- | ---: | ---: | --- |");
  for (const check of report.checks) {
    lines.push(
      `| ${check.label} | ${formatBytes(check.actual)} | ${formatBytes(
        check.limit
      )} | ${check.passed ? "PASS" : "WARN"} |`
    );
  }
  lines.push("");
  lines.push("## Size by Type");
  lines.push("");
  lines.push("| Type | Size |");
  lines.push("| --- | ---: |");
  for (const [type, size] of Object.entries(report.byType).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${type} | ${formatBytes(size)} |`);
  }
  lines.push("");
  lines.push("## Top 10 Largest Files");
  lines.push("");
  lines.push("| File | Type | Raw | Gzip |");
  lines.push("| --- | --- | ---: | ---: |");
  for (const item of report.largestFiles) {
    lines.push(`| \`${item.file}\` | ${item.kind} | ${item.sizeKiB} KiB | ${item.gzipKiB} KiB |`);
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  if (!fs.existsSync(SITE_DIR)) {
    console.error(`[perf-check] Missing build output directory: ${SITE_DIR}`);
    process.exit(1);
  }

  const files = walk(SITE_DIR);
  const analysis = analyzeFiles(files);
  const generatedAt = new Date().toISOString();

  const report = {
    generatedAt,
    siteDir: path.relative(ROOT, SITE_DIR).split(path.sep).join("/"),
    passed: analysis.passed,
    fileCount: analysis.fileCount,
    totalBytes: analysis.totals.all,
    totalGzipBytes: analysis.totals.gzipAll,
    byType: analysis.totals.byType,
    checks: analysis.checks,
    largestFiles: analysis.largestFiles,
  };

  console.log("[perf-check] Build performance report");
  console.log(`[perf-check] Status: ${report.passed ? "PASS" : "WARN"}`);
  console.log("");
  console.log(toMarkdown(report));
}

main();
