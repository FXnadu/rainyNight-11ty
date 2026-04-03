const { encodeSlug } = require("../../../eleventy/utils/slug-encoder");

module.exports = {
  tags: ["posts"],
  layout: "layouts/post.njk",
  // 使用函数直接返回 permalink
  permalink: function(data) {
    const title = data.title || (data.page && data.page.fileSlug) || "";
    const encodedSlug = encodeSlug(title, { prefix: 'p', minLength: 6 });
    return `/posts/${encodedSlug}/`;
  }
};
