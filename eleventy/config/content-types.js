/**
 * Content type registry.
 * Single source of truth for all content types: markers, defaults, permalink rules.
 * New content types only need an entry here — no other files require changes.
 */
const path = require("path");

const contentTypes = {
  posts: {
    marker: "/src/content/posts/",
    tag: "posts",
    layout: "layouts/post.njk",
    bodyClass: "no-grid-page post-page",
    pageStyles: [
      "/assets/css/alerts.css?v=20260211-1",
      "/assets/css/code.css?v=20260211-1",
      "/assets/css/pages/post.css?v=20260211-1"
    ],
    fileExtension: ".md",
    prefix: "p",
    getPermalinkKey: (data) =>
      (typeof data.slug === "string" && data.slug.trim()) ||
      (typeof data.id === "string" && data.id.trim()) ||
      data.title ||
      ""
  }
  // Future types:
  // docs: {
  //   marker: "/src/content/docs/",
  //   tag: "docs",
  //   layout: "layouts/doc.njk",
  //   bodyClass: "doc-page",
  //   pageStyles: ["/assets/css/pages/doc.css"],
  //   fileExtension: ".md",
  //   prefix: "d",
  //   getPermalinkKey: (data) => data.slug || data.title || ""
  // }
};

function getContentType(name) {
  return contentTypes[name] || null;
}

function resolveContentType(inputPath) {
  if (!inputPath) return null;
  const normalized = inputPath.split(path.sep).join("/");
  for (const [name, config] of Object.entries(contentTypes)) {
    if (normalized.includes(config.marker)) return { name, ...config };
  }
  return null;
}

function getAllContentTypes() {
  return contentTypes;
}

module.exports = { contentTypes, getContentType, resolveContentType, getAllContentTypes };
