// 喂养记录本地数据服务（云开发接入后替换为数据库调用）
const KEY = 'feedingLogs';

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
  return log;
}

// 删除喂养记录
function removeLog(id) {
  let all = wx.getStorageSync(KEY) || [];
  all = all.filter((l) => l.id !== id);
  wx.setStorageSync(KEY, all);
}

module.exports = { getLogs, addLog, removeLog };
