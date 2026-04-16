#!/usr/bin/env node

/**
 * 统一构建脚本
 * 执行完整构建流程：清理 → 更新日期 → 同步元数据 → 生成 → 优化
 */

const { execSync } = require("child_process");
const path = require("path");

const scriptsDir = __dirname;

process.env.ELEVENTY_ENV = process.env.ELEVENTY_ENV || "production";

const steps = [
  { name: "清理站点", cmd: `node "${path.join(scriptsDir, "clean-site.js")}"` },
  { name: "更新日期", cmd: `node "${path.join(scriptsDir, "manage-dates.js")}"` },
  { name: "更新动态", cmd: `node "${path.join(scriptsDir, "manage-moments.js")}"` },
  { name: "同步元数据", cmd: `node "${path.join(scriptsDir, "sync-category-meta.js")}"` },
  { name: "合并CSS", cmd: `node "${path.join(scriptsDir, "merge-css.js")}"` },
  { name: "生成站点", cmd: "npx eleventy" },
  { name: "优化CSS", cmd: `node "${path.join(scriptsDir, "optimize-css-safe.js")}"` },
  { name: "优化JS", cmd: `node "${path.join(scriptsDir, "optimize-js.js")}"` },
  { name: "性能检查", cmd: `node "${path.join(scriptsDir, "perf-self-check.js")}"` },
];

console.log("🚀 开始构建...\n");

for (const step of steps) {
  console.log(`📦 ${step.name}...`);
  try {
    execSync(step.cmd, { stdio: "inherit" });
  } catch (err) {
    console.error(`❌ ${step.name}失败`);
    process.exit(1);
  }
}

console.log("\n✅ 构建完成！");
