const { RECIPES } = require('../../data/mock');
const { DIFFICULTY } = require('../../utils/constants');
const { canAddSolidFood, MIN_SOLID_MONTHS } = require('../../utils/util');

Page({
  data: {
    recipe: null,
    difficulty: null,
    baby: null,
    conflictText: ''
  },

  onLoad(options) {
    const recipe = RECIPES.find((r) => r.id === options.id);
    if (!recipe) {
      wx.showToast({ title: '食谱不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    const app = getApp();
    const baby = app.globalData.currentBaby;
    // 检测宝宝过敏原与食谱食材的冲突
    const babyAllergens = (baby && baby.allergens) || [];
    const conflictAllergens = (recipe.allergens || []).filter((a) =>
      babyAllergens.includes(a)
    );

    this.setData({
      recipe: {
        ...recipe,
        cover: recipe.cover || '',
        showCover: !!recipe.cover
      },
      baby,
      conflictText: conflictAllergens.join('、'),
      difficulty: DIFFICULTY[recipe.difficulty] || DIFFICULTY.easy
    });
    wx.setNavigationBarTitle({ title: recipe.title });
  },

  // 右上角菜单开启"转发给朋友 / 分享到朋友圈"
  onShow() {
    wx.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 转发给好友：卡片带封面图，落地到本页
  onShareAppMessage() {
    const r = this.data.recipe;
    if (!r) return { title: '蹦Food·宝宝辅食', path: '/pages/index/index' };
    return {
      title: `${r.title}｜${r.minMonths}-${r.maxMonths}月龄辅食`,
      path: `/pages/recipe-detail/recipe-detail?id=${r.id}`,
      imageUrl: r.cover || undefined
    };
  },

  // 分享到朋友圈：单页模式打开，通过 query 带食谱 id
  onShareTimeline() {
    const r = this.data.recipe;
    if (!r) return { title: '蹦Food·宝宝辅食' };
    return {
      title: `${r.title}｜${r.minMonths}-${r.maxMonths}月龄辅食`,
      query: `id=${r.id}`,
      imageUrl: r.cover || undefined
    };
  },

  // 封面图加载失败 → 回退 emoji
  onCoverError() {
    this.setData({ 'recipe.showCover': false });
  },

  goAdd() {
    const baby = getApp().globalData.currentBaby;
    if (baby && !canAddSolidFood(baby.birthday)) {
      wx.showToast({ title: `宝宝满${MIN_SOLID_MONTHS}月龄后才能添加辅食`, icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/record-add/record-add?recipeId=${this.data.recipe.id}`
    });
  },
  addFavorite() {
    wx.showToast({ title: '收藏功能即将上线', icon: 'none' });
  }
});
