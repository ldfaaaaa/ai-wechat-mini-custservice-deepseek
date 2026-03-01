// miniprogram/pages/index/index.js

// 预设客服二维码链接（替换为实际链接）
const CUSTOMER_SERVICE_QR_URL = 'https://www.example.com';

Page({
  data: {
    // 页面数据
  },

  onLoad: function () {
    // 页面加载时可预加载 FAQ 数据
    try {
      const faq = require('../../utils/faq');
      faq.loadFAQ().catch(err => {
        console.warn('[Index] 预加载 FAQ 失败：', err);
      });
    } catch (e) {
      console.warn('[Index] FAQ 模块加载异常：', e);
    }
  },

  onShow: function () {
    // 设置页面标题
    wx.setNavigationBarTitle({ title: 'AI 智能客服' });
  },

  /**
   * 点击"开始咨询"按钮，跳转到聊天页面
   */
  onStartChat: function () {
    wx.navigateTo({
      url: '/pages/chat/chat',
      fail: (err) => {
        console.error('[Index] 跳转 chat 页面失败：', err);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none',
          duration: 2000,
        });
      },
    });
  },

  /**
   * 点击"复制客服二维码链接"按钮
   */
  onCopyQrLink: function () {
    wx.setClipboardData({
      data: CUSTOMER_SERVICE_QR_URL,
      success: () => {
        wx.showToast({
          title: '✅ 已复制！',
          icon: 'none',
          duration: 2000,
        });
      },
      fail: (err) => {
        console.error('[Index] 复制失败：', err);
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none',
          duration: 2000,
        });
      },
    });
  },
});
