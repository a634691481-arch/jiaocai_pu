/**
 * 从 init_data.json 生成 textbook-tree.json（首页直接使用的分类树）
 *
 * 输出格式：{ section: { subject: { publisher: [grade1, grade2, ...] } } }
 *
 * 使用方法：node scripts/generate-tree-json.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'init_data.json');
const OUTPUT = path.join(__dirname, '..', 'static', 'textbook-tree.json');

// 年级范围映射（用于去重时保留范围性年级名称）
const RANGE_MAP = {
  '一年级～六年级': ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  '1年级~6年级': ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  '3年级至4年级': ['三年级', '四年级'],
  '3年级至6年级': ['三年级', '四年级', '五年级', '六年级'],
  '1年级至2年级': ['一年级', '二年级'],
  '1年级至3年级': ['一年级', '二年级', '三年级'],
  '1年级至4年级': ['一年级', '二年级', '三年级', '四年级'],
  '一年级～五年级': ['一年级', '二年级', '三年级', '四年级', '五年级'],
  '六年级～九年级(五四制)': ['六年级', '七年级', '八年级', '九年级'],
};

// 年级显示排序（越低越靠前）
const GRADE_PRIORITY = {
  '全一册': 0, '上册': 1, '下册': 2,
  '一年级': 10, '一年级上册': 11, '一年级下册': 12,
  '二年级': 20, '二年级上册': 21, '二年级下册': 22,
  '三年级': 30, '三年级上册': 31, '三年级下册': 32,
  '四年级': 40, '四年级上册': 41, '四年级下册': 42,
  '五年级': 50, '五年级上册': 51, '五年级下册': 52,
  '六年级': 60, '六年级上册': 61, '六年级下册': 62,
  '七年级': 70, '七年级上册': 71, '七年级下册': 72,
  '八年级': 80, '八年级上册': 81, '八年级下册': 82,
  '九年级': 90, '九年级上册': 91, '九年级下册': 92,
  '一年级～六年级': 100,
  '1年级~6年级': 100,
  '3年级至4年级': 101,
  '3年级至6年级': 102,
  '1年级至2年级': 103,
  '1年级至3年级': 104,
  '1年级至4年级': 105,
  '一年级～五年级': 106,
  '必修全一册': 200,
  '必修': 201,
  '必修1': 202,
  '必修上册': 203, '必修下册': 204,
  '必修上': 203, '必修下': 204,
  '必修第一册': 211, '必修第二册': 212, '必修第三册': 213, '必修第四册': 214,
  '选择性必修1': 221,
  '选择性必修2': 222,
  '选择性必修3': 223,
  '选择性必修上': 231, '选择性必修中': 232, '选择性必修下': 233,
  '选择性必修第一册': 241, '选择性必修第二册': 242, '选择性必修第三册': 243,
  '选择性必修第四册': 244,
};

function sortGrades(grades) {
  const expanded = [];
  grades.forEach(g => {
    if (RANGE_MAP[g]) {
      expanded.push(...RANGE_MAP[g].filter(x => !grades.includes(x)));
    } else {
      expanded.push(g);
    }
  });
  const all = [...new Set([...grades, ...expanded])];
  return all.sort((a, b) => {
    const pa = GRADE_PRIORITY[a] !== undefined ? GRADE_PRIORITY[a] : 999;
    const pb = GRADE_PRIORITY[b] !== undefined ? GRADE_PRIORITY[b] : 999;
    return pa - pb;
  });
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`❌ 找不到 ${DATA_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(DATA_PATH, 'utf-8');
  const data = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

  console.log(`读取到 ${data.length} 条教材记录`);

  // 构建树：section → subject → publisher → Set(grades)
  const tree = {};

  data.forEach(item => {
    const { section, subject, publisher, grade } = item;
    if (!section || !subject || !publisher || !grade) return;

    if (!tree[section]) tree[section] = {};
    if (!tree[section][subject]) tree[section][subject] = {};
    if (!tree[section][subject][publisher]) tree[section][subject][publisher] = new Set();

    tree[section][subject][publisher].add(grade);
  });

  // 转换 Set → sorted array
  const output = {};
  const sections = Object.keys(tree).sort();
  sections.forEach(section => {
    output[section] = {};
    const subjects = Object.keys(tree[section]).sort();
    subjects.forEach(subject => {
      output[section][subject] = {};
      const publishers = Object.keys(tree[section][subject]).sort();
      publishers.forEach(publisher => {
        output[section][subject][publisher] = sortGrades([...tree[section][subject][publisher]]);
      });
    });
  });

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');

  // 统计信息
  let subjectCount = 0;
  let publisherCount = 0;
  sections.forEach(s => {
    Object.keys(output[s]).forEach(sub => {
      subjectCount++;
      Object.keys(output[s][sub]).forEach(pub => {
        publisherCount++;
      });
    });
  });

  console.log(`✅ 生成完成！`);
  console.log(`   路径: ${OUTPUT}`);
  console.log(`   学段数: ${sections.length}`);
  console.log(`   科目总数: ${subjectCount}`);
  console.log(`   出版社总数: ${publisherCount}`);
  console.log(`   文件大小: ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB`);
}

main();
