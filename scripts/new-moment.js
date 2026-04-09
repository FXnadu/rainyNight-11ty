const fs = require('fs');
const path = require('path');

const momentsDir = path.join(__dirname, '../src/content/moments');

function createMoment() {
  fs.mkdirSync(momentsDir, { recursive: true });

  const now = new Date();
  let dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let hours = now.getHours();
  let minutes = now.getMinutes();

  let fileName = `${dateStr}-${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}.md`;
  let filePath = path.join(momentsDir, fileName);

  if (fs.existsSync(filePath)) {
    minutes += 1;
    if (minutes >= 60) {
      minutes = 0;
      hours += 1;
      if (hours >= 24) {
        console.error('同一天内已创建过多动态，请手动创建');
        process.exit(1);
      }
    }
    fileName = `${dateStr}-${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}.md`;
    filePath = path.join(momentsDir, fileName);
    console.log(`同分钟文件已存在，自动递增为 ${fileName}`);
  }

  const timeStr = `${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
  const fileContent = `---\ndate: ${dateStr}\ntime: "${timeStr.slice(0, 2)}:${timeStr.slice(2)}"\nimages:\nlink:\nvideo:\n---\n\n在这里写动态内容...\n`;

  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log(`已创建动态: ${fileName}`);
}

createMoment();
