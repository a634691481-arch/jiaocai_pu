const { BaseDao, Tables } = require('../base.js');

class TextbookDao extends BaseDao {
  constructor(obj) {
    super(obj);
    this.tableName = Tables.textbook;
  }

  // 分页查询教材列表
  async getList({ grade, subject, keyword, pageIndex = 1, pageSize = 20, sortType = 'addTime' } = {}) {
    const whereJson = { status: 1 };
    if (grade) whereJson.grade = grade;
    if (subject) whereJson.subject = subject;
    if (keyword) {
      whereJson.title = new RegExp(keyword, 'i');
    }
    const sortArr = sortType === 'downloads'
      ? [{ name: 'downloads', type: 'desc' }, { name: 'addTime', type: 'desc' }]
      : [{ name: 'addTime', type: 'desc' }];
    return await this.select({
      whereJson,
      pageIndex,
      pageSize,
      sortArr,
      fieldJson: { fileUrl: false },
    });
  }

  // 获取热门推荐
  async getHotList(limit = 10) {
    return await this.select({
      whereJson: { status: 1, isHot: true },
      pageIndex: 1,
      pageSize: limit,
      sortArr: [{ name: 'downloads', type: 'desc' }],
      fieldJson: { fileUrl: false },
    });
  }

  // 获取教材详情 (包含 fileUrl)
  async getDetail(id) {
    return await this.findByWhereJson({ _id: id, status: 1 });
  }

  // 搜索教材
  async search({ keyword, pageIndex = 1, pageSize = 20 } = {}) {
    if (!keyword) return { data: [], total: 0 };
    return await this.select({
      whereJson: {
        status: 1,
        title: new RegExp(keyword, 'i'),
      },
      pageIndex,
      pageSize,
      sortArr: [{ name: 'downloads', type: 'desc' }],
      fieldJson: { fileUrl: false },
    });
  }
}

module.exports = TextbookDao;
