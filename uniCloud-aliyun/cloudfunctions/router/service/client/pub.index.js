'use strict';
let vk = uniCloud.vk;

const DB_NAME = 'textbooks';
const DOWNLOAD_LOG_DB = 'download_logs';

const cloudObject = {
  isCloudObject: true,

  _before: async function () {
    vk = this.vk;
  },

  _after: async function (options) {
    let { err, res } = options;
    if (err) {
      if (err instanceof Error) return;
      return err;
    }
    return res;
  },

  /**
   * 分页查询教材列表（无需登录）
   * @param {String} grade 年级 grade1~grade9
   * @param {String} subject 科目编码
   * @param {String} publisher 出版社
   * @param {String} keyword 关键词搜索
   * @param {Number} pageIndex 页码
   * @param {Number} pageSize 每页数量
   * @param {String} sortType addTime | downloads
   */
  getTextbookList: async function (data) {
    let { grade, subject, publisher, keyword, pageIndex = 1, pageSize = 20, sortType = 'addTime' } = data;
    let res = await vk.baseDao.select({
      dbName: DB_NAME,
      whereJson: (() => {
        let w = { status: 1 };
        if (grade) w.grade = grade;
        if (subject) w.subject = subject;
        if (publisher) w.publisher = publisher;
        if (keyword) w.title = new RegExp(keyword, 'i');
        return w;
      })(),
      pageIndex,
      pageSize,
      sortArr:
        sortType === 'downloads'
          ? [{ name: 'downloads', type: 'desc' }, { name: 'addTime', type: 'desc' }]
          : [{ name: 'addTime', type: 'desc' }],
      fieldJson: { fileUrl: false },
    });
    return { ...res, code: 1 };
  },

  /**
   * 获取教材详情（无需登录）
   * @param {String} id 教材ID
   */
  getTextbookDetail: async function (data) {
    let { id } = data;
    if (!id) return { code: -1, msg: '缺少教材ID' };
    let info = await vk.baseDao.findByWhereJson({
      dbName: DB_NAME,
      whereJson: { _id: id, status: 1 },
    });
    if (!info) return { code: -1, msg: '教材不存在或已下架' };
    delete info.fileUrl;
    return { code: 1, data: info };
  },

  /**
   * 热门推荐列表（无需登录）
   * @param {Number} limit 数量
   */
  getHotTextbooks: async function (data) {
    let { limit = 10 } = data;
    let res = await vk.baseDao.select({
      dbName: DB_NAME,
      whereJson: { status: 1, isHot: true },
      pageIndex: 1,
      pageSize: limit,
      sortArr: [{ name: 'downloads', type: 'desc' }],
      fieldJson: { fileUrl: false },
    });
    return { ...res, code: 1 };
  },

  /**
   * 全局搜索教材（无需登录）
   * @param {String} keyword 关键词
   * @param {Number} pageIndex 页码
   * @param {Number} pageSize 每页数量
   */
  searchTextbooks: async function (data) {
    let { keyword, pageIndex = 1, pageSize = 20 } = data;
    if (!keyword) return { code: -1, msg: '请输入搜索关键词' };
    let res = await vk.baseDao.select({
      dbName: DB_NAME,
      whereJson: { status: 1, title: new RegExp(keyword, 'i') },
      pageIndex,
      pageSize,
      sortArr: [{ name: 'downloads', type: 'desc' }],
      fieldJson: { fileUrl: false },
    });
    return { ...res, code: 1 };
  },

  /**
   * 获取年级列表（唯一名称，已排序）
   * 从 grades 表查询，返回 [{ name, sort }]
   */
  getGradeList: async function () {
    let res = await vk.baseDao.select({
      dbName: 'grades',
      pageIndex: 1,
      pageSize: 2000,
      fieldJson: { name: true, sort: true },
      sortArr: [{ name: 'sort', type: 'asc' }],
    });
    let seen = new Set();
    let grades = (res.rows || res.data || []).filter(g => {
      if (!g.name || seen.has(g.name)) return false;
      seen.add(g.name);
      return true;
    });
    return { code: 1, data: grades };
  },

  /**
   * 根据年级获取科目列表（含出版社数量）
   * @param {String} name 年级名称
   */
  getSubjectByGrade: async function (data) {
    let { name } = data;
    if (!name) return { code: 1, data: {} };

    let res = await vk.baseDao.select({
      dbName: 'grades',
      whereJson: { name },
      pageIndex: 1,
      pageSize: 2000,
      fieldJson: { subject: true, publisher: true },
    });

    let subjectMap = {};
    (res.rows || res.data || []).forEach(item => {
      if (!item.subject || !item.publisher) return;
      if (!subjectMap[item.subject]) {
        subjectMap[item.subject] = { publishers: [], publisherCount: 0 };
      }
      if (!subjectMap[item.subject].publishers.includes(item.publisher)) {
        subjectMap[item.subject].publishers.push(item.publisher);
        subjectMap[item.subject].publisherCount++;
      }
    });

    return { code: 1, data: subjectMap };
  },

  /**
   * 获取学段/科目/出版社树结构（无需登录）
   * 从 textbooks 表聚合去重返回 section→subject→publishers 树
   * 首页使用
   */
  getSectionTree: async function () {
    let db = uniCloud.database();
    let res = await db.collection(DB_NAME)
      .where({ status: 1 })
      .field({ section: true, subject: true, publisher: true })
      .get();

    let tree = {};
    (res.data || []).forEach(item => {
      if (!item.section || !item.subject || !item.publisher) return;
      if (!tree[item.section]) tree[item.section] = {};
      if (!tree[item.section][item.subject]) {
        tree[item.section][item.subject] = { publishers: [], publisherCount: 0 };
      }
      if (!tree[item.section][item.subject].publishers.includes(item.publisher)) {
        tree[item.section][item.subject].publishers.push(item.publisher);
        tree[item.section][item.subject].publisherCount++;
      }
    });

    return { code: 1, data: tree };
  },

  /**
   * 获取年级列表（按 section/subject/publisher 过滤，已排序）
   * 从 grades 表查询
   * @param {String} section 学段
   * @param {String} subject 科目
   * @param {String} publisher 出版社
   */
  getGrades: async function (data) {
    let { name, subject, publisher } = data;
    let whereJson = {};
    if (name) whereJson.name = name;
    if (subject) whereJson.subject = subject;
    if (publisher) whereJson.publisher = publisher;

    let res = await vk.baseDao.select({
      dbName: 'grades',
      whereJson,
      pageIndex: 1,
      pageSize: 500,
      sortArr: [{ name: 'sort', type: 'asc' }],
    });

    return { code: 1, data: res.rows || res.data || [] };
  },

  /**
   * 获取首页 Banner 列表（无需登录）
   */
  getBanners: async function () {
    let res = await vk.baseDao.select({
      dbName: 'banners',
      whereJson: {},
      pageIndex: 1,
      pageSize: 10,
      sortArr: [{ name: 'sort', type: 'desc' }],
    });
    return { ...res, code: 0, data: res.rows || res.data || [] };
  },

  /**
   * 增加浏览/下载计数（无需登录）
   * @param {String} id 教材ID
   * @param {String} type view | download
   */
  incrementViewCount: async function (data) {
    let { id, type = 'view' } = data;
    if (!id) return { code: -1, msg: '缺少教材ID' };
    let field = type === 'download' ? 'downloads' : 'views';
    try {
      await vk.baseDao.updateById({
        dbName: DB_NAME,
        id,
        dataJson: { [field]: vk.db.command.inc(1) },
      });
    } catch (e) {
      // 计数失败不阻塞
    }
    return { code: 1, msg: 'ok' };
  },

  /**
   * 获取下载链接（需要登录）
   * 返回 fileUrl 并记录下载历史
   * @param {String} id 教材ID
   */
  getDownloadUrl: async function (data) {
    let { id } = data;
    if (!id) return { code: -1, msg: '缺少教材ID' };

    let uid = vk.pubfn.getUserInfo().uid;
    if (!uid) return { code: -1, msg: '请先登录' };

    let info = await vk.baseDao.findByWhereJson({
      dbName: DB_NAME,
      whereJson: { _id: id, status: 1 },
    });
    if (!info) return { code: -1, msg: '教材不存在或已下架' };
    if (!info.fileUrl) return { code: -1, msg: '该教材暂无下载文件' };

    // 记录下载历史
    try {
      await vk.baseDao.add({
        dbName: DOWNLOAD_LOG_DB,
        dataJson: {
          uid,
          textbookId: id,
          title: info.title,
          downloadTime: Date.now(),
        },
      });
    } catch (e) {
      // 记录失败不阻塞
    }

    // 增加下载计数
    try {
      await vk.baseDao.updateById({
        dbName: DB_NAME,
        id,
        dataJson: { downloads: vk.db.command.inc(1) },
      });
    } catch (e) { }

    return { code: 1, data: { fileUrl: info.fileUrl, title: info.title } };
  },

  /**
   * 我的下载历史（需要登录）
   * @param {Number} pageIndex 页码
   * @param {Number} pageSize 每页数量
   */
  getMyDownloads: async function (data) {
    let { pageIndex = 1, pageSize = 20 } = data;
    let uid = vk.pubfn.getUserInfo().uid;
    if (!uid) return { code: -1, msg: '请先登录' };

    let res = await vk.baseDao.select({
      dbName: DOWNLOAD_LOG_DB,
      whereJson: { uid },
      pageIndex,
      pageSize,
      sortArr: [{ name: 'downloadTime', type: 'desc' }],
    });
    return { ...res, code: 1 };
  },

  // ==================== 批量导入 ====================

  /**
   * 批量导入教材数据（从云函数 data/init_data.json 读取）
   */
  importTextbooks: async function (data) {
    let { batch = 0 } = data;
    let fs = require('fs');
    let path = require('path');
    let filePath = path.join(__dirname, '..', '..', 'data', 'init_data.json');
    if (!fs.existsSync(filePath)) return { code: -1, msg: '数据文件不存在: ' + filePath };

    let content = fs.readFileSync(filePath, 'utf-8');
    let lines = content.trim().split('\n').filter(Boolean);
    let total = lines.length;

    let BATCH_SIZE = 100;
    let start = batch * BATCH_SIZE;
    let end = Math.min(start + BATCH_SIZE, total);

    if (start >= total) return { code: 1, msg: '全部已导入', total, current: total };

    let records = lines.slice(start, end).map(line => {
      let r = JSON.parse(line);
      delete r._id;
      return r;
    });

    let db = uniCloud.database();
    let success = 0;
    for (let r of records) {
      try {
        await db.collection(DB_NAME).add(r);
        success++;
      } catch (e) {}
    }

    let hasMore = end < total;
    return { code: 1, msg: `第${batch+1}批完成`, success, batch, total, imported: end, hasMore };
  },

  /**
   * 批量导入年级数据（从云函数 data/grades.jsonl 读取）
   */
  importGrades: async function (data) {
    let { batch = 0 } = data;
    let fs = require('fs');
    let path = require('path');
    let filePath = path.join(__dirname, '..', '..', 'data', 'grades.jsonl');
    if (!fs.existsSync(filePath)) return { code: -1, msg: '数据文件不存在: ' + filePath };

    let content = fs.readFileSync(filePath, 'utf-8');
    let lines = content.trim().split('\n').filter(Boolean);
    let total = lines.length;

    let BATCH_SIZE = 100;
    let start = batch * BATCH_SIZE;
    let end = Math.min(start + BATCH_SIZE, total);

    if (start >= total) return { code: 1, msg: '全部已导入', total, current: total };

    let records = lines.slice(start, end).map(line => {
      let r = JSON.parse(line);
      delete r._id;
      return r;
    });

    let db = uniCloud.database();
    let success = 0;
    for (let r of records) {
      try {
        await db.collection('grades').add(r);
        success++;
      } catch (e) {}
    }

    let hasMore = end < total;
    return { code: 1, msg: `第${batch+1}批完成`, success, batch, total, imported: end, hasMore };
  },

  /**
   * 批量导入 Banner 默认数据
   */
  importBanners: async function () {
    let db = uniCloud.database();
    let defaults = [
      {
        title: '教材宝-海量教材免费下载',
        imageUrl: '/static/20251218160253716.png',
        linkType: 'none',
        linkValue: '',
        sort: 100,
        status: 1,
        addTime: Date.now(),
      },
      {
        title: '快速查找教材',
        imageUrl: '/static/20251218160253729.png',
        linkType: 'none',
        linkValue: '',
        sort: 90,
        status: 1,
        addTime: Date.now(),
      },
      {
        title: '教材配套资源',
        imageUrl: '/static/20251218160453548.png',
        linkType: 'none',
        linkValue: '',
        sort: 80,
        status: 1,
        addTime: Date.now(),
      },
    ];

    let count = 0;
    for (let r of defaults) {
      try {
        await db.collection('banners').add(r);
        count++;
      } catch (e) {}
    }
    return { code: 1, msg: `导入${count}条Banner` };
  },
};

module.exports = cloudObject;
