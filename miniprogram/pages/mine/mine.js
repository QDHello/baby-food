Page({
  data: {
    userInfo: null,
    babyCount: 0
  },

  onShow() {
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      babyCount: app.globalData.babies.length
    });
  },

  goBaby() {
    wx.navigateTo({ url: '/pages/baby-list/baby-list' });
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
