const favorites = require('../../services/favorites');

Page({
  data: {
    userInfo: null,
    babyCount: 0,
    hasBaby: false,
    favCount: 0
  },

  onShow() {
    const app = getApp();
    const baby = app.globalData.currentBaby;
    this.setData({
      userInfo: app.globalData.userInfo,
      babyCount: app.globalData.babies.length,
      hasBaby: !!baby,
      favCount: baby ? favorites.count(baby.id) : 0
    });
  },

  goBaby() {
    wx.navigateTo({ url: '/pages/baby-list/baby-list' });
  },

  goMenu() {
    const baby = getApp().globalData.currentBaby;
    if (!baby) {
      wx.showToast({ title: '请先创建宝宝档案，再生成菜单', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/menu/menu' });
  },

  goFavorites() {
    const baby = getApp().globalData.currentBaby;
    if (!baby) {
      wx.showToast({ title: '请先创建宝宝档案，再收藏食谱', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  goStats() {
    const baby = getApp().globalData.currentBaby;
    if (!baby) {
      wx.showToast({ title: '请先创建宝宝档案，再查看统计', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/stats/stats' });
  },
  goLogin() {
    // 阶段一暂用演示登录，云开发接入后替换为 wx.getUserProfile + 云函数
    const app = getApp();
    app.globalData.userInfo = { nickName: '宝宝家长', avatarUrl: '' };
    this.setData({ userInfo: app.globalData.userInfo });
    wx.showToast({ title: '登录成功（演示）', icon: 'none' });
  },
  comingSoon() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  }
});
