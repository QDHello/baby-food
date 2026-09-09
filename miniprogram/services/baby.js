// 宝宝档案本地数据服务（云开发接入后替换为数据库调用）
const { genId } = require('../utils/util');

const KEY = 'babies';
const CURRENT_KEY = 'currentBabyId';

function getBabies() {
  return wx.getStorageSync(KEY) || [];
}

function getCurrentBaby() {
  const babies = getBabies();
  const id = wx.getStorageSync(CURRENT_KEY);
  return babies.find((b) => b.id === id) || babies[0] || null;
}

// 同步到全局状态
function syncGlobal() {
  const app = getApp();
  if (app) {
    app.globalData.babies = getBabies();
    app.globalData.currentBaby = getCurrentBaby();
  }
}

function setCurrent(id) {
  wx.setStorageSync(CURRENT_KEY, id);
  syncGlobal();
}

function createBaby(data) {
  const babies = getBabies();
  const baby = { id: genId('baby'), ...data };
  babies.push(baby);
  wx.setStorageSync(KEY, babies);
  setCurrent(baby.id);
  return baby;
}

function updateBaby(id, data) {
  const babies = getBabies();
  const idx = babies.findIndex((b) => b.id === id);
  if (idx >= 0) {
    babies[idx] = { ...babies[idx], ...data };
    wx.setStorageSync(KEY, babies);
  }
  syncGlobal();
}

function removeBaby(id) {
  const babies = getBabies().filter((b) => b.id !== id);
  wx.setStorageSync(KEY, babies);
  if (wx.getStorageSync(CURRENT_KEY) === id) {
    wx.setStorageSync(CURRENT_KEY, babies.length ? babies[0].id : '');
  }
  syncGlobal();
}

module.exports = {
  getBabies,
  getCurrentBaby,
  setCurrent,
  createBaby,
  updateBaby,
  removeBaby,
  syncGlobal
};
