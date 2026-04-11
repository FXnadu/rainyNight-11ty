#!/usr/bin/env node

/**
 * 迁移脚本：将 @后缀 方式的文件迁移到 文件夹结构 方式
 * 
 * 例如：
 *   旧：posts/Category/文件@subcategory.md
 *   新：posts/Category/subcategory/文件.md
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDir = path.join(__dirname, '../src/content/posts');

// 提取子分类（从文件名）
const extractSubcategoryFromFilename = (filename) => {
  const baseName = filename.replace(/\.md$/i, '');
  const parts = baseName.split('@');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return null;
};

// 提取标题（从文件名）
const extractTitleFromFilename = (filename) => {
  const baseName = filename.replace(/\.md$/i, '');
  return baseName.split('@')[0].trim();
};

// 迁移单个文件
function migrateFile(filePath) {
  const filename = path.basename(filePath);
  const subcategory = extractSubcategoryFromFilename(filename);
  
  // 如果没有 @后缀，跳过
  if (!subcategory) {
    console.log(`⏭️  跳过（无@后缀）: ${filename}`);
    return { success: false, reason: 'no_at_suffix' };
  }
  
  const parentDir = path.dirname(filePath);
  const newDir = path.join(parentDir, subcategory);
  const newTitle = extractTitleFromFilename(filename);
  const newFilename = `${newTitle}.md`;
  const newPath = path.join(newDir, newFilename);
  
  // 检查目标文件是否已存在
  if (fs.existsSync(newPath)) {
    console.log(`⚠️  跳过（目标已存在）: ${filename} -> ${newPath}`);
    return { success: false, reason: 'target_exists' };
  }
  
  // 读取原文件内容
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data: frontMatter, content } = matter(fileContent);
  
  // 更新 front-matter：移除 subcategory 字段（因为现在是目录结构）
  // 保留其他字段
  const newFrontMatter = { ...frontMatter };
  delete newFrontMatter.subcategory; // 目录结构会自动识别，不需要写在 front-matter 中
  
  // 确保 title 正确
  if (!newFrontMatter.title || newFrontMatter.title === extractTitleFromFilename(filename)) {
    newFrontMatter.title = newTitle;
  }
  
  // 创建目标目录
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir, { recursive: true });
    console.log(`📁 创建目录: ${path.relative(postsDir, newDir)}`);
  }
  
  // 写入新文件
  const newFileContent = matter.stringify(content, newFrontMatter);
  fs.writeFileSync(newPath, newFileContent, 'utf8');
  
  // 删除原文件
  fs.unlinkSync(filePath);
  
  console.log(`✅ 迁移成功: ${filename} -> ${path.relative(postsDir, newPath)}`);
  return { success: true };
}

// 递归遍历目录
function traverseDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // 递归处理子目录
      results.push(...traverseDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // 处理 Markdown 文件
      const result = migrateFile(fullPath);
      results.push({
        original: entry.name,
        ...result
      });
    }
  }
  
  return results;
}

// 主函数
function main() {
  console.log('🚀 开始迁移 @后缀 文件到文件夹结构...\n');
  
  if (!fs.existsSync(postsDir)) {
    console.error(`❌ 文章目录不存在: ${postsDir}`);
    process.exit(1);
  }
  
  const results = traverseDir(postsDir);
  
  // 统计结果
  const successCount = results.filter(r => r.success).length;
  const skipCount = results.filter(r => !r.success && r.reason === 'no_at_suffix').length;
  const existCount = results.filter(r => !r.success && r.reason === 'target_exists').length;
  
  console.log('\n📊 迁移统计:');
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ⏭️  跳过（无@后缀）: ${skipCount}`);
  console.log(`   ⚠️  跳过（目标已存在）: ${existCount}`);
  console.log(`   📁 总计: ${results.length}`);
  
  if (successCount > 0) {
    console.log('\n💡 提示: 迁移后请运行以下命令更新元数据:');
    console.log('   npm run build');
  }
  
  console.log('\n🎉 迁移完成！');
}

main();
