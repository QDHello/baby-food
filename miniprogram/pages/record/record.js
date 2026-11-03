const feeding = require('../../services/feeding');
const { formatAge, canAddSolidFood, MIN_SOLID_MONTHS } = require('../../utils/util');
const { REACTIONS, MEAL_LABEL, MEAL_ORDER } = require('../../utils/constants');

const REACTION_LABEL = {};
REACTIONS.forEach((r) => { REACTION_LABEL[r.key] = r.label; });

Page({
  data: {
    baby: null,
    ageText: '',
    groupedLogs: []
  },

  onShow() {
    this.load();
  },

  load() {
    const app = getApp();
    const baby = app.globalData.currentBaby;
    const logs = baby
      ? feeding.getLogs(baby.id).map((l) => ({
          ...l,
          reactionLabel: REACTION_LABEL[l.reaction] || l.reaction,
          mealLabel: MEAL_LABEL[l.meal] || '',
          images: Array.isArray(l.images) ? l.images : []
        }))
      : [];
    this.setData({
      baby,
      ageText: baby ? formatAge(baby.birthday) : '',
      groupedLogs: this.groupByDate(logs)
    });
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
        items: map[date].sort((a, b) => {
          const oa = MEAL_ORDER[a.meal] === undefined ? 9 : MEAL_ORDER[a.meal];
          const ob = MEAL_ORDER[b.meal] === undefined ? 9 : MEAL_ORDER[b.meal];
          return oa - ob;
        })
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
          this.load();
        }
      }
    });
  }
});
