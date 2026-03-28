const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../src/content/posts');
const SETTINGS_DIR = path.join(__dirname, '../src/content/settings');
const DESCRIPTIONS_FILE = path.join(SETTINGS_DIR, 'categoryDescriptions.json');
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

    discoveredMeta.categories[fullCategory] = { description: DEFAULT_DESCRIPTION };
  });

  const foundCategories = Object.keys(discoveredMeta.categories).sort();
  console.log(`✅ Found ${foundCategories.length} categories:`, foundCategories);

  if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true });
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
  Object.keys(discoveredMeta.categories).forEach((categoryPath) => {
    if (!descriptions.categories[categoryPath]) {
      descriptions.categories[categoryPath] = { description: DEFAULT_DESCRIPTION };
      addedCategories++;
    }
  });

  let normalizedCategories = 0;
  Object.keys(descriptions.categories).forEach((categoryPath) => {
    const value = descriptions.categories[categoryPath];
    if (typeof value === 'string') {
      const normalized = value.trim() || DEFAULT_DESCRIPTION;
      descriptions.categories[categoryPath] = { description: normalized };
      normalizedCategories++;
      return;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      descriptions.categories[categoryPath] = { description: DEFAULT_DESCRIPTION };
      normalizedCategories++;
      return;
    }

    const desc = typeof value.description === 'string' ? value.description.trim() : '';
    if (!desc) {
      descriptions.categories[categoryPath] = { description: DEFAULT_DESCRIPTION };
      normalizedCategories++;
      return;
    }

    descriptions.categories[categoryPath] = { description: desc };
  });

  fs.writeFileSync(DESCRIPTIONS_FILE, JSON.stringify(descriptions, null, 2));
  if (addedCategories > 0 || normalizedCategories > 0) {
    console.log(`🧩 Updated descriptions: added ${addedCategories}, normalized ${normalizedCategories}.`);
  }

  console.log(`👉 Edit ${DESCRIPTIONS_FILE} to update descriptions.`);
}

syncMeta();
