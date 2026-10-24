/**
 * Default data for all posts.
 * Only provides permalink generation and category detection.
 * All other defaults (title, layout, tags, etc.) are handled by eleventy/config/computed.js.
 */
const { encodeSlug } = require("../../../eleventy/utils/slug-encoder");
const { getCategoryFromPath } = require("../../../eleventy/utils/path-utils");
const { getContentType } = require("../../../eleventy/config/content-types");

const postsConfig = getContentType("posts");

module.exports = {
  tags: [postsConfig.tag],
  layout: postsConfig.layout,
  permalink: function(data) {
    const stableKey = postsConfig.getPermalinkKey(data) ||
      (data.page && data.page.fileSlug) ||
      "";
    const encodedSlug = encodeSlug(String(stableKey), { prefix: postsConfig.prefix, minLength: 6 });
    return `/posts/${encodedSlug}/`;
  },
  category: function(data) {
    return getCategoryFromPath(data.page && data.page.inputPath);
  }
};
