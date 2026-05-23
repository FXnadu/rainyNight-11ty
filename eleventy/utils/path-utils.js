/**
 * Shared path-parsing utilities for content.
 * Single source of truth for category/subcategory extraction and content type detection.
 * Markers are derived from the content type registry, not hardcoded.
 */
const path = require("path");
const { resolveContentType } = require("../config/content-types");

/**
 * Normalize a file path to use forward slashes.
 */
function normalizePath(inputPath) {
  return inputPath.split(path.sep).join("/");
}

/**
 * Extract the relative path segments after the content type marker.
 * Returns segments array, or null if the path doesn't match any registered type.
 */
function getContentRelativeSegments(inputPath) {
  if (!inputPath) return null;
  const normalized = normalizePath(inputPath);
  const resolved = resolveContentType(normalized);
  if (!resolved) return null;
  return normalized.slice(normalized.indexOf(resolved.marker) + resolved.marker.length).split("/").filter(Boolean);
}

/**
 * Get the top-level category folder name from a content item's inputPath.
 * For posts/Category/Subcategory/file.md → "Category"
 * Returns "其他" if the item is directly in the type root (no category folder).
 */
function getFolderNameFromPostPath(inputPath) {
  const segments = getContentRelativeSegments(inputPath);
  if (!segments || segments.length <= 1) return "其他";
  return segments[0];
}

/**
 * Get the top-level category from a content item's inputPath.
 * Alias for getFolderNameFromPostPath used in template filters and data files.
 */
function getCategoryFromPath(inputPath) {
  return getFolderNameFromPostPath(inputPath);
}

/**
 * Get the subcategory folder name from a content item's inputPath.
 * For posts/Category/Subcategory/file.md → "Subcategory"
 * Returns null if the item has no subcategory folder.
 */
function getSubcategoryFromPath(inputPath) {
  const segments = getContentRelativeSegments(inputPath);
  if (!segments || segments.length < 3) return null;
  return segments[segments.length - 2];
}

/**
 * Check whether a data object represents content of a registered type.
 */
function isPostInput(data) {
  const inputPath = data && data.page && data.page.inputPath ? data.page.inputPath : "";
  if (typeof inputPath !== "string" || !inputPath.endsWith(".md")) return false;
  return resolveContentType(inputPath) !== null;
}

module.exports = {
  normalizePath,
  getContentRelativeSegments,
  getFolderNameFromPostPath,
  getCategoryFromPath,
  getSubcategoryFromPath,
  isPostInput
};
