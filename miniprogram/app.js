// app.js
App({
  onLaunch: function () {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // 填入你的云开发环境 ID
        env: 'cloudbase-1g1kwlfc3a20ff66',
        traceUser: true,
      });
    }

    // 获取系统信息，存入全局
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
  },

  globalData: {
    userInfo: null,
    systemInfo: null,
    // 全局主色
    primaryColor: '#07C160',
  },
});
