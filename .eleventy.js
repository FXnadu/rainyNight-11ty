
const fs = require("fs");
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
    // 规范化路径分隔符，兼容 Windows 和 Unix
    const normalizedPath = inputPath.split(/[/\\]/).join("/");
    return typeof inputPath === "string"
      && normalizedPath.includes("/src/content/posts/")
      && inputPath.endsWith(".md");
  };

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(mermaidPlugin);

  passthroughPaths.forEach((path) => eleventyConfig.addPassthroughCopy(path));

  registerDateFilters(eleventyConfig);
  registerTitleFilters(eleventyConfig);
  registerCollections(eleventyConfig);

  // Validate post filenames: must contain @ symbol
  eleventyConfig.addCollection("postValidator", (collectionApi) => {
    const posts = collectionApi.getFilteredByGlob("src/content/posts/**/*.md");
    for (const post of posts) {
      const inputPath = post.inputPath;
      const fileName = inputPath.split(/[/\\]/).pop();
      const stem = fileName.replace(/\.md$/, "");
      if (!stem.includes("@")) {
        throw new Error(
          `文章文件名格式错误: "${fileName}"\n` +
          `必须包含 @ 符号，格式: 标题@分类标识.md\n` +
          `例如: 快速上手@abc.md`
        );
      }
    }
    return [];
  });

  // Keep post defaults out of src/content/posts so that directory only contains article files.
  eleventyConfig.addGlobalData("eleventyComputed", {
    title: (data) => {
      if (!isPostInput(data)) return data.title;
      if (data.title) return data.title;
      const inputPath = data.page && data.page.inputPath;
      if (!inputPath) return "";
      const pathParts = inputPath.split(/[/\\]/);
      const fileName = pathParts[pathParts.length - 1];
      const stem = fileName.replace(/\.md$/, "");
      const parts = stem.split("@");
      return parts[0] || stem;
    },
    subcategory: (data) => {
      if (!isPostInput(data)) return data.subcategory;
      if (data.subcategory) return data.subcategory;
      const inputPath = data.page && data.page.inputPath;
      if (!inputPath) return null;
      const pathParts = inputPath.split(/[/\\]/);
      const fileName = pathParts[pathParts.length - 1];
      const stem = fileName.replace(/\.md$/, "");
      const parts = stem.split("@");
      return parts[1] ? parts[1].trim() : null;
    },
    layout: (data) => {
      if (!isPostInput(data)) return data.layout;
      return data.layout || "layouts/post.njk";
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
