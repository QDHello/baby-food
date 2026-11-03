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
