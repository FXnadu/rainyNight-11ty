/**
 * Category metadata loading, normalization, and lookup.
 * Reads src/_data/categoryMeta.json and provides structured access.
 */
const fs = require("fs");
const path = require("path");

const DEFAULT_CATEGORY_DESCRIPTION = "暂无简介";

// --- Normalization helpers ---

function normalizeMetaEntry(entry, categoryPath) {
  if (typeof entry === "string") {
    const description = entry.trim() || DEFAULT_CATEGORY_DESCRIPTION;
    return { description };
  }

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;

  const description = typeof entry.description === "string"
    ? (entry.description.trim() || DEFAULT_CATEGORY_DESCRIPTION)
    : DEFAULT_CATEGORY_DESCRIPTION;

  const result = { description };

  if (typeof entry.order === "number") {
    result.order = entry.order;
  }

  if (entry.subcategories && typeof entry.subcategories === "object" && !Array.isArray(entry.subcategories)) {
    result.subcategories = entry.subcategories;
  }

  return result;
}

function normalizeMetaObject(rawMeta, sourceLabel) {
  const normalized = { categories: {} };

  if (!rawMeta || typeof rawMeta !== "object" || Array.isArray(rawMeta)) {
    if (rawMeta !== undefined) {
      console.warn(`[category-meta] Ignore non-object source: ${sourceLabel}`);
    }
    return normalized;
  }

  if (rawMeta.categories) {
    const rawCategories = rawMeta.categories;
    if (rawCategories && typeof rawCategories === "object" && !Array.isArray(rawCategories)) {
      Object.keys(rawCategories).forEach((categoryPath) => {
        const entry = normalizeMetaEntry(rawCategories[categoryPath], categoryPath);
        if (entry) normalized.categories[categoryPath] = entry;
      });
    }
    return normalized;
  }

  Object.keys(rawMeta).forEach((categoryPath) => {
    const entry = normalizeMetaEntry(rawMeta[categoryPath], categoryPath);
    if (entry) normalized.categories[categoryPath] = entry;
  });

  return normalized;
}

// --- File I/O ---

function loadJsonFileSafe(filePath, fallbackValue = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallbackValue;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(`[category-meta] Invalid JSON in ${filePath}. Using fallback.`, error.message);
    return fallbackValue;
  }
}

/**
 * Load and normalize category metadata from the JSON file.
 */
function loadCategoryMeta() {
  const dataDir = path.join(process.cwd(), "src/_data");
  const metaPath = path.join(dataDir, "categoryMeta.json");
  return normalizeMetaObject(loadJsonFileSafe(metaPath), metaPath);
}

// --- Lookup helpers ---

function getCategoryMeta(meta, categoryPath) {
  const category = typeof categoryPath === "string" ? categoryPath.trim() : "";
  const topLevelCategory = category.split("/")[0];

  if (meta.categories[category]) return meta.categories[category];
  if (meta.categories[topLevelCategory]) return meta.categories[topLevelCategory];
  return null;
}

function getSubcategoryMeta(meta, topLevelCategory, subcategoryCode) {
  if (!meta.categories || !meta.categories[topLevelCategory]) return null;
  const cat = meta.categories[topLevelCategory];
  if (!cat.subcategories || !cat.subcategories[subcategoryCode]) return null;
  return cat.subcategories[subcategoryCode];
}

module.exports = {
  loadCategoryMeta,
  getCategoryMeta,
  getSubcategoryMeta
};
