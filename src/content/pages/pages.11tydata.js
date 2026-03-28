const siteConfig = require("../../_data/siteConfig");

const PAGE_TITLE_PATHS = {
  index: ["pages", "home", "title"],
  categories: ["pages", "categories", "title"],
  services: ["pages", "services", "title"],
  contact: ["pages", "contact", "title"],
  archive: ["pages", "archive", "title"]
};

function getByPath(obj, pathParts) {
  return pathParts.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

module.exports = {
  eleventyComputed: {
    title(data) {
      const slug = data && data.page ? data.page.fileSlug : "";
      const pathParts = PAGE_TITLE_PATHS[slug];
      if (!pathParts) return data.title;

      const configuredTitle = getByPath(siteConfig, pathParts);
      if (typeof configuredTitle === "string" && configuredTitle.trim()) {
        return configuredTitle;
      }

      return data.title;
    }
  }
};
