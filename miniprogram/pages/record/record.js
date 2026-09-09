const feeding = require('../../services/feeding');
const { formatAge } = require('../../utils/util');
const { REACTIONS } = require('../../utils/constants');

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
      ? feeding.getLogs(baby.id).map((l) => ({ ...l, reactionLabel: REACTION_LABEL[l.reaction] || l.reaction }))
      : [];
    this.setData({
      baby,
      ageText: baby ? formatAge(baby.birthday) : '',
      groupedLogs: this.groupByDate(logs)
    });
  },

  // 按日期分组，最新在前
  groupByDate(logs) {
    const map = {};
    logs.forEach((l) => {
      if (!map[l.date]) map[l.date] = [];
      map[l.date].push(l);
    });
    return Object.keys(map)
      .sort()
      .reverse()
      .map((date) => ({ date, items: map[date] }));
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/record-add/record-add' });
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
