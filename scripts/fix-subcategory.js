#!/usr/bin/env node

/**
 * 修复脚本：批量更新 front-matter 中的 subcategory 字段，与文件夹名保持一致
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDir = path.join(__dirname, '../src/content/posts');

// 从文件路径提取子分类（目录结构方式）
const extractSubcategoryFromPath = (filePath) => {
  const relative = path.relative(postsDir, filePath).split(path.sep);
  // 如果有3+部分 (category/subcategory/file.md)，返回子分类
  if (relative.length >= 3) {
    return relative[relative.length - 2];
  }
  return null;
};

// 修复单个文件
function fixFile(filePath) {
  const filename = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data: frontMatter, content } = matter(fileContent);
  
  // 从路径提取正确的子分类名
  const correctSubcategory = extractSubcategoryFromPath(filePath);
  
  if (!correctSubcategory) {
    return { fixed: false, reason: 'no_subcategory_folder' };
  }
  
  // 如果 front-matter 中的 subcategory 与文件夹名不一致，则修复
  if (frontMatter.subcategory && frontMatter.subcategory !== correctSubcategory) {
    const oldSubcategory = frontMatter.subcategory;
    frontMatter.subcategory = correctSubcategory;
    
    // 写回文件
    const newFileContent = matter.stringify(content, frontMatter);
    fs.writeFileSync(filePath, newFileContent, 'utf8');
    
    return { 
      fixed: true, 
      old: oldSubcategory, 
      new: correctSubcategory 
    };
  }
  
  return { fixed: false, reason: 'already_correct' };
}

// 递归遍历目录
function traverseDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      results.push(...traverseDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const result = fixFile(fullPath);
      results.push({
        file: entry.name,
        ...result
      });
    }
  }
  
  return results;
}

// 主函数
function main() {
  console.log('🔧 开始修复 front-matter 中的 subcategory 字段...\n');
  
  if (!fs.existsSync(postsDir)) {
    console.error(`❌ 文章目录不存在: ${postsDir}`);
    process.exit(1);
  }
  
  const results = traverseDir(postsDir);
  
  // 统计结果
  const fixedCount = results.filter(r => r.fixed).length;
  const alreadyCorrectCount = results.filter(r => !r.fixed && r.reason === 'already_correct').length;
  const noSubcategoryCount = results.filter(r => !r.fixed && r.reason === 'no_subcategory_folder').length;
  
  console.log('\n📊 修复统计:');
  console.log(`   ✅ 已修复: ${fixedCount}`);
  console.log(`   ✓  无需修复: ${alreadyCorrectCount}`);
  console.log(`   ⏭️  无子分类文件夹: ${noSubcategoryCount}`);
  console.log(`   📁 总计: ${results.length}`);
  
  // 显示修复详情
  const fixedItems = results.filter(r => r.fixed);
  if (fixedItems.length > 0) {
    console.log('\n📝 修复详情:');
    fixedItems.forEach(item => {
      console.log(`   ${item.file}: "${item.old}" -> "${item.new}"`);
    });
  }
  
  console.log('\n🎉 修复完成！');
}

main();
