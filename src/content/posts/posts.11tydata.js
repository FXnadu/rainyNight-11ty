const { encodeSlug } = require("../../../eleventy/utils/slug-encoder");
const path = require("path");

function getCategoryFromPath(inputPath) {
  if (!inputPath) return null;
  const normalized = inputPath.split(path.sep).join("/");
  const marker = "/src/content/posts/";
  const idx = normalized.indexOf(marker);
  if (idx === -1) return null;
  const relative = normalized.slice(idx + marker.length);
  const segments = relative.split("/").filter(Boolean);
  return segments.length > 0 ? segments[0] : null;
}

module.exports = {
  tags: ["posts"],
  layout: "layouts/post.njk",
  permalink: function(data) {
    // Prefer stable keys so URLs don't change when titles are edited.
    const stableKey =
      (typeof data.slug === "string" && data.slug.trim()) ||
      (typeof data.id === "string" && data.id.trim()) ||
      (data.page && data.page.fileSlug) ||
      data.title ||
      "";

    const encodedSlug = encodeSlug(String(stableKey), { prefix: "p", minLength: 6 });
    return `/posts/${encodedSlug}/`;
  },
  category: function(data) {
    return getCategoryFromPath(data.page && data.page.inputPath);
  }
};
