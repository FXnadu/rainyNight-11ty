const path = require("path");

module.exports = {
  tags: ["moments"],
  permalink: false,
  eleventyComputed: {
    time: (data) => {
      if (data.time) return data.time;
      const inputPath = data.page && data.page.inputPath;
      if (!inputPath) return null;
      const baseName = path.basename(inputPath, ".md");
      const match = baseName.match(/^\d{4}-\d{2}-\d{2}-(\d{4})$/);
      if (!match) return null;
      return `${match[1].slice(0, 2)}:${match[1].slice(2)}`;
    }
  }
};
