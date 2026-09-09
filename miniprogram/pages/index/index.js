const { RECIPES } = require('../../data/mock');
const { calcMonthAge, getStage, formatAge } = require('../../utils/util');

Page({
  data: {
    baby: null,
    stage: null,
    ageText: '',
    recommendRecipes: [],
    hotRecipes: []
  },

  onShow() {
    this.load();
  },

  load() {
    const app = getApp();
    const baby = app.globalData.currentBaby;
    const hotRecipes = RECIPES.slice(0, 4);

    if (baby) {
      const { months } = calcMonthAge(baby.birthday);
      this.setData({
        baby,
        stage: getStage(months),
        ageText: formatAge(baby.birthday),
        recommendRecipes: this.filterByBaby(baby),
        hotRecipes
      });
    } else {
      this.setData({
        baby: null,
        stage: null,
        ageText: '',
        recommendRecipes: [],
        hotRecipes
      });
    }
  },

  // 按宝宝月龄筛选适用食谱
  filterByBaby(baby) {
    const { months } = calcMonthAge(baby.birthday);
    return RECIPES.filter((r) => months >= r.minMonths && months <= r.maxMonths).slice(0, 4);
  },

  goBaby() {
    wx.navigateTo({ url: '/pages/baby-list/baby-list' });
  },
  goRecipeList() {
    wx.navigateTo({ url: '/pages/recipe-list/recipe-list' });
  },
  goRecipe(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/recipe-detail/recipe-detail?id=${id}` });
  },
  goAddRecord() {
    wx.navigateTo({ url: '/pages/record-add/record-add' });
  },
  goWiki() {
    wx.switchTab({ url: '/pages/wiki/wiki' });
  }
});
