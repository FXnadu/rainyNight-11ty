/**
 * Eleventy collection registration.
 * Builds categories, redirects, and folder groupings.
 * Delegates path parsing to path-utils and metadata to category-meta.
 */
const siteConfig = require("../../src/_data/siteConfig");
const { encodeSlug } = require("../utils/slug-encoder");
const { normalizePath, getFolderNameFromPostPath } = require("../utils/path-utils");
const { loadCategoryMeta, getCategoryMeta, getSubcategoryMeta } = require("./category-meta");
const { comparePostsForCategoryPages, getPagesWithTags, getPostsFromContentDir } = require("./post-utils");
const { resolveContentType } = require("./content-types");

// --- Comparison helpers ---

function getFileSlugFromPostInputPath(inputPath) {
  if (!inputPath) return "";
  const normalized = normalizePath(inputPath);
  const resolved = resolveContentType(normalized);
  if (!resolved) return "";

  const markerIndex = normalized.indexOf(resolved.marker);
  const relativePath = normalized.slice(markerIndex + resolved.marker.length);
  const fileName = relativePath.split("/").pop() || "";
  return fileName.replace(/\.md$/, "");
}

// --- Category tree builder ---

function buildCategoryNodes(posts, meta) {
  const nodes = {};

  posts.forEach((item) => {
    const segments = [];
    const inputPath = item && item.inputPath ? item.inputPath : "";
    const normalized = normalizePath(inputPath);
    const resolved = resolveContentType(normalized);

    if (!resolved) return;

    const markerIndex = normalized.indexOf(resolved.marker);
    const relativePath = normalized.slice(markerIndex + resolved.marker.length);
    const pathSegments = relativePath.split("/").filter(Boolean);

    if (pathSegments.length < 2) return;

    const topLevelCategory = pathSegments[0];
    const subcategoryCode = pathSegments.length >= 3 ? pathSegments[pathSegments.length - 2] : null;
    const categoryPath = topLevelCategory;

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

  // Attach subcategory metadata
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

  // Sort children by title
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

  // Collision detection: warn if two different categories produce the same encodedKey
  const encodedKeyMap = new Map();
  Object.values(nodes).forEach((node) => {
    const existing = encodedKeyMap.get(node.encodedKey);
    if (existing && existing !== node.key) {
      console.warn(
        `[slug-collision] encodedKey "${node.encodedKey}" is shared by "${existing}" and "${node.key}". ` +
        "One of these categories should be renamed to avoid URL conflicts."
      );
    }
    encodedKeyMap.set(node.encodedKey, node.key);
  });

  return nodes;
}

// --- Registration ---

function registerCollections(eleventyConfig) {
  const categoryPageSize = siteConfig.pagination && Number(siteConfig.pagination.categoryPageSize) > 0
    ? Number(siteConfig.pagination.categoryPageSize)
    : 10;

  // --- Build-time caches: each value computed once per build ---
  let _posts = null;
  let _meta = null;
  let _nodes = null;

  const getPosts = (collectionApi) => {
    if (!_posts) _posts = getPostsFromContentDir(collectionApi);
    return _posts;
  };

  const getMeta = () => {
    if (!_meta) _meta = loadCategoryMeta();
    return _meta;
  };

  const getNodes = (collectionApi) => {
    if (!_nodes) _nodes = buildCategoryNodes(getPosts(collectionApi), getMeta());
    return _nodes;
  };

  // --- Collection registrations ---

  eleventyConfig.addCollection("posts", (collectionApi) =>
    getPosts(collectionApi)
  );

  eleventyConfig.addCollection("categories", (collectionApi) => {
    const { getCategoryFromPath } = require("../utils/path-utils");
    const categories = {};

    getPosts(collectionApi).forEach((item) => {
      const categoryPath = getCategoryFromPath(item.inputPath);
      const parts = categoryPath.split("/");
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

    Object.keys(categories).forEach((key) => {
      categories[key].sort(comparePostsForCategoryPages);
    });

    return categories;
  });

  eleventyConfig.addCollection("categoriesList", (collectionApi) => {
    return Object.values(getNodes(collectionApi));
  });

  eleventyConfig.addCollection("categoryPages", (collectionApi) => {
    const nodes = getNodes(collectionApi);
    const pages = [];

    Object.values(nodes).forEach((node) => {
      const sortedPosts = [...node.posts].sort(comparePostsForCategoryPages);
      const totalPages = Math.max(1, Math.ceil(sortedPosts.length / categoryPageSize));
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

  eleventyConfig.addCollection("categoryRedirects", (collectionApi) => {
    const nodes = getNodes(collectionApi);
    const redirects = [];

    Object.values(nodes).forEach((node) => {
      const oldUrl = `/categories/${node.key}/`;
      const newUrl = `/categories/${node.encodedKey}/`;

      redirects.push({ oldUrl, newUrl, title: node.title });

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

  eleventyConfig.addCollection("postRedirects", (collectionApi) => {
    const posts = getPosts(collectionApi);
    const redirectsByOldUrl = new Map();

    posts.forEach((post) => {
      const inputPath = post.inputPath || "";
      const fileSlug = getFileSlugFromPostInputPath(inputPath);
      const newUrl = post.url;
      const title = (post.data && post.data.title) ? post.data.title : (fileSlug || "post");

      if (fileSlug) {
        const oldUrl = `/posts/${fileSlug}/`;
        if (oldUrl !== newUrl && !redirectsByOldUrl.has(oldUrl)) {
          redirectsByOldUrl.set(oldUrl, { oldUrl, newUrl, title });
        }
      }

      const legacyKey = (post.data && post.data.title) ? post.data.title : (fileSlug || "");
      if (legacyKey) {
        const legacyId = encodeSlug(String(legacyKey), { prefix: "p", minLength: 6 });
        const oldUrl = `/posts/${legacyId}/`;
        if (oldUrl !== newUrl && !redirectsByOldUrl.has(oldUrl)) {
          redirectsByOldUrl.set(oldUrl, { oldUrl, newUrl, title });
        }
      }

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

  // --- Content tag collections ---

  eleventyConfig.addCollection("tagList", (collectionApi) => {
    const tagMap = new Map();
    const posts = getPosts(collectionApi);
    const pages = getPagesWithTags(collectionApi);
    const allItems = [...posts, ...pages];

    allItems.forEach((item) => {
      const contentTags = item.data && Array.isArray(item.data.contentTags) ? item.data.contentTags : [];
      contentTags.forEach((tag) => {
        const trimmed = String(tag).trim();
        if (!trimmed) return;
        if (!tagMap.has(trimmed)) {
          tagMap.set(trimmed, { title: trimmed, posts: [], encodedKey: encodeSlug(trimmed, { prefix: 't', minLength: 6 }) });
        }
        tagMap.get(trimmed).posts.push(item);
      });
    });

    // Sort posts within each tag by date descending
    tagMap.forEach((entry) => {
      entry.posts.sort((a, b) => b.date - a.date);
    });

    return Array.from(tagMap.values()).sort((a, b) => b.posts.length - a.posts.length);
  });

  eleventyConfig.addCollection("tagPages", (collectionApi) => {
    const tagMap = new Map();
    const posts = getPosts(collectionApi);
    const taggedPages = getPagesWithTags(collectionApi);
    const allItems = [...posts, ...taggedPages];

    allItems.forEach((item) => {
      const contentTags = item.data && Array.isArray(item.data.contentTags) ? item.data.contentTags : [];
      contentTags.forEach((tag) => {
        const trimmed = String(tag).trim();
        if (!trimmed) return;
        if (!tagMap.has(trimmed)) {
          tagMap.set(trimmed, { title: trimmed, posts: [], encodedKey: encodeSlug(trimmed, { prefix: 't', minLength: 6 }) });
        }
        tagMap.get(trimmed).posts.push(item);
      });
    });

    const pages = [];
    const tagPageSize = 16;

    tagMap.forEach((entry) => {
      const sortedPosts = [...entry.posts].sort((a, b) => b.date - a.date);
      const totalPages = Math.max(1, Math.ceil(sortedPosts.length / tagPageSize));
      const baseUrl = `/tags/${entry.encodedKey}/`;

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        const start = (pageNumber - 1) * tagPageSize;
        const pagePosts = sortedPosts.slice(start, start + tagPageSize);
        const url = pageNumber === 1 ? baseUrl : `${baseUrl}page/${pageNumber}/`;

        pages.push({
          title: entry.title,
          encodedKey: entry.encodedKey,
          url,
          baseUrl,
          pageNumber,
          totalPages,
          count: sortedPosts.length,
          posts: pagePosts
        });
      }
    });

    return pages;
  });

  eleventyConfig.addCollection("folderGroups", (collectionApi) => {
    const folders = {};
    const posts = getPosts(collectionApi);
    const meta = getMeta();

    posts.forEach((item) => {
      const folder = getFolderNameFromPostPath(item.inputPath);
      const inputPath = item.inputPath || "";
      const normalized = normalizePath(inputPath);
      const resolved = resolveContentType(normalized);
      let topLevelCategory = folder;
      let subcategoryCode = null;

      if (resolved) {
        const markerIndex = normalized.indexOf(resolved.marker);
        const relativePath = normalized.slice(markerIndex + resolved.marker.length);
        const pathSegments = relativePath.split("/").filter(Boolean);
        if (pathSegments.length >= 1) topLevelCategory = pathSegments[0];
        if (pathSegments.length >= 3) subcategoryCode = pathSegments[pathSegments.length - 2];
      }

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
      const displayDesc = subMeta && subMeta.description ? subMeta.description : (metaEntry ? metaEntry.description : "暂无简介");

      const existingCategory = folders[folder].categories.find(c => c.key === nodeKey);
      if (!existingCategory) {
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

    Object.values(folders).forEach((folder) => {
      folder.categories.forEach((cat) => {
        cat.posts.sort((a, b) => {
          const orderA = a.data?.order ?? a.data?.categoryOrder ?? Infinity;
          const orderB = b.data?.order ?? b.data?.categoryOrder ?? Infinity;

          if (orderA !== Infinity || orderB !== Infinity) {
            if (orderA !== orderB) {
              return orderA - orderB;
            }
          }

          return b.date - a.date;
        });
      });
    });

    return Object.values(folders).sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.title.localeCompare(b.title, "zh-Hans-CN");
    });
  });
}

module.exports = { registerCollections };
