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

function processFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data: frontMatter, content } = matter(fileContent);
  let needsUpdate = false;

  const stats = fs.statSync(filePath);
  const birthtime = stats.birthtime;
  const mtime = stats.mtime;

  // 1. Handle 'date' (creation date)
  if (!frontMatter.date) {
    frontMatter.date = formatDate(birthtime);
    needsUpdate = true;
    console.log(`[Date] Added creation date to: ${path.basename(filePath)}`);
  }

  // 2. Handle 'updated' (modification date)
  const pubDate = new Date(frontMatter.date);
  const MIN_UPDATE_GAP_MS = 60 * 1000; // 1 minute

  const isModifiedLater = mtime.getTime() - pubDate.getTime() > MIN_UPDATE_GAP_MS;

  if (isModifiedLater) {
    // The file was significantly modified after publication.
    // We should ADD or UPDATE the 'updated' field.
    const formattedMtime = formatDate(mtime);
    if (frontMatter.updated !== formattedMtime) {
      frontMatter.updated = formattedMtime;
      needsUpdate = true;
      console.log(`[Updated] Set/updated modification date for: ${path.basename(filePath)}`);
    }
  } else {
    // The file is new or was not significantly modified.
    // We should REMOVE the 'updated' field to avoid redundancy.
    if (frontMatter.updated) {
      delete frontMatter.updated;
      needsUpdate = true;
      console.log(`[Updated] Removed redundant update date from: ${path.basename(filePath)}`);
    }
  }

  // 3. Write back to the file only if the content has actually changed
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

function traverseDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverseDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      processFile(fullPath);
    }
  }
}

console.log('Starting to process post dates...');
traverseDir(postsDir);
console.log('Finished processing post dates.');
