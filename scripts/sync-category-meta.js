const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../src/content/posts');
const DATA_DIR = path.join(__dirname, '../src/_data');
const DESCRIPTIONS_FILE = path.join(DATA_DIR, 'categoryMeta.json');
const DEFAULT_DESCRIPTION = '暂无简介';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.md')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

function extractSubcategoryFromPath(filePath) {
  const relative = path.relative(CONTENT_DIR, filePath).split(path.sep);
  if (relative.length > 2) {
    return relative[relative.length - 2].trim();
  }
  return null;
}

function extractSubcategoryFromFilename(filename) {
  const stem = filename.replace(/\.md$/, '');
  const parts = stem.split('@');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return null;
}

function extractSubcategory(filePath) {
  const subcategoryFromPath = extractSubcategoryFromPath(filePath);
  if (subcategoryFromPath) {
    return subcategoryFromPath;
  }
  
  const filename = path.basename(filePath);
  return extractSubcategoryFromFilename(filename);
}

function syncMeta() {
  console.log('🔍 Scanning posts for categories...');
  
  if (!fs.existsSync(CONTENT_DIR)) {
      console.error(`❌ Content directory not found: ${CONTENT_DIR}`);
      return;
  }

  const files = getAllFiles(CONTENT_DIR);
  const discoveredMeta = { categories: {} };

  files.forEach(file => {
    let fullCategory = '';
    const relative = path.relative(CONTENT_DIR, file).split(path.sep);
    if (relative.length > 1) {
      fullCategory = relative[0];
    } else {
      fullCategory = '默认分类';
    }

    const subcategoryCode = extractSubcategory(file);
    
    if (!discoveredMeta.categories[fullCategory]) {
      discoveredMeta.categories[fullCategory] = { 
        description: DEFAULT_DESCRIPTION,
        subcategories: {}
      };
    }
    
    if (subcategoryCode) {
      if (!discoveredMeta.categories[fullCategory].subcategories[subcategoryCode]) {
        discoveredMeta.categories[fullCategory].subcategories[subcategoryCode] = {
          name: subcategoryCode,
          description: DEFAULT_DESCRIPTION
        };
      }
    }
  });

  const foundCategories = Object.keys(discoveredMeta.categories).sort();
  console.log(`✅ Found ${foundCategories.length} categories:`, foundCategories);
  
  let totalSubcategories = 0;
  foundCategories.forEach(cat => {
    const subcats = discoveredMeta.categories[cat].subcategories;
    const subcatKeys = Object.keys(subcats);
    totalSubcategories += subcatKeys.length;
    if (subcatKeys.length > 0) {
      console.log(`   ${cat}: ${subcatKeys.length} subcategories (${subcatKeys.join(', ')})`);
    }
  });
  console.log(`📊 Total subcategories: ${totalSubcategories}`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DESCRIPTIONS_FILE)) {
    const descriptions = { categories: {} };
    fs.writeFileSync(DESCRIPTIONS_FILE, JSON.stringify(descriptions, null, 2));
    console.log(`📝 Created descriptions file: ${DESCRIPTIONS_FILE}`);
  }

  let descriptions = { categories: {} };
  try {
    descriptions = JSON.parse(fs.readFileSync(DESCRIPTIONS_FILE, 'utf8'));
  } catch (e) {
    console.warn(`⚠️ Failed to parse descriptions file. Recreating: ${DESCRIPTIONS_FILE}`);
    descriptions = { categories: {} };
  }

  if (!descriptions || typeof descriptions !== 'object' || Array.isArray(descriptions)) {
    descriptions = { categories: {} };
  }
  if (!descriptions.categories || typeof descriptions.categories !== 'object' || Array.isArray(descriptions.categories)) {
    descriptions.categories = {};
  }
  // Single-layer model: remove stale chapters key from older format.
  if (descriptions.chapters) delete descriptions.chapters;

  let addedCategories = 0;
  let addedSubcategories = 0;
  let removedSubcategories = 0;
  
  // 计算下一个可用的 order 值
  let maxOrder = 0;
  Object.keys(descriptions.categories).forEach((categoryPath) => {
    const cat = descriptions.categories[categoryPath];
    if (cat.order && typeof cat.order === 'number' && cat.order > maxOrder) {
      maxOrder = cat.order;
    }
  });
  
  Object.keys(discoveredMeta.categories).forEach((categoryPath) => {
    if (!descriptions.categories[categoryPath]) {
      maxOrder++;
      descriptions.categories[categoryPath] = { 
        order: maxOrder,
        subcategories: {}
      };
      addedCategories++;
    }
  });

  // Remove categories that no longer have any .md files
  let removedCategories = 0;
  Object.keys(descriptions.categories).forEach((categoryPath) => {
    if (!discoveredMeta.categories[categoryPath]) {
      delete descriptions.categories[categoryPath];
      removedCategories++;
    }
  });

  let normalizedCategories = 0;
  Object.keys(descriptions.categories).forEach((categoryPath) => {
    const value = descriptions.categories[categoryPath];
    if (typeof value === 'string' || !value || typeof value !== 'object' || Array.isArray(value)) {
      descriptions.categories[categoryPath] = { 
        subcategories: {}
      };
      normalizedCategories++;
      return;
    }

    // Remove top-level description if exists
    if (value.description) {
      delete value.description;
      normalizedCategories++;
    }

    if (!value.subcategories || typeof value.subcategories !== 'object' || Array.isArray(value.subcategories)) {
      value.subcategories = {};
    }
  });
  
  // 为缺少 order 字段的分类自动补充（重新创建对象以保持字段顺序）
  let addedOrders = 0;
  Object.keys(descriptions.categories).forEach((categoryPath) => {
    const cat = descriptions.categories[categoryPath];
    if (cat.order === undefined || cat.order === null) {
      maxOrder++;
      // 重新创建对象，确保 order 在前
      descriptions.categories[categoryPath] = {
        order: maxOrder,
        subcategories: cat.subcategories || {}
      };
      addedOrders++;
    }
  });

  // Sync subcategories
  Object.keys(discoveredMeta.categories).forEach((categoryPath) => {
    const discoveredCat = discoveredMeta.categories[categoryPath];
    const descCat = descriptions.categories[categoryPath];
    
    if (!descCat) return;
    
    const discoveredSubcats = discoveredCat.subcategories || {};
    const descSubcats = descCat.subcategories || {};
    
    // Add missing subcategories with default description
    Object.keys(discoveredSubcats).forEach((subcatCode) => {
      if (!descSubcats[subcatCode]) {
        descSubcats[subcatCode] = {
          description: DEFAULT_DESCRIPTION
        };
        addedSubcategories++;
      }
      // Remove stale 'name' field from older format
      if (descSubcats[subcatCode].name) {
        delete descSubcats[subcatCode].name;
      }
    });
    
    // Remove subcategories that no longer exist
    Object.keys(descSubcats).forEach((subcatCode) => {
      if (!discoveredSubcats[subcatCode]) {
        delete descSubcats[subcatCode];
        removedSubcategories++;
      }
    });
  });

  fs.writeFileSync(DESCRIPTIONS_FILE, JSON.stringify(descriptions, null, 2));
  if (addedCategories > 0 || normalizedCategories > 0 || removedCategories > 0 || addedSubcategories > 0 || removedSubcategories > 0 || addedOrders > 0) {
    const updates = [];
    if (addedCategories > 0) updates.push(`added ${addedCategories} categories`);
    if (normalizedCategories > 0) updates.push(`normalized ${normalizedCategories} categories`);
    if (removedCategories > 0) updates.push(`removed ${removedCategories} categories`);
    if (addedOrders > 0) updates.push(`added order to ${addedOrders} categories`);
    if (addedSubcategories > 0) updates.push(`added ${addedSubcategories} subcategories`);
    if (removedSubcategories > 0) updates.push(`removed ${removedSubcategories} subcategories`);
    console.log(`🧩 Updated descriptions: ${updates.join(', ')}.`);
  }

  console.log(`👉 Edit ${DESCRIPTIONS_FILE} to update descriptions.`);
}

syncMeta();
