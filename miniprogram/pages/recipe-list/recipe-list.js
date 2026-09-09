const { RECIPES } = require('../../data/mock');
const { STAGES } = require('../../utils/constants');

Page({
  data: {
    stages: STAGES,
    activeStage: '', // '' 表示全部
    keyword: '',
    list: []
  },

  onLoad(options) {
    if (options.stage) {
      this.setData({ activeStage: options.stage });
    }
    this.apply();
  },

  // 选择/取消阶段筛选
  onStage(e) {
    const stage = e.currentTarget.dataset.stage;
    const activeStage = this.data.activeStage === stage ? '' : stage;
    this.setData({ activeStage });
    this.apply();
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value.trim() });
    this.apply();
  },

  apply() {
    const { activeStage, keyword } = this.data;
    let list = RECIPES;

    if (activeStage) {
      const s = STAGES.find((item) => item.key === activeStage);
      // 月龄区间有交集即视为适用
      list = list.filter((r) => r.maxMonths >= s.min && r.minMonths <= s.max);
    }
    if (keyword) {
      list = list.filter(
        (r) =>
          r.title.includes(keyword) ||
          r.ingredients.some((i) => i.includes(keyword)) ||
          (r.tags || []).some((t) => t.includes(keyword))
      );
    }
    this.setData({ list });
  },

  goRecipe(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/recipe-detail/recipe-detail?id=${id}` });
  }
});
