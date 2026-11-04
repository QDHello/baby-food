// 隐私授权弹窗组件
// 监听统一在 app.js 注册（onNeedPrivacyAuthorization 为覆盖式注册），
// 本组件只负责展示说明、打开隐私指引、以及在同意/拒绝后调用 resolve。
// 相关接口需基础库 >= 2.32.3，具体以微信官方文档为准。
Component({
  data: {
    show: false,
    contractName: '《用户隐私保护指引》'
  },

  lifetimes: {
    attached() {
      const app = getApp();
      if (!app) return;
      app.setPrivacyModal(this);

      // 主动查询：拉取后台配置的指引名称；有待同意的协议时提前提示用户阅读
      if (typeof wx.getPrivacySetting === 'function') {
        wx.getPrivacySetting({
          success: (res) => {
            if (res && res.privacyContractName) {
              this.setData({ contractName: res.privacyContractName });
            }
            if (res && res.needAuthorization) this.show();
          }
        });
      }
    },

    detached() {
      const app = getApp();
      if (app) app.setPrivacyModal(null);
    }
  },

  methods: {
    show() {
      if (!this.data.show) this.setData({ show: true });
    },

    hide() {
      this.setData({ show: false });
    },

    noop() {},

    // 打开小程序后台配置的《用户隐私保护指引》
    openContract() {
      if (typeof wx.openPrivacyContract !== 'function') return;
      wx.openPrivacyContract({
        fail: () => wx.showToast({ title: '暂时无法打开隐私指引', icon: 'none' })
      });
    },

    // 用户点击同意按钮后触发（bindagreeprivacyauthorization）
    // 官方要求：必须在同意按钮事件回调内调用 resolve，且 buttonId 与按钮 id 一致
    handleAgree() {
      const app = getApp();
      const resolve = app && app.globalData.privacyResolve;
      if (resolve) {
        app.globalData.privacyResolve = null;
        resolve({ buttonId: 'agree-btn', event: 'agree' });
      }
      this.hide();
    },

    handleDisagree() {
      const app = getApp();
      const resolve = app && app.globalData.privacyResolve;
      if (resolve) {
        app.globalData.privacyResolve = null;
        resolve({ event: 'disagree' });
      }
      this.hide();
      wx.showToast({ title: '未同意隐私指引，无法使用相册/相机', icon: 'none' });
    }
  }
});
