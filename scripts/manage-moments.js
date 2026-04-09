const fs = require('fs');
const path = require('path');

const momentsDir = path.join(__dirname, '../src/content/moments');

const FILENAME_PATTERN = /^(\d{4}-\d{2}-\d{2})-(\d{4})\.md$/;

function processFile(filePath) {
  const fileName = path.basename(filePath);
  const match = fileName.match(FILENAME_PATTERN);

  if (!match) {
    console.warn(`[跳过] 文件名格式不正确: ${fileName}，应为 YYYY-MM-DD-HHMM.md`);
    return;
  }

  const dateFromName = match[1];
  const timeFromName = `${match[2].slice(0, 2)}:${match[2].slice(2)}`;

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fmMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  let body;
  let fmText;

  if (fmMatch) {
    body = fileContent.slice(fmMatch[0].length);
    fmText = fmMatch[1];
  } else if (fileContent.startsWith('---')) {
    console.warn(`[跳过] front matter 未闭合: ${fileName}，请手动修复`);
    return;
  } else {
    body = fileContent;
    fmText = '';
  }

  const existingFields = new Set();
  fmText.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^(\w[\w-]*):/);
    if (m) existingFields.add(m[1]);
  });

  const additions = [];
  if (!existingFields.has('date')) {
    additions.push(`date: ${dateFromName}`);
    console.log(`[date] 补全: ${fileName} → ${dateFromName}`);
  }
  if (!existingFields.has('time')) {
    additions.push(`time: "${timeFromName}"`);
    console.log(`[time] 补全: ${fileName} → ${timeFromName}`);
  }
  if (!existingFields.has('images')) {
    additions.push('images:');
    console.log(`[images] 补全: ${fileName}`);
  }
  if (!existingFields.has('link')) {
    additions.push('link:');
    console.log(`[link] 补全: ${fileName}`);
  }
  if (!existingFields.has('video')) {
    additions.push('video:');
    console.log(`[video] 补全: ${fileName}`);
  }

  if (additions.length > 0) {
    const newFmText = fmText ? fmText + '\n' + additions.join('\n') : additions.join('\n');
    const newContent = `---\n${newFmText}\n---${body}`;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`[写入] ${fileName}`);
  }
}

function traverseDir(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      processFile(path.join(dir, entry.name));
    }
  }
}

console.log('处理动态元数据...');
traverseDir(momentsDir);
console.log('动态元数据处理完成。');
