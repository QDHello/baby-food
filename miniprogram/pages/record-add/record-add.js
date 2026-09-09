const { RECIPES } = require('../../data/mock');
const feeding = require('../../services/feeding');
const { genId, formatDate } = require('../../utils/util');
const { REACTIONS } = require('../../utils/constants');

Page({
  data: {
    recipes: RECIPES,
    recipeIndex: -1,
    recipe: null,
    date: '',
    today: '',
    reactions: REACTIONS,
    reaction: 'none',
    note: '',
    baby: null
  },

  onLoad(options) {
    let recipeIndex = -1;
    if (options.recipeId) {
      recipeIndex = RECIPES.findIndex((r) => r.id === options.recipeId);
    }
    const today = formatDate(new Date());
    this.setData({
      recipeIndex,
      recipe: recipeIndex >= 0 ? RECIPES[recipeIndex] : null,
      date: today,
      today
    });
  },

  onShow() {
    this.setData({ baby: getApp().globalData.currentBaby });
  },

  onRecipe(e) {
    const idx = Number(e.detail.value);
    this.setData({ recipeIndex: idx, recipe: RECIPES[idx] });
  },
  onDate(e) {
    this.setData({ date: e.detail.value });
  },
  onReaction(e) {
    this.setData({ reaction: e.currentTarget.dataset.reaction });
  },
  onNote(e) {
    this.setData({ note: e.detail.value });
  },

  save() {
    const baby = this.data.baby;
    if (!baby) {
      wx.showToast({ title: '请先添加宝宝档案', icon: 'none' });
      return;
    }
    if (!this.data.recipe) {
      wx.showToast({ title: '请选择食谱', icon: 'none' });
      return;
    }
    const { recipe, date, reaction, note } = this.data;
    feeding.addLog({
      id: genId('log'),
      babyId: baby.id,
      date,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      emoji: recipe.emoji,
      reaction,
      note: note.trim()
    });
    wx.showToast({ title: '打卡成功', icon: 'success' });
    setTimeout(() => wx.switchTab({ url: '/pages/record/record' }), 600);
  }
});
