// miniprogram/pages/chat/chat.js
const faq = require('../../utils/faq');

// 保留最近 N 条对话传给云函数（节省 token）
const MAX_HISTORY_LENGTH = 6;

Page({
  data: {
    messages: [],          // 消息列表 [{id, role, content, isError}]
    inputValue: '',        // 输入框内容
    isLoading: false,      // AI 回复加载中状态
    scrollIntoView: '',    // 滚动到指定 id
    scrollTop: 0,          // scroll-view scrollTop
    safeAreaBottom: 0,     // 安全区域底部高度
    messageIdCounter: 0,   // 消息 ID 计数器
  },

  onLoad: function () {
    // 获取安全区域信息
    const systemInfo = wx.getSystemInfoSync();
    const safeAreaBottom = (systemInfo.safeArea
      ? systemInfo.screenHeight - systemInfo.safeArea.bottom
      : 0);
    this.setData({ safeAreaBottom });

    // 预加载 FAQ
    faq.loadFAQ().catch(err => {
      console.warn('[Chat] FAQ 预加载失败：', err);
    });
  },

  onShow: function () {
    wx.setNavigationBarTitle({ title: '智能客服' });
  },

  /**
   * 输入框内容变化
   */
  onInput: function (e) {
    this.setData({ inputValue: e.detail.value });
  },

  /**
   * 点击发送（或键盘确认）
   */
  onSend: function () {
    const text = (this.data.inputValue || '').trim();
    if (!text || this.data.isLoading) return;

    // 清空输入框
    this.setData({ inputValue: '' });

    // 追加用户消息
    const userMsg = this._buildMessage('user', text);
    this._appendMessage(userMsg);

    // 先尝试 FAQ 匹配
    const faqAnswer = faq.matchFAQ(text);
    if (faqAnswer) {
      console.log('[Chat] FAQ 命中，直接回复');
      // 短暂延迟模拟思考，提升体验
      setTimeout(() => {
        const botMsg = this._buildMessage('assistant', faqAnswer);
        this._appendMessage(botMsg);
      }, 400);
      return;
    }

    // FAQ 未命中，调用云函数
    this._callDeepSeek(text);
  },

  /**
   * 调用云函数 askDeepSeek
   * @param {string} userInput 当前用户输入
   */
  _callDeepSeek: function (userInput) {
    this.setData({ isLoading: true });
    this._scrollToBottom();

    // 取最近 MAX_HISTORY_LENGTH 条已有消息构造对话历史
    const allMessages = this.data.messages;
    const recentMessages = allMessages
      .slice(-MAX_HISTORY_LENGTH)
      .map(m => ({ role: m.role, content: m.content }));

    wx.cloud.callFunction({
      name: 'askDeepSeek',
      data: {
        userInput: userInput,
        history: recentMessages,
      },
      success: (res) => {
        this.setData({ isLoading: false });
        const result = res.result;

        if (result && result.success && result.answer) {
          const botMsg = this._buildMessage('assistant', result.answer);
          this._appendMessage(botMsg);
        } else {
          const errText = (result && result.error)
            ? result.error
            : '抱歉，AI 暂时无法回答，请稍后重试或点击右下角转接人工客服 😊';
          const errMsg = this._buildMessage('assistant', errText, true);
          this._appendMessage(errMsg);
        }
      },
      fail: (err) => {
        console.error('[Chat] 云函数调用失败：', err);
        this.setData({ isLoading: false });
        const errMsg = this._buildMessage(
          'assistant',
          '网络异常，请检查网络连接后重试，或点击右下角转接人工客服 😊',
          true
        );
        this._appendMessage(errMsg);
      },
    });
  },

  /**
   * 构建消息对象
   * @param {string} role 'user' | 'assistant'
   * @param {string} content 消息内容
   * @param {boolean} isError 是否错误消息
   */
  _buildMessage: function (role, content, isError = false) {
    const id = this.data.messageIdCounter + 1;
    this.setData({ messageIdCounter: id });
    return { id, role, content, isError };
  },

  /**
   * 追加消息到列表并滚动到底部
   * @param {object} msg 消息对象
   */
  _appendMessage: function (msg) {
    const messages = this.data.messages.concat([msg]);
    this.setData({ messages }, () => {
      this._scrollToBottom();
    });
  },

  /**
   * 滚动到底部
   */
  _scrollToBottom: function () {
    // 利用 scroll-into-view 滚到底部占位元素
    this.setData({ scrollIntoView: 'list-bottom' });
    // 短暂后重置，避免重复 id 时失效
    setTimeout(() => {
      // 通过设置 scrollTop 为大数值兜底
      this.setData({ scrollIntoView: '' });
    }, 300);
  },
});
