const fs = require("fs");
const path = require("path");
const siteConfig = require("../../src/_data/siteConfig");
const { encodeSlug } = require("../utils/slug-encoder");

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

function normalizeMetaEntry(entry, categoryPath) {
  if (typeof entry === "string") {
    const description = entry.trim() || DEFAULT_CATEGORY_DESCRIPTION;
    return { description };
  }

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;

  const description = typeof entry.description === "string"
    ? (entry.description.trim() || DEFAULT_CATEGORY_DESCRIPTION)
    : DEFAULT_CATEGORY_DESCRIPTION;

  const result = { description };
  
  if (entry.subcategories && typeof entry.subcategories === "object" && !Array.isArray(entry.subcategories)) {
    result.subcategories = entry.subcategories;
  }

  return result;
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
        const entry = normalizeMetaEntry(rawCategories[categoryPath], categoryPath);
        if (entry) normalized.categories[categoryPath] = entry;
      });
    }
    return normalized;
  }

  Object.keys(rawMeta).forEach((categoryPath) => {
    const entry = normalizeMetaEntry(rawMeta[categoryPath], categoryPath);
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

function getSubcategoryMeta(meta, topLevelCategory, subcategoryCode) {
  if (!meta.categories || !meta.categories[topLevelCategory]) return null;
  const cat = meta.categories[topLevelCategory];
  if (!cat.subcategories || !cat.subcategories[subcategoryCode]) return null;
  return cat.subcategories[subcategoryCode];
}

function buildCategoryNodes(posts, meta) {
  const nodes = {};

  posts.forEach((item) => {
    const category = getCategoryPathFromPost(item);
    const parts = category.split("/");
    const subcategoryCode = item.data && item.data.subcategory ? item.data.subcategory : null;
    const topLevelCategory = parts[0];
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
          meta: {},
          // 生成 BV 风格短 ID（使用 'c' 前缀表示 category）
          encodedKey: encodeSlug(currentPath, { prefix: 'c', minLength: 6 })
        };
      }

      if (index === parts.length - 1) {
        if (subcategoryCode) {
          const subMeta = getSubcategoryMeta(meta, topLevelCategory, subcategoryCode);
          const subPath = `${currentPath}/${subcategoryCode}`;
          const displayTitle = subMeta && subMeta.name ? subMeta.name : subcategoryCode;
          
          if (!nodes[subPath]) {
            nodes[subPath] = {
              key: subPath,
              title: displayTitle,
              posts: [],
              children: [],
              parent: currentPath,
              meta: {},
              // 生成 BV 风格短 ID
              encodedKey: encodeSlug(subPath, { prefix: 'c', minLength: 6 })
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

    const parts = key.split("/");
    const topLevelCategory = parts[0];
    const subcategoryCode = parts.length > 1 ? parts[1] : null;

    if (subcategoryCode) {
      const metaEntry = getSubcategoryMeta(meta, topLevelCategory, subcategoryCode);
      if (metaEntry && metaEntry.description) {
        node.meta = { description: metaEntry.description };
      }
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
      // 使用 encodedKey 生成 URL
      const baseUrl = `/categories/${node.encodedKey}/`;
      const parts = node.key.split("/");
      const breadcrumbs = [];
      let parentPath = "";

      for (let i = 0; i < parts.length - 1; i += 1) {
        parentPath = parentPath ? `${parentPath}/${parts[i]}` : parts[i];
        const parentNode = nodes[parentPath];
        breadcrumbs.push({
          title: parentNode ? parentNode.title : parts[i],
          url: `/categories/${parentNode ? parentNode.encodedKey : encodeSlug(parentPath, { prefix: 'c', minLength: 6 })}/`
        });
      }

      const children = node.children
        .map((childKey) => {
          const child = nodes[childKey];
          return {
            title: child.title,
            url: `/categories/${child.encodedKey}/`,
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
          encodedKey: node.encodedKey,
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

  // 生成分类页面重定向（旧中文 URL → 新短编码 URL）
  eleventyConfig.addCollection("categoryRedirects", (collectionApi) => {
    const posts = getPostsFromContentDir(collectionApi);
    const meta = loadCategoryMeta();
    const nodes = buildCategoryNodes(posts, meta);
    const redirects = [];

    Object.values(nodes).forEach((node) => {
      // 旧 URL（中文）
      const oldUrl = `/categories/${node.key}/`;
      // 新 URL（短编码）
      const newUrl = `/categories/${node.encodedKey}/`;
      
      redirects.push({
        oldUrl,
        newUrl,
        title: node.title
      });

      // 也生成分页的重定向
      const sortedPosts = [...node.posts].sort(comparePostsForCategoryPages);
      const totalPages = Math.ceil(sortedPosts.length / categoryPageSize);
      
      for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
        redirects.push({
          oldUrl: `/categories/${node.key}/page/${pageNumber}/`,
          newUrl: `/categories/${node.encodedKey}/page/${pageNumber}/`,
          title: node.title
        });
      }
    });

    return redirects;
  });

  // 生成文章页面重定向（旧 fileSlug URL → 新短编码 URL）
  eleventyConfig.addCollection("postRedirects", (collectionApi) => {
    const posts = getPostsFromContentDir(collectionApi);
    const redirects = [];

    posts.forEach((post) => {
      const inputPath = post.inputPath || "";
      const normalizedPath = inputPath.split(path.sep).join("/");
      const marker = "/src/content/posts/";
      const markerIndex = normalizedPath.indexOf(marker);
      
      if (markerIndex === -1) return;
      
      const relativePath = normalizedPath.slice(markerIndex + marker.length);
      const fileName = relativePath.split("/").pop();
      const fileSlug = fileName.replace(/\.md$/, "");
      
      // 旧 URL（基于文件名/fileSlug）
      const oldUrl = `/posts/${fileSlug}/`;
      // 新 URL（已经编码好的）
      const newUrl = post.url;
      
      // 如果新旧 URL 不同，添加重定向
      if (oldUrl !== newUrl) {
        redirects.push({
          oldUrl,
          newUrl,
          title: post.data?.title || fileSlug
        });
      }
    });

    return redirects;
  });

  eleventyConfig.addCollection("folderGroups", (collectionApi) => {
    const folders = {};
    const posts = getPostsFromContentDir(collectionApi);
    const meta = loadCategoryMeta();

    posts.forEach((item) => {
      const category = getCategoryPathFromPost(item);
      const topLevelCategory = category.split("/")[0];
      const folder = getFolderNameFromPostPath(item);
      const subcategoryCode = item.data && item.data.subcategory ? item.data.subcategory : null;
      const metaEntry = getCategoryMeta(meta, topLevelCategory);
      const subMeta = subcategoryCode ? getSubcategoryMeta(meta, topLevelCategory, subcategoryCode) : null;

      if (!folders[folder]) {
        folders[folder] = {
          title: folder,
          order: metaEntry && metaEntry.order ? metaEntry.order : 999,
          categories: []
        };
      }

      const nodeKey = subcategoryCode 
        ? `${topLevelCategory}::${subcategoryCode}`
        : topLevelCategory;

      const displayTitle = subMeta && subMeta.name ? subMeta.name : (subcategoryCode || topLevelCategory);
      const displayDesc = subMeta && subMeta.description ? subMeta.description : (metaEntry ? metaEntry.description : DEFAULT_CATEGORY_DESCRIPTION);

      const existingCategory = folders[folder].categories.find(c => c.key === nodeKey);
      if (!existingCategory) {
        // 生成编码后的 URL
        const categoryPath = subcategoryCode 
          ? `${topLevelCategory}/${subcategoryCode}`
          : topLevelCategory;
        const encodedPath = encodeSlug(categoryPath, { prefix: 'c', minLength: 6 });
        
        folders[folder].categories.push({
          key: nodeKey,
          title: displayTitle,
          url: `/categories/${encodedPath}/`,
          count: 0,
          posts: [],
          folder,
          isSubcategory: !!subcategoryCode,
          parentTitle: topLevelCategory,
          description: displayDesc
        });
      }

      const cat = folders[folder].categories.find(c => c.key === nodeKey);
      cat.count += 1;
      cat.posts.push(item);
    });

    // 按 order 排序，order 相同则按标题排序
    return Object.values(folders).sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.title.localeCompare(b.title, "zh-Hans-CN");
    });
  });
}

module.exports = {
  registerCollections,
  getFolderNameFromPostPath
};
