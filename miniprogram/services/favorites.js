// 收藏本地数据服务（按宝宝维度隔离；云开发接入后映射 baby_favorites 表）
// storage 键：babyfood_favorites_{babyId}，结构 [{ id: recipeId, createdAt }]
function key(babyId) {
  return `babyfood_favorites_${babyId}`;
}

// 写操作后提升数据版本号，让依赖 onShow 的页面（我的页角标等）即时感知
function bump() {
  const app = getApp();
  if (app && typeof app.bumpDataVersion === 'function') app.bumpDataVersion();
}

// 获取收藏列表（按收藏时间倒序）
function getFavorites(babyId) {
  if (!babyId) return [];
  const list = wx.getStorageSync(key(babyId)) || [];
  return list.slice().sort((a, b) => b.createdAt - a.createdAt);
}

// 是否已收藏
function isFavorite(babyId, recipeId) {
  if (!babyId) return false;
  return getFavorites(babyId).some((f) => f.id === recipeId);
}

// 收藏数量
function count(babyId) {
  return getFavorites(babyId).length;
}

// 收藏（已收藏时静默返回，保证幂等）
function addFavorite(babyId, recipeId) {
  if (!babyId || !recipeId) return false;
  if (isFavorite(babyId, recipeId)) return false;
  const list = getFavorites(babyId);
  list.unshift({ id: recipeId, createdAt: Date.now() });
  wx.setStorageSync(key(babyId), list);
  bump();
  return true;
}

// 取消收藏
function removeFavorite(babyId, recipeId) {
  if (!babyId) return false;
  const list = getFavorites(babyId).filter((f) => f.id !== recipeId);
  wx.setStorageSync(key(babyId), list);
  bump();
  return true;
}

// 切换收藏状态，返回切换后是否已收藏
function toggleFavorite(babyId, recipeId) {
  if (isFavorite(babyId, recipeId)) {
    removeFavorite(babyId, recipeId);
    return false;
  }
  addFavorite(babyId, recipeId);
  return true;
}

module.exports = { getFavorites, isFavorite, count, addFavorite, removeFavorite, toggleFavorite };
