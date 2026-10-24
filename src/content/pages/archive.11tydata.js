const siteConfig = require("../../_data/siteConfig");

const archivePageSize = siteConfig.pagination && Number(siteConfig.pagination.archivePageSize) > 0
  ? Number(siteConfig.pagination.archivePageSize)
  : 20;

module.exports = {
  title: siteConfig.pages && siteConfig.pages.archive && siteConfig.pages.archive.title
    ? siteConfig.pages.archive.title
    : "归档",
  pagination: {
    data: "collections.posts",
    size: archivePageSize,
    alias: "pagedPosts"
  },
  permalink(data) {
    return data.pagination.pageNumber === 0
      ? "/archive/"
      : `/archive/page/${data.pagination.pageNumber + 1}/`;
  }
};
