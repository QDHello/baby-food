// 云函数：宝宝档案 CRUD（集合：babies）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTION = 'babies';

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, payload = {} } = event;
  const col = db.collection(COLLECTION);

  try {
    switch (action) {
      case 'list':
        return (await col.where({ openid: OPENID }).get()).data;
      case 'create':
        return await col.add({
          data: { ...payload, openid: OPENID, createdAt: db.serverDate() }
        });
      case 'update':
        return await col.doc(payload.id).update({ data: payload.data });
      case 'remove':
        return await col.doc(payload.id).remove();
      default:
        return { error: 'unknown action' };
    }
  } catch (err) {
    return { error: err.message };
  }
};
