const feeding = require('../../services/feeding');
const { formatAge, canAddSolidFood, MIN_SOLID_MONTHS } = require('../../utils/util');
const { REACTIONS, MEAL_LABEL, MEAL_ORDER } = require('../../utils/constants');

const REACTION_LABEL = {};
REACTIONS.forEach((r) => { REACTION_LABEL[r.key] = r.label; });

// 首屏渲染条数，每次触底再追加一页（阶段 1 本地数据；阶段 2 可对接 feedingLog.list 的 skip/limit）
const PAGE_SIZE = 20;

function mealOrder(meal) {
  return MEAL_ORDER[meal] === undefined ? 9 : MEAL_ORDER[meal];
}

Page({
  data: {
    baby: null,
    ageText: '',
    groupedLogs: [],
    totalCount: 0,
    hasMore: false
  },

  onShow() {
    // 保持已加载页数：编辑记录返回后不会跳回列表顶部
    this.load(true);
  },

  // 上拉触底加载下一页（页面级滚动，record.wxml 未使用 scroll-view）
  onReachBottom() {
    this.loadMore();
  },

  // keepCount：是否保留当前已加载条数（onShow / 删除后使用）
  load(keepCount) {
    const app = getApp();
    const baby = app.globalData.currentBaby;
    const logs = baby ? feeding.getLogs(baby.id) : [];

    // 全量排序结果放在实例属性上，不进 data，避免一次性把大数组传给视图层
    this._allLogs = logs.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1; // 日期倒序
      return mealOrder(a.meal) - mealOrder(b.meal);            // 组内按餐次正序
    });

    const prevCount = keepCount && this._renderCount ? this._renderCount : PAGE_SIZE;
    this._renderCount = Math.min(prevCount, this._allLogs.length);

    this.setData({
      baby,
      ageText: baby ? formatAge(baby.birthday) : '',
      groupedLogs: this.buildGroups(),
      totalCount: this._allLogs.length,
      hasMore: this._renderCount < this._allLogs.length
    });
  },

  loadMore() {
    if (!this.data.hasMore) return;
    this._renderCount = Math.min(
      this._renderCount + PAGE_SIZE,
      (this._allLogs || []).length
    );
    this.setData({
      groupedLogs: this.buildGroups(),
      hasMore: this._renderCount < this._allLogs.length
    });
    // 阶段 2 接云时：此处改为调用 feedingLog.list({ babyId, skip: this._renderCount, limit: PAGE_SIZE })
    // 并把返回的 list 追加到 this._allLogs 后再 buildGroups()
  },

  // 只把当前页需要渲染的记录做字段加工与分组
  buildGroups() {
    const list = (this._allLogs || []).slice(0, this._renderCount).map((l) => ({
      ...l,
      reactionLabel: REACTION_LABEL[l.reaction] || l.reaction,
      mealLabel: MEAL_LABEL[l.meal] || '',
      images: Array.isArray(l.images) ? l.images : []
    }));
    return this.groupByDate(list);
  },

  // 按日期分组，最新在前；组内按餐次（早→午→晚→加餐）排序
  groupByDate(logs) {
    const map = {};
    logs.forEach((l) => {
      if (!map[l.date]) map[l.date] = [];
      map[l.date].push(l);
    });
    return Object.keys(map)
      .sort()
      .reverse()
      .map((date) => ({
        date,
        items: map[date].sort((a, b) => mealOrder(a.meal) - mealOrder(b.meal))
      }));
  },

  goAdd() {
    const baby = this.data.baby;
    if (baby && !canAddSolidFood(baby.birthday)) {
      wx.showToast({ title: `宝宝满${MIN_SOLID_MONTHS}月龄后才能添加辅食`, icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/record-add/record-add' });
  },
  // 点击记录进入编辑
  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/record-add/record-add?logId=${id}` });
  },
  // 预览记录图片
  onPreviewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    wx.previewImage({ current, urls });
  },
  goBaby() {
    wx.navigateTo({ url: '/pages/baby-list/baby-list' });
  },
  removeLog(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条喂养记录吗？',
      success: (res) => {
        if (res.confirm) {
          feeding.removeLog(id);
          this.load(true);
        }
      }
    });
  }
});
