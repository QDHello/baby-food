// app.js
App({
  globalData: {
    // 云开发环境 ID，填入后自动启用云能力；留空则使用本地缓存数据
    env: '',
    userInfo: null,
    babies: [],      // 宝宝列表
    currentBaby: null // 当前选中的宝宝
  },

  onLaunch() {
    this.initCloud();
    this.restoreFromCache();
  },

  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: this.globalData.env || undefined,
      traceUser: true
    });
  },

  // 从本地缓存恢复宝宝数据（离线可用）
  restoreFromCache() {
    const babies = wx.getStorageSync('babies') || [];
    const currentBabyId = wx.getStorageSync('currentBabyId');
    this.globalData.babies = babies;
    this.globalData.currentBaby =
      babies.find((b) => b.id === currentBabyId) || babies[0] || null;
  },

  // 保存宝宝列表并切换当前宝宝
  saveBabies(babies, currentBabyId) {
    this.globalData.babies = babies || [];
    wx.setStorageSync('babies', this.globalData.babies);
    if (currentBabyId) {
      this.globalData.currentBaby =
        this.globalData.babies.find((b) => b.id === currentBabyId) || null;
      wx.setStorageSync('currentBabyId', currentBabyId);
    }
  }
});
