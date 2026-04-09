const { DateTime } = require("luxon");
const { getFolderNameFromPostPath } = require("./collections");
const { encodeSlug } = require("../utils/slug-encoder");
const path = require("path");

const toUtcDate = (dateObj) => DateTime.fromJSDate(dateObj, { zone: "utc" });

function getCategoryName(inputPath) {
  if (!inputPath) return null;
  const normalized = inputPath.split(path.sep).join("/");
  const marker = "/src/content/posts/";
  const idx = normalized.indexOf(marker);
  if (idx === -1) return null;
  return normalized.slice(idx + marker.length).split("/").filter(Boolean)[0] || null;
}

function registerDateFilters(eleventyConfig) {
  eleventyConfig.addFilter("readableDate", (dateObj) =>
    toUtcDate(dateObj).toFormat("yyyy-MM-dd")
  );

  eleventyConfig.addFilter("htmlDateString", (dateObj) =>
    toUtcDate(dateObj).toFormat("yyyy-MM-dd")
  );

  eleventyConfig.addFilter("year", (dateObj) =>
    toUtcDate(dateObj).toFormat("yyyy")
  );

  eleventyConfig.addFilter("archiveMonth", (dateObj) =>
    toUtcDate(dateObj).toFormat("MM")
  );

  eleventyConfig.addFilter("archiveMonthLabel", (dateObj) =>
    toUtcDate(dateObj).toFormat("yyyy年MM月")
  );

  eleventyConfig.addFilter("folderNameFromPost", (data) =>
    getFolderNameFromPostPath(data)
  );

  eleventyConfig.addFilter("categoryFromPath", (inputPath) =>
    getCategoryName(inputPath)
  );

  eleventyConfig.addFilter("groupByDate", (items) => {
    const groups = {};
    items.forEach((item) => {
      const dateStr = toUtcDate(item.date).toFormat("yyyy-MM-dd");
      if (!groups[dateStr]) {
        groups[dateStr] = { date: dateStr, items: [] };
      }
      groups[dateStr].items.push(item);
    });
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  });
}

function registerTitleFilters(eleventyConfig) {
  eleventyConfig.addFilter("formatTitle", (title, siteTitle, sep = " | ") => {
    const s = siteTitle ? String(siteTitle) : "";
    if (!title) return s;
    const t = String(title);
    if (!s) return t;
    return t.includes(s) ? t : `${t}${sep}${s}`;
  });

  // 将字符串编码为BV风格短ID
  eleventyConfig.addFilter("encodeSlug", (str, options = {}) => {
    return encodeSlug(str, options);
  });

  // 将换行符转换为br标签
  eleventyConfig.addFilter("nl2br", (str) => {
    return String(str || "").replace(/\n/g, "<br>");
  });
}

module.exports = { registerDateFilters, registerTitleFilters };
