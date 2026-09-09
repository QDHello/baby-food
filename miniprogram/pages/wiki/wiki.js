const { INGREDIENTS } = require('../../data/mock');
const { RISK_LEVELS } = require('../../utils/constants');

function withRiskKey(list) {
  return list.map((i) => ({ ...i, riskKey: RISK_LEVELS[i.allergenRisk] || '' }));
}

Page({
  data: {
    ingredients: [],
    keyword: ''
  },

  onLoad() {
    this.setData({ ingredients: withRiskKey(INGREDIENTS) });
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    const ingredients = keyword
      ? withRiskKey(INGREDIENTS.filter((i) => i.name.includes(keyword)))
      : withRiskKey(INGREDIENTS);
    this.setData({ keyword, ingredients });
  },

  onClear() {
    this.setData({ keyword: '', ingredients: withRiskKey(INGREDIENTS) });
  },

  // 点击食材查看详情（暂用弹窗展示要点）
  goIngredient(e) {
    const id = e.currentTarget.dataset.id;
    const item = INGREDIENTS.find((i) => i.id === id);
    if (!item) return;
    wx.showModal({
      title: `${item.emoji} ${item.name}`,
      content: `建议添加：${item.addMonths}月龄起\n营养：${item.nutrition}\n功效：${item.benefit}\n过敏风险：${item.allergenRisk}\n小贴士：${item.tips}`,
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
