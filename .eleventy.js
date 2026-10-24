const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItGitHubAlerts = require("markdown-it-github-alerts");
const markdownItMark = require("markdown-it-mark");
const markdownItTaskLists = require("markdown-it-task-lists");
const { registerDateFilters, registerTitleFilters } = require("./eleventy/config/filters");
const { registerCollections } = require("./eleventy/config/collections");
const { getComputedFields } = require("./eleventy/config/computed");
const { passthroughPaths } = require("./eleventy/config/passthrough");

module.exports = async function(eleventyConfig) {
  const { default: mermaidPlugin } = await import("@kevingimbel/eleventy-plugin-mermaid");

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(mermaidPlugin);

  // Expose environment variables to templates (e.g. env.ELEVENTY_ENV).
  eleventyConfig.addGlobalData("env", process.env);

  passthroughPaths.forEach((path) => eleventyConfig.addPassthroughCopy(path));

  registerDateFilters(eleventyConfig);
  registerTitleFilters(eleventyConfig);
  registerCollections(eleventyConfig);

  eleventyConfig.addFilter("limit", (array, limit) => {
    if (!Array.isArray(array)) return [];
    return array.slice(0, limit);
  });

  // Post defaults derived from directory structure and file metadata.
  eleventyConfig.addGlobalData("eleventyComputed", getComputedFields());

  // Markdown Configuration
  const mdOptions = {
    html: true,
    breaks: true,
    linkify: true,
  };

  const mdLib = markdownIt(mdOptions)
    .use(markdownItFootnote)
    .use(markdownItGitHubAlerts.default)
    .use(markdownItMark)
    .use(markdownItTaskLists, { enabled: true, label: true });

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
