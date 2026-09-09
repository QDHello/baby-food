// 云函数：食谱查询（集合：recipes）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTION = 'recipes';

exports.main = async (event) => {
  const { action = 'list', payload = {} } = event;
  const col = db.collection(COLLECTION);

  try {
    switch (action) {
      case 'list': {
        const { skip = 0, limit = 20, minMonths, maxMonths, keyword } = payload;
        let query = col;
        if (minMonths != null) query = query.where({ minMonths: db.command.gte(minMonths) });
        if (maxMonths != null) query = query.where({ maxMonths: db.command.lte(maxMonths) });
        const res = await query.orderBy('minMonths', 'asc').skip(skip).limit(limit).get();
        return { list: res.data };
      }
      case 'detail':
        return (await col.doc(payload.id).get()).data;
      default:
        return { error: 'unknown action' };
    }
  } catch (err) {
    return { error: err.message };
  }
};
