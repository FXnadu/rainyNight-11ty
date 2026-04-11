const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDir = path.join(__dirname, '../src/content/posts');

// Helper to format a date as YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Extract title from filename (remove @author suffix)
const extractTitleFromFilename = (filename) => {
  const baseName = filename.replace(/\.md$/i, '');
  return baseName.split('@')[0].trim();
};

// Extract category from directory structure
// For structure: posts/Category/Subcategory/file.md -> returns Category
// For structure: posts/Category/file.md -> returns Category
const extractCategoryFromPath = (filePath) => {
  const relative = path.relative(postsDir, filePath).split(path.sep);
  if (relative.length >= 2) {
    // Always return the first directory as category
    return relative[0];
  }
  // Fallback to parent directory name
  return path.basename(path.dirname(filePath));
};

// 获取分类的下一个可用 order
function getNextCategoryOrder(category, ordersMap) {
  const orders = ordersMap[category] || new Set();
  let nextOrder = 1;
  while (orders.has(nextOrder)) {
    nextOrder++;
  }
  return nextOrder;
}

function processFile(filePath, ordersMap) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data: frontMatter, content } = matter(fileContent);
  let needsUpdate = false;

  const stats = fs.statSync(filePath);
  const birthtime = stats.birthtime;
  const mtime = stats.mtime;
  const filename = path.basename(filePath);

  // 1. Handle 'title' (derive from filename)
  if (!frontMatter.title) {
    frontMatter.title = extractTitleFromFilename(filename);
    needsUpdate = true;
    console.log(`[Title] Added title to: ${filename}`);
  }

  // 2. Handle 'category' (derive from parent directory)
  if (!frontMatter.category) {
    frontMatter.category = extractCategoryFromPath(filePath);
    needsUpdate = true;
    console.log(`[Category] Added category to: ${filename}`);
  }

  // Note: subcategory is no longer auto-added to front-matter
  // It is automatically detected from directory structure during build

  // 3. Handle 'date' (creation date)
  if (!frontMatter.date) {
    frontMatter.date = formatDate(birthtime);
    needsUpdate = true;
    console.log(`[Date] Added creation date to: ${filename}`);
  }

  // 4. Ensure 'description' field exists (user can fill or leave empty)
  if (!('description' in frontMatter)) {
    frontMatter.description = '';
    needsUpdate = true;
    console.log(`[Description] Added empty description field to: ${filename}`);
  }

  // 5. Handle 'categoryOrder' (auto-generate if not exists)
  const category = frontMatter.category || extractCategoryFromPath(filePath);
  if (!ordersMap[category]) {
    ordersMap[category] = new Set();
  }
  
  if (frontMatter.categoryOrder === undefined || frontMatter.categoryOrder === null) {
    const nextOrder = getNextCategoryOrder(category, ordersMap);
    frontMatter.categoryOrder = nextOrder;
    ordersMap[category].add(nextOrder);
    needsUpdate = true;
    console.log(`[CategoryOrder] Added order ${nextOrder} to: ${filename}`);
  } else {
    // 记录已有的 order，避免重复分配
    ordersMap[category].add(Number(frontMatter.categoryOrder));
  }

  // 6. Handle 'updated' (only show if different from date)
  // Only add 'updated' if it's a different day from 'date'
  const formattedMtime = formatDate(mtime);
  const formattedDate = frontMatter.date ? formatDate(new Date(frontMatter.date)) : null;

  if (formattedMtime !== formattedDate) {
    // The file was modified on a different day from creation
    // We should ADD or UPDATE the 'updated' field.
    if (frontMatter.updated !== formattedMtime) {
      frontMatter.updated = formattedMtime;
      needsUpdate = true;
      console.log(`[Updated] Set/updated modification date for: ${filename}`);
    }
  } else {
    // The file was modified on the same day as creation (or is new)
    // We should REMOVE the 'updated' field to avoid redundancy.
    if (frontMatter.updated) {
      delete frontMatter.updated;
      needsUpdate = true;
      console.log(`[Updated] Removed redundant update date from: ${filename}`);
    }
  }

  // 7. Write back to the file only if the content has actually changed
  if (needsUpdate) {
    const newFileContent = matter.stringify(content, frontMatter);
    // Final check: only write if the content is truly different
    if (newFileContent !== fileContent) {
      fs.writeFileSync(filePath, newFileContent, 'utf8');
      console.log(`[Write] Saved changes to: ${path.basename(filePath)}`);
    } else {
      console.log(`[Skip] No content change needed for: ${path.basename(filePath)}`);
    }
  }
}

function traverseDir(dir, ordersMap) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverseDir(fullPath, ordersMap);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      processFile(fullPath, ordersMap);
    }
  }
}

console.log('Starting to process post dates...');
// 单次遍历：边收集已有的 categoryOrder，边处理文件
const ordersMap = {};
traverseDir(postsDir, ordersMap);
console.log('Finished processing post dates.');
