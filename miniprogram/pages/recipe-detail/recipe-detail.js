const { RECIPES } = require('../../data/mock');
const { DIFFICULTY } = require('../../utils/constants');

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
      recipe,
      baby,
      conflictText: conflictAllergens.join('、'),
      difficulty: DIFFICULTY[recipe.difficulty] || DIFFICULTY.easy
    });
    wx.setNavigationBarTitle({ title: recipe.title });
  },

  goAdd() {
    wx.navigateTo({
      url: `/pages/record-add/record-add?recipeId=${this.data.recipe.id}`
    });
  },
  addFavorite() {
    wx.showToast({ title: '收藏功能即将上线', icon: 'none' });
  }
});
