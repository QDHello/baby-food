const { RECIPES } = require('../../data/mock');
const { STAGES } = require('../../utils/constants');
const { calcMonthAge } = require('../../utils/util');

// 搜索防抖间隔：输入停止 300ms 后才做全量筛选
const SEARCH_DELAY = 300;

Page({
  data: {
    stages: STAGES,
    activeStage: '', // '' 表示全部
    scrollInto: '', // scroll-view 的 scroll-into-view 目标 id
    keyword: '',
    list: []
  },

  onLoad(options) {
    if (options.stage) {
      this.setData({ activeStage: options.stage });
    } else {
      // 初进页面按宝宝月龄自动匹配阶段 tab（URL 未指定 stage 时）
      const stage = this.matchStageByBaby();
      if (stage) this.setData({ activeStage: stage });
    }
    // 匹配到的 tab 可能超出横向可视区（如 12-24月），自动滚入可视区
    if (this.data.activeStage) {
      wx.nextTick(() => {
        this.setData({ scrollInto: 'chip-' + this.data.activeStage });
      });
    }
    this.apply();
  },

  // 按当前宝宝月龄找所属阶段（取 min<=月龄 的最后一个阶段，月龄等于区间起始月时优先选该区间：
  // 8月龄→8-10月而非6-8月；<6 封底 0-6，≥36 封顶 24-36）
  matchStageByBaby() {
    const baby = getApp().globalData.currentBaby;
    if (!baby) return '';
    const { months } = calcMonthAge(baby.birthday);
    const stage = [...STAGES].reverse().find((s) => months >= s.min);
    return stage ? stage.key : '';
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
    // 点已选中的 tab：不切换筛选，仅回顶
    if (this.data.activeStage === stage) {
      wx.pageScrollTo({ scrollTop: 0, duration: 0 });
      return;
    }
    this.clearPendingApply();
    this.setData({ activeStage: stage });
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
      // 起始月定归属：食谱只出现在其起始月龄所属阶段（与月龄匹配 tab 同口径，边界不渗漏）
      list = list.filter((r) => r.minMonths >= s.min && r.minMonths < s.max);
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
