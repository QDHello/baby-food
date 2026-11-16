const { RECIPES } = require('../../data/mock');
const favorites = require('../../services/favorites');

const PAGE_SIZE = 15;

Page({
  data: {
    // ready=有收藏列表 / empty=无收藏 / noBaby=未设宝宝档案
    state: 'empty',
    list: [],
    // 分页提示：false=还有更多（上拉加载） / true=已全部加载
    allLoaded: false,
    total: 0
  },

  onShow() {
    this.render();
  },

  render() {
    const baby = getApp().globalData.currentBaby;
    if (!baby) {
      this._allList = [];
      this.setData({ state: 'noBaby', list: [], allLoaded: true, total: 0 });
      return;
    }
    // 全量数据缓存在页面实例，data 只放当前已渲染的分页
    this._allList = favorites
      .getFavorites(baby.id)
      .map((f) => RECIPES.find((r) => r.id === f.id))
      .filter(Boolean)
      .map((r) => ({
        id: r.id,
        title: r.title,
        emoji: r.emoji,
        desc: r.desc,
        cover: r.cover || '',
        showCover: !!r.cover,
        minMonths: r.minMonths,
        maxMonths: r.maxMonths
      }));
    const state = this._allList.length ? 'ready' : 'empty';
    this.setData({
      state,
      total: this._allList.length,
      list: this._allList.slice(0, PAGE_SIZE),
      allLoaded: this._allList.length <= PAGE_SIZE
    });
  },

  // 触底加载下一页
  onReachBottom() {
    if (this.data.state !== 'ready' || this.data.allLoaded) return;
    const next = this._allList.slice(0, this.data.list.length + PAGE_SIZE);
    this.setData({
      list: next,
      allLoaded: next.length >= this._allList.length
    });
  },

  goRecipe(e) {
    wx.navigateTo({
      url: `/pages/recipe-detail/recipe-detail?id=${e.currentTarget.dataset.id}`
    });
  },

  // 卡片右侧心形按钮：取消收藏并从列表移除（从第一页重新渲染）
  onRemove(e) {
    const baby = getApp().globalData.currentBaby;
    if (!baby) return;
    const id = e.currentTarget.dataset.id;
    favorites.removeFavorite(baby.id, id);
    this.render();
    wx.showToast({ title: '已取消收藏', icon: 'none' });
  },

  goRecipeList() {
    wx.navigateTo({ url: '/pages/recipe-list/recipe-list' });
  },

  goBabyEdit() {
    wx.navigateTo({ url: '/pages/baby-edit/baby-edit' });
  }
});
