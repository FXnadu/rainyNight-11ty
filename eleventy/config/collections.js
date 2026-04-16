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

function getFileSlugFromPostInputPath(inputPath) {
  if (!inputPath) return "";
  const normalizedPath = inputPath.split(path.sep).join("/");
  const marker = "/src/content/posts/";
  const markerIndex = normalizedPath.indexOf(marker);
  if (markerIndex === -1) return "";

  const relativePath = normalizedPath.slice(markerIndex + marker.length);
  const fileName = relativePath.split("/").pop() || "";
  return fileName.replace(/\.md$/, "");
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
  
  // 保留 order 字段用于排序
  if (typeof entry.order === "number") {
    result.order = entry.order;
  }
  
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
  const dataDir = path.join(process.cwd(), "src/_data");
  const metaPath = path.join(dataDir, "categoryMeta.json");
  return normalizeMetaObject(loadJsonFileSafe(metaPath), metaPath);
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
    const inputPath = item && item.inputPath ? item.inputPath : "";
    const normalizedPath = inputPath.split(path.sep).join("/");
    const marker = "/src/content/posts/";
    const markerIndex = normalizedPath.indexOf(marker);
    
    if (markerIndex === -1) return;
    
    const relativePath = normalizedPath.slice(markerIndex + marker.length);
    const segments = relativePath.split("/").filter(Boolean);
    
    if (segments.length < 2) return;
    
    const topLevelCategory = segments[0];
    const subcategoryCode = segments.length >= 3 ? segments[segments.length - 2] : null;
    
    // 构建分类路径
    const categoryPath = topLevelCategory;
    
    // 创建顶级分类节点
    if (!nodes[categoryPath]) {
      nodes[categoryPath] = {
        key: categoryPath,
        title: topLevelCategory,
        posts: [],
        children: [],
        parent: null,
        meta: {},
        encodedKey: encodeSlug(categoryPath, { prefix: 'c', minLength: 6 })
      };
    }
    
    // 如果有子分类
    if (subcategoryCode) {
      const subPath = `${categoryPath}/${subcategoryCode}`;
      
      if (!nodes[subPath]) {
        nodes[subPath] = {
          key: subPath,
          title: subcategoryCode,
          posts: [],
          children: [],
          parent: categoryPath,
          meta: {},
          encodedKey: encodeSlug(subPath, { prefix: 'c', minLength: 6 })
        };
      }
      
      nodes[subPath].posts.push(item);
      if (!nodes[categoryPath].children.includes(subPath)) {
        nodes[categoryPath].children.push(subPath);
      }
    } else {
      nodes[categoryPath].posts.push(item);
    }
  });

  // 为子分类添加元数据描述
  Object.keys(nodes).forEach((key) => {
    const node = nodes[key];
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

  // 按文件夹名排序子分类
  Object.keys(nodes).forEach((key) => {
    const node = nodes[key];
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => {
        const nodeA = nodes[a];
        const nodeB = nodes[b];
        return nodeA.title.localeCompare(nodeB.title, "zh-Hans-CN");
      });
    }
  });

  return nodes;
}

function compareMoments(a, b) {
  const dateA = a.date;
  const dateB = b.date;
  if (dateA - dateB !== 0) return dateB - dateA;
  const timeA = a.data && a.data.time ? a.data.time : "";
  const timeB = b.data && b.data.time ? b.data.time : "";
  return timeB.localeCompare(timeA);
}

function registerCollections(eleventyConfig) {
  const categoryPageSize = siteConfig.pagination && Number(siteConfig.pagination.categoryPageSize) > 0
    ? Number(siteConfig.pagination.categoryPageSize)
    : 10;

  eleventyConfig.addCollection("moments", (collectionApi) =>
    collectionApi
      .getFilteredByTag("moments")
      .sort(compareMoments)
  );

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

    // 对每个分类下的文章按 categoryOrder 排序
    Object.keys(categories).forEach((key) => {
      categories[key].sort(comparePostsForCategoryPages);
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
    const redirectsByOldUrl = new Map();

    posts.forEach((post) => {
      const inputPath = post.inputPath || "";
      const fileSlug = getFileSlugFromPostInputPath(inputPath);
      const newUrl = post.url;
      const title = (post.data && post.data.title) ? post.data.title : (fileSlug || "post");

      // Legacy URL 1: based on fileSlug (human readable)
      if (fileSlug) {
        const oldUrl = `/posts/${fileSlug}/`;
        if (oldUrl !== newUrl && !redirectsByOldUrl.has(oldUrl)) {
          redirectsByOldUrl.set(oldUrl, { oldUrl, newUrl, title });
        }
      }

      // Legacy URL 2: previously used short id derived from title (or fileSlug when title missing)
      const legacyKey = (post.data && post.data.title) ? post.data.title : (fileSlug || "");
      if (legacyKey) {
        const legacyId = encodeSlug(String(legacyKey), { prefix: "p", minLength: 6 });
        const oldUrl = `/posts/${legacyId}/`;
        if (oldUrl !== newUrl && !redirectsByOldUrl.has(oldUrl)) {
          redirectsByOldUrl.set(oldUrl, { oldUrl, newUrl, title });
        }
      }

      // Future-proof: if someone explicitly sets slug/id and later changes it,
      // they can add aliases (array of old URLs) in front matter and we will redirect them.
      const aliases = post.data && Array.isArray(post.data.aliases) ? post.data.aliases : [];
      aliases.forEach((alias) => {
        const oldUrl = typeof alias === "string" ? alias.trim() : "";
        if (!oldUrl) return;
        if (oldUrl !== newUrl && !redirectsByOldUrl.has(oldUrl)) {
          redirectsByOldUrl.set(oldUrl, { oldUrl, newUrl, title });
        }
      });
    });

    return Array.from(redirectsByOldUrl.values());
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

    // 对每个分类下的文章排序：先按 order/categoryOrder，再按日期（新到旧）
    Object.values(folders).forEach((folder) => {
      folder.categories.forEach((cat) => {
        cat.posts.sort((a, b) => {
          // 获取 order 或 categoryOrder，默认 Infinity（排最后）
          const orderA = a.data?.order ?? a.data?.categoryOrder ?? Infinity;
          const orderB = b.data?.order ?? b.data?.categoryOrder ?? Infinity;
          
          // 如果都有 order，按 order 排序
          if (orderA !== Infinity || orderB !== Infinity) {
            if (orderA !== orderB) {
              return orderA - orderB;
            }
          }
          
          // 否则按日期排序（新到旧）
          return b.date - a.date;
        });
      });
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
