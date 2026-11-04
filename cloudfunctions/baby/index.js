// 云函数：宝宝档案 CRUD（集合：babies）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTION = 'babies';

// 允许客户端写入的业务字段白名单：防止覆写 openid / createdAt 等归属字段
const WRITABLE = ['name', 'birthday', 'gender', 'allergens', 'emoji'];

function pick(data, keys) {
  const out = {};
  (keys || []).forEach((k) => {
    if (data && data[k] !== undefined) out[k] = data[k];
  });
  return out;
}

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
          data: {
            ...pick(payload, WRITABLE),
            openid: OPENID,
            createdAt: db.serverDate()
          }
        });

      case 'update': {
        // 安全：where 带 openid，只更新本人档案；越权时 updated = 0
        const res = await col
          .where({ _id: payload.id, openid: OPENID })
          .update({ data: pick(payload.data || payload, WRITABLE) });
        if (!res.stats || res.stats.updated === 0) {
          return { error: 'forbidden or not found' };
        }
        return res;
      }

      case 'remove': {
        // 安全：同上，禁止按 doc id 删除他人数据
        const res = await col.where({ _id: payload.id, openid: OPENID }).remove();
        if (!res.stats || res.stats.removed === 0) {
          return { error: 'forbidden or not found' };
        }
        return res;
      }

      default:
        return { error: 'unknown action' };
    }
  } catch (err) {
    return { error: err.message };
  }
};
