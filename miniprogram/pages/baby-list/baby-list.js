const babyService = require('../../services/baby');
const { formatAge } = require('../../utils/util');

Page({
  data: {
    babies: [],
    currentId: ''
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
