/**
 * 从 init_data.json 提取教材表中所有年级组合
 * 生成 grades.jsonl（JSONL 格式，每行一条记录，适合 uniCloud 导入）
 *
 * 使用方法：node scripts/extract-grades.js
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'init_data.json');
const OUTPUT = path.join(__dirname, '..', 'grades.jsonl');

// 年级显示排序
const GRADE_ORDER = {
  '小学低年级': 1,
  '小学高年级': 2,
  '全一册': 10,
  '上册': 11,
  '下册': 12,
  '一年级': 20,
  '一年级上册': 21,
  '一年级下册': 22,
  '二年级': 30,
  '二年级上册': 31,
  '二年级下册': 32,
  '三年级': 40,
  '三年级上册': 41,
  '三年级下册': 42,
  '四年级': 50,
  '四年级上册': 51,
  '四年级下册': 52,
  '五年级': 60,
  '五年级上册': 61,
  '五年级下册': 62,
  '六年级': 70,
  '六年级上册': 71,
  '六年级下册': 72,
  '七年级': 80,
  '七年级上册': 81,
  '七年级下册': 82,
  '八年级': 90,
  '八年级上册': 91,
  '八年级下册': 92,
  '九年级': 100,
  '九年级上册': 101,
  '九年级下册': 102,
  '必修': 200,
  '必修第一册': 201,
  '必修第二册': 202,
  '必修第三册': 203,
  '必修第四册': 204,
  '选择性必修第一册': 301,
  '选择性必修第二册': 302,
  '选择性必修第三册': 303,
};

// 特殊年级范围展开
const RANGE_MAP = {
  '一年级～六年级': ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  '1年级~6年级': ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  '3年级至4年级': ['三年级', '四年级'],
  '3年级至6年级': ['三年级', '四年级', '五年级', '六年级'],
  '1年级至2年级': ['一年级', '二年级'],
  '1年级至3年级': ['一年级', '二年级', '三年级'],
  '1年级至4年级': ['一年级', '二年级', '三年级', '四年级'],
  '一年级～五年级': ['一年级', '二年级', '三年级', '四年级', '五年级'],
};

function expandRange(grade) {
  return RANGE_MAP[grade] || [grade];
}

function getSortOrder(grade) {
  if (GRADE_ORDER[grade] !== undefined) return GRADE_ORDER[grade];
  // 处理范围类：取中间值
  const m = grade.match(/\d+/);
  if (m) return 50 + parseInt(m[0]) * 10;
  return 999;
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`❌ 找不到 ${DATA_PATH}`);
    process.exit(1);
  }

  // 读取 JSONL（每行一条 JSON）
  const content = fs.readFileSync(DATA_PATH, 'utf-8');
  const data = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

  console.log(`读取到 ${data.length} 条教材记录`);

  // 收集所有 unique 组合
  const seen = new Set();
  const gradeRecords = [];

  data.forEach(item => {
    const { section, subject, publisher, grade } = item;
    if (!grade) return;

    const expanded = expandRange(grade);
    expanded.forEach(g => {
      const key = `${section}|${subject}|${publisher}|${g}`;
      if (seen.has(key)) return;
      seen.add(key);

      gradeRecords.push({
        name: g,
        section,
        subject,
        publisher,
        publisherShort: item.publisherShort || publisher.replace(/-.+/, ''),
        sort: getSortOrder(g),
        addTime: Date.now(),
      });
    });
  });

  // 按 section、sort 排序
  gradeRecords.sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    if (a.sort !== b.sort) return a.sort - b.sort;
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.publisher.localeCompare(b.publisher);
  });

  // 输出 JSONL（每行一条 JSON）
  const lines = gradeRecords.map(r => JSON.stringify(r));
  fs.writeFileSync(OUTPUT, lines.join('\n'), 'utf-8');

  console.log(`✅ 生成完成！`);
  console.log(`   路径: ${OUTPUT}`);
  console.log(`   年级组合数: ${gradeRecords.length}`);
  console.log(`   文件大小: ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB`);
  console.log(`\n各学段分布:`);
  const sectionCount = {};
  gradeRecords.forEach(r => {
    sectionCount[r.section] = (sectionCount[r.section] || 0) + 1;
  });
  Object.entries(sectionCount).forEach(([k, v]) => console.log(`   ${k}: ${v}`));
}

main();
