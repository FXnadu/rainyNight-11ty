/**
 * Content item utilities.
 * Sorting, ordering, and collection filtering for content items.
 * Uses content type registry instead of hardcoded paths.
 */
const { normalizePath } = require("../utils/path-utils");
const { resolveContentType } = require("./content-types");

/**
 * Read a numeric field from item.data with a fallback.
 */
function getNumberFromFrontMatter(item, fieldName, fallbackValue) {
  const rawValue = item && item.data ? item.data[fieldName] : undefined;
  if (rawValue === undefined || rawValue === null || rawValue === "") return fallbackValue;

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

/**
 * Compare posts for category page ordering:
 * 1. categoryOrder (ascending)
 * 2. date (descending)
 * 3. title (locale-aware ascending)
 */
function comparePostsForCategoryPages(a, b) {
  const orderA = getNumberFromFrontMatter(a, "categoryOrder", Number.MAX_SAFE_INTEGER);
  const orderB = getNumberFromFrontMatter(b, "categoryOrder", Number.MAX_SAFE_INTEGER);
  if (orderA !== orderB) return orderA - orderB;

  const dateDiff = b.date - a.date;
  if (dateDiff !== 0) return dateDiff;

  const titleA = a && a.data && a.data.title ? a.data.title : "";
  const titleB = b && b.data && b.data.title ? b.data.title : "";
  return titleA.localeCompare(titleB, "zh-Hans-CN");
}

/**
 * Get all items of a registered content type, sorted by date (newest first).
 */
function getItemsByType(collectionApi, typeName) {
  const { getContentType } = require("./content-types");
  const typeConfig = getContentType(typeName);
  if (!typeConfig) return [];

  const ext = typeConfig.fileExtension || ".md";

  return collectionApi
    .getAll()
    .filter((item) => {
      if (!item || !item.inputPath) return false;
      const normalizedPath = normalizePath(item.inputPath);
      const resolved = resolveContentType(normalizedPath);
      return resolved && resolved.name === typeName && normalizedPath.endsWith(ext);
    })
    .sort((a, b) => b.date - a.date);
}

/**
 * Get all posts from src/content/posts/, sorted by date (newest first).
 * Legacy wrapper around getItemsByType for backward compatibility.
 */
function getPostsFromContentDir(collectionApi) {
  return getItemsByType(collectionApi, "posts");
}

/**
 * Get all pages from src/content/pages/ that have contentTags, sorted by date (newest first).
 */
function getPagesWithTags(collectionApi) {
  return collectionApi
    .getAll()
    .filter((item) => {
      if (!item || !item.inputPath) return false;
      const normalizedPath = normalizePath(item.inputPath);
      const isPage = normalizedPath.includes("/src/content/pages/");
      const hasTags = item.data && Array.isArray(item.data.contentTags) && item.data.contentTags.length > 0;
      return isPage && hasTags && normalizedPath.endsWith(".njk");
    })
    .sort((a, b) => b.date - a.date);
}

module.exports = {
  comparePostsForCategoryPages,
  getItemsByType,
  getPagesWithTags,
  getPostsFromContentDir
};
