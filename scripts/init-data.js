/**
 * 教材初始化数据生成脚本
 *
 * 功能：
 * 1. 扫描 C:\Users\63469\Desktop\ChinaTextbook 目录
 * 2. 为每个 PDF 生成 textbooks 集合初始记录
 * 3. 输出 init_data.json（可直接导入 uniCloud 数据库）
 *
 * 使用方法：node scripts/init-data.js
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = 'C:\\Users\\63469\\Desktop\\ChinaTextbook';
const CDN_BASE = 'https://mp-1d49d41a-a68c-4b50-bda8-c2dd099f39d7.cdn.bspapp.com';
const OUTPUT = path.join(__dirname, '..', 'init_data.json');

// 热门科目（用于 isHot 标记）
const HOT_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物学'];

// 年级提取正则
const GRADE_PATTERNS = [
  // 义务教育教科书·语文一年级上册 → 一年级
  // 义务教育教科书（五•四学制）·数学一年级上册 → 一年级
  /(?:义务教育教科书[（(].*?[）)]?[·．])(?:.{2,8}?)((?:一|二|三|四|五|六|七|八|九|全)\S{0,6})[上下]?册?/,
  // 普通高中教科书·英语必修第一册 → 必修第一册
  // 普通高中教科书·物理选择性必修第三册 → 选择性必修第三册
  /(?:普通高中教科书[·．])(?:.{2,8}?)((?:必修|选择性必修)\S{0,10})/,
  // 普通高中教科书·音乐必修1 音乐鉴赏 → 必修1
  /(?:普通高中教科书[·．])(?:.{2,8}?)((?:必修|选择性必修)\d+)/,
  // 义务教育教科书·体育与健康七年级全一册 → 七年级
  /(?:义务教育教科书[·．])(?:.{2,14}?)((?:一|二|三|四|五|六|七|八|九)年级)/,
  // 义务教育教科书·体育与健康一年级～六年级 → 一年级～六年级
  /(?:义务教育教科书[·．])(?:.{2,14}?)(\d+年级~\d+年级)/,
  // 义务教育教科书·体育与健康 3年级至4年级 → 3年级至4年级
  /(?:义务教育教科书[·．])(?:.{2,14}?)(\d+年级至\d+年级)/,
  // 义务教育教科书·科学一年级～六年级 → 一年级～六年级
  /(?:义务教育教科书[·．])(?:.{2,14}?)((?:一|二|三|四|五|六|七|八|九)年级~(?:一|二|三|四|五|六|七|八|九)年级)/,
  // 义务教育教科书·音乐一年级上册(XX版) → 一年级
  /(?:义务教育教科书[·．])(?:.{2,14}?)((?:一|二|三|四|五|六|七|八|九)\S{0,2})[上下]册？/,
  // 习近平新时代中国特色社会主义思想学生读本·小学低年级 → 小学低年级
  /(?:习近平新时代中国特色社会主义思想学生读本[·．])(小学低年级|小学高年级|初中|高中)/,
  // 义务教育教科书·人文地理上册 → 上册
  /(?:义务教育教科书[·．]).+?(上册|下册)/,
  // 普通高中教科书·信息技术必修 信息系统与社会 → 必修
  /(?:普通高中教科书[·．])(?:.{2,8}?)((?:必修|选择性必修)\S{0,0})/,
  // 义务教育教科书·美术 3年级至4年级 → 3年级至4年级
  /(?:义务教育教科书[·．]).+?(\d+年级至\d+年级)/,
  // 义务教育教科书·美术一年级～六年级 → 全一册
  /(?:义务教育教科书[·．]).+?(全一册)/,
  // 普通高中教科书·体育与健康必修全一册 → 必修全一册
  /(?:普通高中教科书[·．]).+?((?:必修|选择性必修)\S{0,6})/,
  // 普通高中教科书·体育与健康 全一册 → 全一册
  /(?:普通高中教科书[·．]).+?(全一册)/,
];

// 从文件名提取年级
function extractGrade(filename, subject) {
  const name = filename.replace(/\.pdf(\.\d+)?$/, '');
  for (const p of GRADE_PATTERNS) {
    const m = name.match(p);
    if (m) return m[1].replace(/^[·．]/, '');
  }
  // Fallback: 尝试匹配常见年级关键词
  const fallbackMatch = name.match(/((?:一|二|三|四|五|六|七|八|九)年级|全一册|必修\S{0,6}|选择性必修\S{0,6}|\d+年级)/);
  if (fallbackMatch) return fallbackMatch[1];
  return '全一册';
}

// 获取文件大小（字节）
function getFileSize(filepath) {
  try {
    const stat = fs.statSync(filepath);
    return stat.size;
  } catch {
    return 0;
  }
}

// 获取文件真实大小（处理 .1,.2 分片文件：取第一片大小 × 估计份数）
function getTotalFileSize(basePath, parts) {
  if (parts.length === 0) {
    return getFileSize(basePath);
  }
  // 取第一片大小
  const firstSize = getFileSize(parts[0]);
  if (firstSize === 0) return 0;
  // 总大小 ≈ 第一片大小 × 片数
  return firstSize * parts.length;
}

// URL 编码路径段
function urlEncodeSegment(s) {
  return encodeURIComponent(s).replace(/%2F/g, '/');
}

// 主逻辑
async function main() {
  if (!fs.existsSync(BASE_DIR)) {
    console.error(`目录不存在: ${BASE_DIR}`);
    process.exit(1);
  }

  const records = [];
  let totalFiles = 0;
  let skippedFiles = 0;

  // 先统计分片文件
  const splitFiles = new Map(); // baseNameWithoutExt => { parts: [], files: [], publisher, subject, section }

  const sections = fs.readdirSync(BASE_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const section of sections) {
    const sectionPath = path.join(BASE_DIR, section);
    const subjects = fs.readdirSync(sectionPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const subject of subjects) {
      const subjectPath = path.join(sectionPath, subject);
      const publishers = fs.readdirSync(subjectPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const publisher of publishers) {
        const publisherPath = path.join(subjectPath, publisher);
        const files = fs.readdirSync(publisherPath, { withFileTypes: true })
          .filter(f => f.isFile() && (f.name.toLowerCase().endsWith('.pdf') || /\.pdf\.\d+$/.test(f.name)))
          .map(f => f.name);

        // 按基础文件名分组（去掉 .1, .2 后缀）
        const fileGroups = new Map();
        for (const fname of files) {
          let baseName;
          const partMatch = fname.match(/^(.+?\.pdf)\.(\d+)$/);
          if (partMatch) {
            baseName = partMatch[1];
            const part = parseInt(partMatch[2]);
            if (!fileGroups.has(baseName)) {
              fileGroups.set(baseName, { parts: [] });
            }
            fileGroups.get(baseName).parts.push({ part, fname });
          } else {
            // 完整 .pdf 文件
            baseName = fname;
            if (!fileGroups.has(baseName)) {
              fileGroups.set(baseName, { parts: [] });
            }
          }
        }

        for (const [baseName, group] of fileGroups) {
          const title = baseName.replace(/\.pdf$/, '').trim();

          // 跳过练习册/教师用书（通常以 .1 分片存在且不完整）
          if (title.includes('练习册') || title.includes('教师用书')) {
            skippedFiles++;
            continue;
          }

          const grade = extractGrade(baseName, subject);
          const pubShortMatch = publisher.match(/^(.+?)[-—]/);
          const publisherShort = pubShortMatch ? pubShortMatch[1].trim() : publisher;

          // 构建 CDN URL（保持原始中文路径，匹配用户示例格式）
          const fileUrl = `${CDN_BASE}/${section}/${subject}/${publisher}/${baseName}`;

          // 计算文件大小
          const filePaths = group.parts.length > 0
            ? group.parts.map(p => path.join(publisherPath, p.fname))
            : [path.join(publisherPath, baseName)];
          const fileSize = getTotalFileSize(path.join(publisherPath, baseName), filePaths);

          const record = {
            title,
            grade,
            subject,
            publisher,
            publisherShort,
            section,
            cover: '',
            fileUrl,
            fileSize,
            views: 0,
            downloads: 0,
            isHot: HOT_SUBJECTS.includes(subject),
            isSplit: group.parts.length > 0,
            splitParts: group.parts.length > 0 ? group.parts.length : 0,
            status: 1,
            addTime: Date.now(),
          };

          records.push(record);
          totalFiles++;
        }
      }
    }
  }

  // 输出 — uniCloud 导入要求 JSONL 格式（每行一条 JSON）
  fs.writeFileSync(OUTPUT, records.map(r => JSON.stringify(r)).join('\n'), 'utf-8');
  console.log(`✅ 生成完成！`);
  console.log(`   路径: ${OUTPUT}`);
  console.log(`   总教材数: ${totalFiles}`);
  console.log(`   跳过的文件: ${skippedFiles}`);
  console.log(`   输出文件大小: ${(fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(console.error);
