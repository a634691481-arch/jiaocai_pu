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
   * @param {String} keyword 关键词搜索
   * @param {Number} pageIndex 页码
   * @param {Number} pageSize 每页数量
   * @param {String} sortType addTime | downloads
   */
  getTextbookList: async function (data) {
    let { grade, subject, keyword, pageIndex = 1, pageSize = 20, sortType = 'addTime' } = data;
    let res = await vk.baseDao.select({
      dbName: DB_NAME,
      whereJson: (() => {
        let w = { status: 1 };
        if (grade) w.grade = grade;
        if (subject) w.subject = subject;
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
    return { code: 1, ...res };
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
    return { code: 1, ...res };
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
    return { code: 1, ...res };
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
    return { code: 1, ...res };
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
    } catch (e) {}

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
    return { code: 1, ...res };
  },
};

module.exports = cloudObject;
