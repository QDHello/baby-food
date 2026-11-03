const { INGREDIENTS } = require('../../data/mock');
const { RISK_LEVELS } = require('../../utils/constants');
const { calcMonthAge } = require('../../utils/util');

function withRiskKey(list) {
  return list.map((i) => ({ ...i, riskKey: RISK_LEVELS[i.allergenRisk] || '' }));
}

// 排序：越接近宝宝月龄越靠前；无宝宝档案时按建议添加月龄升序
function sortByAge(list, babyMonths) {
  if (babyMonths === null) {
    return list.slice().sort((a, b) => a.addMonths - b.addMonths);
  }
  return list.slice().sort((a, b) => {
    const da = Math.abs(a.addMonths - babyMonths);
    const db = Math.abs(b.addMonths - babyMonths);
    return da === db ? a.addMonths - b.addMonths : da - db;
  });
}

Page({
  data: {
    ingredients: [],
    keyword: '',
    sortTip: ''
  },

  onLoad() {
    this.render();
  },

  onShow() {
    // 宝宝档案可能变化，每次展示时重排
    this.render();
  },

  render() {
    const baby = getApp().globalData.currentBaby;
    let babyMonths = null;
    let sortTip = '按建议添加月龄排序';
    if (baby) {
      babyMonths = calcMonthAge(baby.birthday).months;
      sortTip = `已按接近${baby.name}（${babyMonths}月龄）排序`;
    }
    this.setData({
      ingredients: sortByAge(withRiskKey(INGREDIENTS), babyMonths),
      sortTip
    });
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    const baby = getApp().globalData.currentBaby;
    const babyMonths = baby ? calcMonthAge(baby.birthday).months : null;
    const filtered = keyword ? INGREDIENTS.filter((i) => i.name.includes(keyword)) : INGREDIENTS;
    this.setData({ keyword, ingredients: sortByAge(withRiskKey(filtered), babyMonths) });
  },

  onClear() {
    this.setData({ keyword: '' });
    this.render();
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
