const { buildStats } = require('../../utils/stats');
const feeding = require('../../services/feeding');

Page({
  data: {
    // noBaby=未设宝宝档案 / empty=范围内无记录 / ready=正常渲染
    state: 'empty',
    range: 'month', // month=本月 / all=全部
    summary: { total: 0, days: 0, recipes: 0 },
    // 反应分布渲染数据（带百分比宽度与配色）
    distBars: [],
    allNone: false,
    allergyRank: [],
    heatBars: [],
    topRecipes: []
  },

  onShow() {
    this.render();
  },

  render() {
    const baby = getApp().globalData.currentBaby;
    if (!baby) {
      this.setData({ state: 'noBaby' });
      return;
    }
    const logs = feeding.getLogs(baby.id);
    const stats = buildStats(logs, this.data.range);
    if (stats.total === 0) {
      this.setData({ state: 'empty' });
      return;
    }

    // 反应分布 → 条形渲染数据（宽度按最大值归一）
    const distMeta = [
      { key: 'none', label: '无', color: '#52C41A' },
      { key: 'allergy', label: '过敏', color: '#e53935' },
      { key: 'discomfort', label: '不适', color: '#FA8C16' }
    ];
    const distMax = Math.max(stats.reactionDist.none, stats.reactionDist.allergy, stats.reactionDist.discomfort, 1);
    const distBars = distMeta.map((m) => ({
      ...m,
      count: stats.reactionDist[m.key],
      width: Math.round((stats.reactionDist[m.key] / distMax) * 100)
    }));

    // 30 天热度 → 柱高按最大值归一（最低留 8% 可见度，0 值为空柱）
    const heatMax = Math.max(...stats.heat.map((h) => h.count), 1);
    const heatBars = stats.heat.map((h) => ({
      date: h.date.slice(5).replace('-', '/'),
      count: h.count,
      height: h.count ? Math.round((h.count / heatMax) * 92) + 8 : 0
    }));

    this.setData({
      state: 'ready',
      summary: stats.summary,
      distBars,
      allNone: stats.reactionDist.none === stats.total,
      allergyRank: stats.allergyRank,
      heatBars,
      topRecipes: stats.topRecipes
    });
  },

  onRange(e) {
    const range = e.currentTarget.dataset.range;
    if (range === this.data.range) return;
    this.setData({ range });
    this.render();
  },

  goBabyEdit() {
    wx.navigateTo({ url: '/pages/baby-edit/baby-edit' });
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
