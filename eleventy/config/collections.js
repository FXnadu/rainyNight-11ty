const fs = require("fs");
const path = require("path");
const siteConfig = require("../../src/_data/siteConfig");

const DEFAULT_CATEGORY_DESCRIPTION = "暂无简介";

function getFolderNameFromPostPath(item) {
  const inputPath = item && item.inputPath ? item.inputPath : "";
  if (!inputPath) return "其他";

  const normalizedPath = inputPath.split(path.sep).join("/");
  const marker = "/src/content/posts/";
  const markerIndex = normalizedPath.indexOf(marker);

  if (markerIndex === -1) return "其他";

  const relativePath = normalizedPath.slice(markerIndex + marker.length);
  const segments = relativePath.split("/").filter(Boolean);

  if (segments.length <= 1) return "其他";
  return segments[0];
}

function getCategoryPathFromPost(item) {
  const folder = getFolderNameFromPostPath(item);
  if (folder && folder !== "其他") return folder;

  return "默认分类";
}

function getPostsFromContentDir(collectionApi) {
  return collectionApi
    .getAll()
    .filter((item) => {
      if (!item || !item.inputPath) return false;
      const normalizedPath = item.inputPath.split(path.sep).join("/");
      return normalizedPath.includes("/src/content/posts/") && normalizedPath.endsWith(".md");
    })
    .sort((a, b) => b.date - a.date);
}

function getNumberFromFrontMatter(item, fieldName, fallbackValue) {
  const rawValue = item && item.data ? item.data[fieldName] : undefined;
  if (rawValue === undefined || rawValue === null || rawValue === "") return fallbackValue;

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function comparePostsForCategoryPages(a, b) {
  const orderA = getNumberFromFrontMatter(a, "categoryOrder", Number.MAX_SAFE_INTEGER);
  const orderB = getNumberFromFrontMatter(b, "categoryOrder", Number.MAX_SAFE_INTEGER);
  if (orderA !== orderB) return orderA - orderB;

  const dateDiff = b.date - a.date;
  if (dateDiff !== 0) return dateDiff;

  const titleA = a && a.data && a.data.title ? a.data.title : "";
  const titleB = b && b.data && b.data.title ? b.data.title : "";
  return titleA.localeCompare(titleB, "zh-Hans-CN");
}

function loadJsonFileSafe(filePath, fallbackValue = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallbackValue;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(`[category-meta] Invalid JSON in ${filePath}. Using fallback.`, error.message);
    return fallbackValue;
  }
}

function normalizeMetaEntry(entry) {
  if (typeof entry === "string") {
    const description = entry.trim() || DEFAULT_CATEGORY_DESCRIPTION;
    return { description };
  }

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;

  const description = typeof entry.description === "string"
    ? (entry.description.trim() || DEFAULT_CATEGORY_DESCRIPTION)
    : DEFAULT_CATEGORY_DESCRIPTION;

  return { description };
}

function normalizeMetaObject(rawMeta, sourceLabel) {
  const normalized = { categories: {} };

  if (!rawMeta || typeof rawMeta !== "object" || Array.isArray(rawMeta)) {
    if (rawMeta !== undefined) {
      console.warn(`[category-meta] Ignore non-object source: ${sourceLabel}`);
    }
    return normalized;
  }

  if (rawMeta.categories) {
    const rawCategories = rawMeta.categories;
    if (rawCategories && typeof rawCategories === "object" && !Array.isArray(rawCategories)) {
      Object.keys(rawCategories).forEach((categoryPath) => {
        const entry = normalizeMetaEntry(rawCategories[categoryPath]);
        if (entry) normalized.categories[categoryPath] = entry;
      });
    }
    return normalized;
  }

  Object.keys(rawMeta).forEach((categoryPath) => {
    const entry = normalizeMetaEntry(rawMeta[categoryPath]);
    if (entry) normalized.categories[categoryPath] = entry;
  });

  return normalized;
}

function loadCategoryMeta() {
  const settingsDir = path.join(process.cwd(), "src/content/settings");
  const descriptionsPath = path.join(settingsDir, "categoryDescriptions.json");
  return normalizeMetaObject(loadJsonFileSafe(descriptionsPath), descriptionsPath);
}

function getCategoryMeta(meta, categoryPath) {
  const category = typeof categoryPath === "string" ? categoryPath.trim() : "";
  const topLevelCategory = category.split("/")[0];

  if (meta.categories[category]) return meta.categories[category];
  if (meta.categories[topLevelCategory]) return meta.categories[topLevelCategory];
  return null;
}

function buildCategoryNodes(posts, meta) {
  const nodes = {};

  posts.forEach((item) => {
    const category = getCategoryPathFromPost(item);
    const parts = category.split("/");
    const subcategory = item.data && item.data.subcategory ? item.data.subcategory : null;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!nodes[currentPath]) {
        nodes[currentPath] = {
          key: currentPath,
          title: part,
          posts: [],
          children: [],
          parent: index > 0 ? parts.slice(0, index).join("/") : null,
          meta: {}
        };
      }

      if (index === parts.length - 1) {
        if (subcategory) {
          const subPath = `${currentPath}/${subcategory}`;
          if (!nodes[subPath]) {
            nodes[subPath] = {
              key: subPath,
              title: subcategory,
              posts: [],
              children: [],
              parent: currentPath,
              meta: {}
            };
          }
          nodes[subPath].posts.push(item);
          if (!nodes[currentPath].children.includes(subPath)) {
            nodes[currentPath].children.push(subPath);
          }
        } else {
          nodes[currentPath].posts.push(item);
        }
      }
    });
  });

  Object.keys(nodes).forEach((key) => {
    const node = nodes[key];

    if (node.parent && nodes[node.parent] && !nodes[node.parent].children.includes(key)) {
      nodes[node.parent].children.push(key);
    }

    const metaEntry = getCategoryMeta(meta, key);
    if (metaEntry) {
      node.meta = metaEntry;
    }
  });

  return nodes;
}

