
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItGitHubAlerts = require("markdown-it-github-alerts");
const { registerDateFilters, registerTitleFilters } = require("./eleventy/config/filters");
const { registerCollections } = require("./eleventy/config/collections");
const { passthroughPaths } = require("./eleventy/config/passthrough");

module.exports = async function(eleventyConfig) {
  const { default: mermaidPlugin } = await import("@kevingimbel/eleventy-plugin-mermaid");
  const isPostInput = (data) => {
    const inputPath = data && data.page && data.page.inputPath ? data.page.inputPath : "";
    return typeof inputPath === "string"
      && inputPath.includes("/src/content/posts/")
      && inputPath.endsWith(".md");
  };

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(mermaidPlugin);

  passthroughPaths.forEach((path) => eleventyConfig.addPassthroughCopy(path));

  registerDateFilters(eleventyConfig);
  registerTitleFilters(eleventyConfig);
  registerCollections(eleventyConfig);

  // Keep post defaults out of src/content/posts so that directory only contains article files.
  eleventyConfig.addGlobalData("eleventyComputed", {
    layout: (data) => {
      if (!isPostInput(data)) return data.layout;
      return data.layout || "layouts/post.njk";
    },
    permalink: (data) => {
      if (!isPostInput(data)) return data.permalink;
      if (data.permalink) return data.permalink;
      const slug = data && data.page && data.page.fileSlug ? data.page.fileSlug : "";
      return `/posts/${slug}/`;
    },
    date: (data) => {
      if (!isPostInput(data)) return data.date;
      return data.date || "last modified";
    },
    tags: (data) => {
      if (!isPostInput(data)) return data.tags;
      const current = Array.isArray(data.tags)
        ? [...data.tags]
        : data.tags ? [data.tags] : [];
      if (!current.includes("posts")) current.push("posts");
      return current;
    },
    bodyClass: (data) => {
      if (!isPostInput(data)) return data.bodyClass;
      return data.bodyClass || "no-grid-page post-page";
    },
    pageStyles: (data) => {
      if (!isPostInput(data)) return data.pageStyles;
      if (Array.isArray(data.pageStyles) && data.pageStyles.length) return data.pageStyles;
      return [
        "/assets/css/alerts.css?v=20260211-1",
        "/assets/css/code.css?v=20260211-1",
        "/assets/css/pages/post.css?v=20260211-1"
      ];
    }
  });

  // Markdown Configuration
  const mdOptions = {
    html: true,
    breaks: true,
    linkify: true,
  };

  const mdLib = markdownIt(mdOptions)
    .use(markdownItFootnote)
    .use(markdownItGitHubAlerts.default);

  eleventyConfig.setLibrary("md", mdLib);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
