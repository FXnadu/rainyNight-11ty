#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const siteDir = path.join(process.cwd(), "_site");

fs.rmSync(siteDir, { recursive: true, force: true });
console.log(`[clean-site] Removed ${siteDir}`);
