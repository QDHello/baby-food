// 喂养记录本地数据服务（云开发接入后替换为数据库调用）
const KEY = 'feedingLogs';

// 写操作后提升数据版本号，让首页 onShow 绕过节流立即刷新概览
function bump() {
  const app = getApp();
  if (app && typeof app.bumpDataVersion === 'function') app.bumpDataVersion();
}

// 获取喂养记录（可按宝宝过滤）
function getLogs(babyId) {
  const all = wx.getStorageSync(KEY) || [];
  return babyId ? all.filter((l) => l.babyId === babyId) : all;
}

// 新增喂养记录
function addLog(log) {
  const all = wx.getStorageSync(KEY) || [];
  all.unshift(log);
  wx.setStorageSync(KEY, all);
  bump();
  return log;
}

// 按 id 查询单条记录
function getLog(id) {
  const all = wx.getStorageSync(KEY) || [];
  return all.find((l) => l.id === id) || null;
}

// 更新喂养记录（仅覆盖允许编辑的字段）
function updateLog(id, patch) {
  const all = wx.getStorageSync(KEY) || [];
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const allow = ['date', 'recipeId', 'recipeTitle', 'emoji', 'reaction', 'note', 'images'];
  allow.forEach((k) => {
    if (patch && patch[k] !== undefined) all[idx][k] = patch[k];
  });
  wx.setStorageSync(KEY, all);
  bump();
  return all[idx];
}

// 删除喂养记录
function removeLog(id) {
  let all = wx.getStorageSync(KEY) || [];
  all = all.filter((l) => l.id !== id);
  wx.setStorageSync(KEY, all);
  bump();
}

module.exports = { getLogs, addLog, getLog, updateLog, removeLog };
