// 云函数：喂养记录 CRUD（集合：feedingLogs）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTION = 'feedingLogs';

// 云函数端单次 get 默认上限 100 条（以官方文档核实），这里显式分页避免静默丢数据
const MAX_PAGE_SIZE = 100;

// 允许客户端写入的业务字段白名单：防止覆写 openid / createdAt 等归属字段
const WRITABLE = [
  'babyId', 'date', 'meal', 'recipeId', 'recipeTitle',
  'emoji', 'reaction', 'note', 'images'
];

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
      case 'list': {
        // 分页：前端按 skip/limit 翻页，返回 total / hasMore 供判断是否到底
        const { babyId } = payload;
        const skip = Math.max(0, Number(payload.skip) || 0);
        const limit = Math.min(
          MAX_PAGE_SIZE,
          Math.max(1, Number(payload.limit) || 20)
        );
        const where = { openid: OPENID };
        if (babyId) where.babyId = babyId;

        const countRes = await col.where(where).count();
        const res = await col
          .where(where)
          .orderBy('date', 'desc')
          .orderBy('createdAt', 'desc')
          .skip(skip)
          .limit(limit)
          .get();

        return {
          list: res.data,
          total: countRes.total,
          hasMore: skip + res.data.length < countRes.total
        };
      }

      case 'detail': {
        // 单条查询同样校验归属
        const res = await col
          .where({ _id: payload.id, openid: OPENID })
          .limit(1)
          .get();
        return res.data[0] || null;
      }

      case 'add':
        return await col.add({
          data: {
            ...pick(payload.data || payload, WRITABLE),
            openid: OPENID,
            createdAt: db.serverDate()
          }
        });

      case 'update': {
        // 与前端 feeding.updateLog 对齐（阶段 2 编辑记录需要）
        const res = await col
          .where({ _id: payload.id, openid: OPENID })
          .update({ data: pick(payload.data || payload, WRITABLE) });
        if (!res.stats || res.stats.updated === 0) {
          return { error: 'forbidden or not found' };
        }
        return res;
      }

      case 'remove': {
        // 安全：禁止按 doc id 删除他人记录
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
