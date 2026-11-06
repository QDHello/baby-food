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
    sortTip: '',
    modalIngredient: null
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

  // 列表回到顶部（搜索结果变化时展示最新的从头开始）
  scrollTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    const baby = getApp().globalData.currentBaby;
    const babyMonths = baby ? calcMonthAge(baby.birthday).months : null;
    const filtered = keyword ? INGREDIENTS.filter((i) => i.name.includes(keyword)) : INGREDIENTS;
    this.setData({ keyword, ingredients: sortByAge(withRiskKey(filtered), babyMonths) });
    this.scrollTop();
  },

  onClear() {
    this.setData({ keyword: '' });
    this.render();
    this.scrollTop();
  },

  // 点击食材打开详情弹窗（标题居中、内容左对齐）
  goIngredient(e) {
    const id = e.currentTarget.dataset.id;
    const item = INGREDIENTS.find((i) => i.id === id);
    if (!item) return;
    this.setData({ modalIngredient: item });
  },

  closeIngredient() {
    this.setData({ modalIngredient: null });
  },

  // 阻止弹窗卡片点击冒泡到遮罩
  noop() {}
});
