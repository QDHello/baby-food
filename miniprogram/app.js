// app.js
App({
  globalData: {
    // 云开发环境 ID，填入后自动启用云能力；留空则使用本地缓存数据
    env: '',
    userInfo: null,
    babies: [],      // 宝宝列表
    currentBaby: null, // 当前选中的宝宝
    privacyResolve: null, // 待处理的隐私授权 resolve（onNeedPrivacyAuthorization）
    privacyModal: null,   // 当前挂载的隐私弹窗组件实例
    dataVersion: 0        // 本地数据版本号：写操作后 +1，首页据此判断是否需要刷新
  },

  onLaunch() {
    this.initCloud();
    this.restoreFromCache();
    this.initPrivacy();
  },

  // 任何本地数据写操作后调用，用于让首页 onShow 绕过 30s 节流立即刷新
  bumpDataVersion() {
    this.globalData.dataVersion += 1;
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

  // 隐私授权：全局只注册一次监听（该接口是覆盖式注册，重复注册只有最后一次生效）
  // 需基础库 >= 2.32.3，低版本未集成隐私功能，直接跳过
  initPrivacy() {
    if (typeof wx.onNeedPrivacyAuthorization !== 'function') return;
    wx.onNeedPrivacyAuthorization((resolve) => {
      // 触发时原隐私接口（本项目为 wx.chooseMedia）处于 pending 状态
      this.globalData.privacyResolve = resolve;
      const modal = this.globalData.privacyModal;
      if (modal && typeof modal.show === 'function') {
        modal.show();
      }
      // 若当前页面未挂载弹窗组件，则不 resolve，
      // 由平台「官方隐私弹窗」兜底（见官方文档《小程序隐私协议开发指南》）
    });
  },

  // 隐私弹窗组件 attached / detached 时登记自己
  setPrivacyModal(modal) {
    this.globalData.privacyModal = modal || null;
    if (modal && this.globalData.privacyResolve && typeof modal.show === 'function') {
      modal.show();
    }
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
    this.bumpDataVersion();
  }
});
