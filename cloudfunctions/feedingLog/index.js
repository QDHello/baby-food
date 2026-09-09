// 云函数：喂养记录 CRUD（集合：feedingLogs）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTION = 'feedingLogs';

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, payload = {} } = event;
  const col = db.collection(COLLECTION);

  try {
    switch (action) {
      case 'list': {
        const { babyId } = payload;
        let query = col.where({ openid: OPENID });
        if (babyId) query = query.where({ babyId });
        return (await query.orderBy('date', 'desc').get()).data;
      }
      case 'add':
        return await col.add({
          data: { ...payload.data, openid: OPENID, createdAt: db.serverDate() }
        });
      case 'remove':
        return await col.doc(payload.id).remove();
      default:
        return { error: 'unknown action' };
    }
  } catch (err) {
    return { error: err.message };
  }
};
