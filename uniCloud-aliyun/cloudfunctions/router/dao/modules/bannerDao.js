const { BaseDao, Tables } = require('../base.js');

class BannerDao extends BaseDao {
  constructor(obj) {
    super(obj);
    this.tableName = Tables.banner;
  }

  // 获取全部 Banner 列表 (按 sort 排序)
  async getList() {
    return await this.select({
      whereJson: {},
      pageIndex: 1,
      pageSize: 10,
      sortArr: [{ name: 'sort', type: 'desc' }],
    });
  }
}

module.exports = BannerDao;
