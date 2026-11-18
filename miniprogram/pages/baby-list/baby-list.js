const babyService = require('../../services/baby');
const { formatAge } = require('../../utils/util');
const { SHARE_IMAGE } = require('../../utils/constants');

Page({
  data: {
    babies: [],
    currentId: ''
  },

  onLoad() {
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
  },

  // 转发给好友：分享宝宝档案入口（不携带本地档案数据）
  onShareAppMessage() {
    return {
      title: '蹦Food·宝宝档案',
      path: '/pages/baby-list/baby-list',
      imageUrl: SHARE_IMAGE
    };
  },

  // 分享到朋友圈：单页模式打开宝宝档案
  onShareTimeline() {
    return {
      title: '蹦Food·宝宝档案',
      imageUrl: SHARE_IMAGE
    };
  },

  onShow() {
    this.load();
  },

  load() {
    const babies = babyService.getBabies();
    const current = babyService.getCurrentBaby();
    this.setData({
      babies: babies.map((b) => ({ ...b, ageText: formatAge(b.birthday) })),
      currentId: current ? current.id : ''
    });
  },

  // 切换当前宝宝
  selectBaby(e) {
    const id = e.currentTarget.dataset.id;
    babyService.setCurrent(id);
    this.load();
  },

  addBaby() {
    wx.navigateTo({ url: '/pages/baby-edit/baby-edit' });
  },
  editBaby(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/baby-edit/baby-edit?id=${id}` });
  },
  removeBaby(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除宝宝',
      content: '删除后该宝宝的喂养记录将保留但无法再关联，确定删除吗？',
      success: (res) => {
        if (res.confirm) {
          babyService.removeBaby(id);
          this.load();
        }
      }
    });
  }
});
