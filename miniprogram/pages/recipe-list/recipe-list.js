const { RECIPES } = require('../../data/mock');
const { STAGES } = require('../../utils/constants');

// 搜索防抖间隔：输入停止 300ms 后才做全量筛选
const SEARCH_DELAY = 300;

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

  // 转发给好友：分享整个食谱库入口
  onShareAppMessage() {
    return {
      title: '蹦Food·宝宝辅食食谱库',
      path: '/pages/recipe-list/recipe-list'
    };
  },

  onHide() {
    // 离开页面前把未执行的搜索落一次，避免返回后列表与输入框不一致
    this.flushPendingApply();
  },

  onUnload() {
    // 清理定时器，防止页面销毁后仍执行 setData
    this.clearPendingApply();
  },

  clearPendingApply() {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer);
      this._searchTimer = null;
    }
  },

  flushPendingApply() {
    if (!this._searchTimer) return;
    this.clearPendingApply();
    this.apply();
  },

  debouncedApply() {
    this.clearPendingApply();
    this._searchTimer = setTimeout(() => {
      this._searchTimer = null;
      this.apply();
    }, SEARCH_DELAY);
  },

  // 选择/取消阶段筛选：立即生效，并取消尚未执行的搜索
  onStage(e) {
    const stage = e.currentTarget.dataset.stage;
    const activeStage = this.data.activeStage === stage ? '' : stage;
    this.clearPendingApply();
    this.setData({ activeStage });
    this.apply();
    // 切换筛选后回到顶部，从第一条开始看
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value.trim() });
    this.debouncedApply();
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
    // 只投影列表实际用到的字段：steps/tips/ingredients 等大字段不进 setData
    list = list.map((r) => ({
      id: r.id,
      title: r.title,
      emoji: r.emoji,
      desc: r.desc,
      cover: r.cover || '',
      showCover: !!r.cover,
      minMonths: r.minMonths,
      maxMonths: r.maxMonths,
      tags: r.tags || []
    }));
    this.setData({ list });
  },

  // 封面图加载失败 → 回退 emoji（局部路径更新，不整表 setData）
  onCoverError(e) {
    const id = e.currentTarget.dataset.id;
    const list = this.data.list;
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id && list[i].showCover) {
        this.setData({ ['list[' + i + '].showCover']: false });
        break;
      }
    }
  },

  goRecipe(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/recipe-detail/recipe-detail?id=${id}` });
  }
});