function registerCollections(eleventyConfig) {
  const categoryPageSize = siteConfig.pagination && Number(siteConfig.pagination.categoryPageSize) > 0
    ? Number(siteConfig.pagination.categoryPageSize)
    : 10;

  eleventyConfig.addCollection("posts", (collectionApi) =>
    getPostsFromContentDir(collectionApi)
  );

  eleventyConfig.addCollection("categories", (collectionApi) => {
    const categories = {};

    getPostsFromContentDir(collectionApi).forEach((item) => {
      const category = getCategoryPathFromPost(item);
      const parts = category.split("/");
      let currentPath = "";

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!categories[currentPath]) {
          categories[currentPath] = [];
        }

        if (isLast) {
          categories[currentPath].push(item);
        }
      });
    });

    return categories;
  });

  eleventyConfig.addCollection("categoriesList", (collectionApi) => {
    const posts = getPostsFromContentDir(collectionApi);
    const meta = loadCategoryMeta();
    const nodes = buildCategoryNodes(posts, meta);
    return Object.values(nodes);
  });

  eleventyConfig.addCollection("categoryPages", (collectionApi) => {
    const posts = getPostsFromContentDir(collectionApi);
    const meta = loadCategoryMeta();
    const nodes = buildCategoryNodes(posts, meta);
    const pages = [];

    Object.values(nodes).forEach((node) => {
      const sortedPosts = [...node.posts].sort(comparePostsForCategoryPages);
      const totalPages = Math.max(1, Math.ceil(sortedPosts.length / categoryPageSize));
      const baseUrl = `/categories/${node.key}/`;
      const parts = node.key.split("/");
      const breadcrumbs = [];
      let parentPath = "";

      for (let i = 0; i < parts.length - 1; i += 1) {
        parentPath = parentPath ? `${parentPath}/${parts[i]}` : parts[i];
        const parentNode = nodes[parentPath];
        breadcrumbs.push({
          title: parentNode ? parentNode.title : parts[i],
          url: `/categories/${parentPath}/`
        });
      }

      const children = node.children
        .map((childKey) => {
          const child = nodes[childKey];
          return {
            title: child.title,
            url: `/categories/${childKey}/`,
            count: child.posts.length
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        const start = (pageNumber - 1) * categoryPageSize;
        const pagePosts = sortedPosts.slice(start, start + categoryPageSize);
        const url = pageNumber === 1 ? baseUrl : `${baseUrl}page/${pageNumber}/`;

        pages.push({
          key: node.key,
          title: node.title,
          url,
          baseUrl,
          pageNumber,
          totalPages,
          count: sortedPosts.length,
          posts: pagePosts,
          children,
          breadcrumbs,
          meta: node.meta || {}
        });
      }
    });

    return pages;
  });

  eleventyConfig.addCollection("folderGroups", (collectionApi) => {
    const folders = {};
    const posts = getPostsFromContentDir(collectionApi);
    const meta = loadCategoryMeta();
    const categoryNodes = {};

    posts.forEach((item) => {
      const category = getCategoryPathFromPost(item);
      const topLevelCategory = category.split("/")[0];
      const folder = getFolderNameFromPostPath(item);
      const subcategory = item.data && item.data.subcategory ? item.data.subcategory : null;
      
      const nodeKey = subcategory 
        ? `${folder}::${topLevelCategory}::${subcategory}`
        : `${folder}::${topLevelCategory}`;
      
      const metaEntry = getCategoryMeta(meta, topLevelCategory);

      if (!categoryNodes[nodeKey]) {
        categoryNodes[nodeKey] = {
          title: subcategory || topLevelCategory,
          url: subcategory 
            ? `/categories/${topLevelCategory}/${subcategory}/`
            : `/categories/${topLevelCategory}/`,
          count: 0,
          posts: [],
          folder,
          isSubcategory: !!subcategory,
          parentTitle: topLevelCategory,
          description: metaEntry && metaEntry.description
            ? metaEntry.description
            : DEFAULT_CATEGORY_DESCRIPTION
        };
      }

      categoryNodes[nodeKey].count += 1;
      categoryNodes[nodeKey].posts.push(item);
    });

    Object.values(categoryNodes).forEach((node) => {
      if (!folders[node.folder]) {
        folders[node.folder] = {
          title: node.folder,
          categories: []
        };
      }
      folders[node.folder].categories.push(node);
    });

    return Object.values(folders).sort((a, b) =>
      a.title.localeCompare(b.title, "zh-Hans-CN")
    );
  });
}

module.exports = {
  registerCollections,
  getFolderNameFromPostPath
};
