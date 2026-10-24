/**
 * eleventyComputed configuration.
 * Auto-derives title, subcategory, layout, publishDate, updated, tags, bodyClass, pageStyles
 * from directory structure and file metadata.
 * Defaults are read from the content type registry, not hardcoded.
 */
const fs = require("fs");
const { isPostInput, getSubcategoryFromPath } = require("../utils/path-utils");
const { resolveContentType } = require("./content-types");

function applyPostDefaults(data) {
  // Title: explicit front-matter → extract from filename (before "@")
  if (!data.title) {
    const inputPath = data.page && data.page.inputPath;
    if (inputPath) {
      const pathParts = inputPath.split(/[/\\]/);
      const fileName = pathParts[pathParts.length - 1];
      const stem = fileName.replace(/\.md$/, "");
      const parts = stem.split("@");
      return parts[0] || stem;
    }
    return "";
  }
  return data.title;
}

function getComputedFields() {
  return {
    title: (data) => {
      if (!isPostInput(data)) return data.title;
      return applyPostDefaults(data);
    },

    subcategory: (data) => {
      if (!isPostInput(data)) return data.subcategory;
      if (data.subcategory) return data.subcategory;
      return getSubcategoryFromPath(data.page && data.page.inputPath);
    },

    layout: (data) => {
      if (!isPostInput(data)) return data.layout;
      const resolved = resolveContentType(data.page && data.page.inputPath);
      const defaultLayout = resolved && resolved.layout ? resolved.layout : "layouts/post.njk";
      return data.layout || defaultLayout;
    },

    publishDate: (data) => {
      if (!isPostInput(data)) return data.publishDate;
      if (data.publishDate) return data.publishDate;
      return data.date || new Date().toISOString();
    },

    updated: (data) => {
      if (!isPostInput(data)) return data.updated;
      const inputPath = data.page && data.page.inputPath;
      if (!inputPath) return null;
      try {
        const stats = fs.statSync(inputPath);
        const fileMtime = new Date(stats.mtime);
        const currentDate = new Date();
        const pubDate = data.date ? new Date(data.date) : currentDate;
        const diffMs = fileMtime.getTime() - pubDate.getTime();
        const ONE_MINUTE = 60 * 1000;
        if (diffMs > ONE_MINUTE && fileMtime.getTime() <= currentDate.getTime()) {
          return new Date(fileMtime);
        }
        return null;
      } catch (e) {
        return null;
      }
    },

    tags: (data) => {
      if (!isPostInput(data)) return data.tags;
      const resolved = resolveContentType(data.page && data.page.inputPath);
      const defaultTag = resolved && resolved.tag ? resolved.tag : "posts";
      const current = Array.isArray(data.tags)
        ? [...data.tags]
        : data.tags ? [data.tags] : [];
      if (!current.includes(defaultTag)) current.push(defaultTag);
      return current;
    },

    bodyClass: (data) => {
      if (!isPostInput(data)) return data.bodyClass;
      const resolved = resolveContentType(data.page && data.page.inputPath);
      const defaultBodyClass = resolved && resolved.bodyClass ? resolved.bodyClass : "no-grid-page post-page";
      return data.bodyClass || defaultBodyClass;
    },

    pageStyles: (data) => {
      if (!isPostInput(data)) return data.pageStyles;
      const resolved = resolveContentType(data.page && data.page.inputPath);
      const defaultStyles = resolved && resolved.pageStyles ? resolved.pageStyles : [];
      if (Array.isArray(data.pageStyles) && data.pageStyles.length) return data.pageStyles;
      return defaultStyles;
    }
  };
}

module.exports = { getComputedFields };
