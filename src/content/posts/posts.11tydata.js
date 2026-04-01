const fs = require("fs");

function normalizeSlugToTitle(slug) {
  if (typeof slug !== 'string') return '';
  return slug.replace(/[-_]+/g, ' ').trim();
}

function getFallbackDate(data) {
  const rawDate = data && data.date;
  if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    return rawDate;
  }

  const inputPath = data && data.page ? data.page.inputPath : "";
  if (!inputPath) {
    return new Date();
  }

  try {
    const stats = fs.statSync(inputPath);
    if (stats.birthtime instanceof Date && !Number.isNaN(stats.birthtime.getTime())) {
      return stats.birthtime;
    }
    return stats.mtime;
  } catch {
    return new Date();
  }
}

module.exports = {
  eleventyComputed: {
    title: (data) => {
      const rawTitle = typeof data.title === 'string' ? data.title.trim() : '';
      if (rawTitle) return rawTitle;

      const fileSlug = data && data.page ? data.page.fileSlug : '';
      const fallbackTitle = normalizeSlugToTitle(fileSlug);
      return fallbackTitle || '未命名文章';
    },
    date: (data) => getFallbackDate(data)
  }
};

// Z