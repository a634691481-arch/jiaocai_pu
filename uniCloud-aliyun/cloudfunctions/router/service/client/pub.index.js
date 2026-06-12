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

    return { code: 0, data: { fileUrl: info.fileUrl, title: info.title } };
  },

  /**
   * 记录浏览/下载统计
   * @param {String} key  唯一标识 section#subject#publisher#title
   * @param {String} type 'view' | 'download'
   * @param {Object} info { title, subject, publisher, section }
   */
  recordStat: async function (data) {
    let { key, type, info } = data;
    if (!key || !type) return { code: -1, msg: '参数不足' };
    let db = uniCloud.database();
    let collection = db.collection('textbook_stats');
    let exist = await collection.where({ key }).get();
    let field = type === 'download' ? 'downloads' : 'views';
    if (exist.data && exist.data.length) {
      await collection.doc(exist.data[0]._id).update({
        [field]: db.command.inc(1),
        updateTime: Date.now(),
      });
    } else {
      await collection.add({
        key,
        title: info?.title || '',
        subject: info?.subject || '',
        publisher: info?.publisher || '',
        section: info?.section || '',
        views: type === 'view' ? 1 : 0,
        downloads: type === 'download' ? 1 : 0,
        updateTime: Date.now(),
      });
    }
    return { code: 0 };
  },

  /**
   * 获取教材统计信息
   * @param {String} key 唯一标识 section#subject#publisher#title
   */
  getStats: async function (data) {
    let { key } = data;
    if (!key) return { code: -1, msg: '缺少统计key' };
    let db = uniCloud.database();
    let res = await db.collection('textbook_stats').where({ key }).get();
    if (res.data && res.data.length) {
      let d = res.data[0];
      return { code: 0, data: { views: d.views || 0, downloads: d.downloads || 0 } };
    }
    return { code: 0, data: { views: 0, downloads: 0 } };
  },
};

module.exports = cloudObject;
