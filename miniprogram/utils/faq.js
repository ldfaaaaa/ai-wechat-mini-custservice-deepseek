// miniprogram/utils/faq.js
/**
 * FAQ 工具模块
 * 负责从云数据库加载 FAQ 并进行关键词匹配
 * FAQ 文档结构：{ keywords: ["关键词1", "关键词2"], answer: "回答内容" }
 */

// 内存缓存
let _faqCache = null;
// 是否正在加载（防止并发重复请求）
let _isLoading = false;
// 等待加载完成的 Promise 队列
let _loadingPromise = null;

/**
 * 从云数据库 faq 集合读取所有 FAQ，结果缓存在内存中
 * @returns {Promise<Array>} FAQ 列表
 */
function loadFAQ() {
  // 已有缓存，直接返回
  if (_faqCache !== null) {
    return Promise.resolve(_faqCache);
  }

  // 正在加载，复用同一个 Promise
  if (_isLoading && _loadingPromise) {
    return _loadingPromise;
  }

  _isLoading = true;
  _loadingPromise = new Promise((resolve, reject) => {
    const db = wx.cloud.database();
    db.collection('faq')
      .limit(100)
      .get({
        success: (res) => {
          _isLoading = false;
          _faqCache = res.data || [];
          console.log('[FAQ] 加载成功，共', _faqCache.length, '条记录');
          resolve(_faqCache);
        },
        fail: (err) => {
          _isLoading = false;
          _loadingPromise = null;
          console.error('[FAQ] 加载失败：', err);
          // 加载失败时缓存空数组，避免重复请求，下次可再试
          _faqCache = [];
          reject(err);
        },
      });
  });

  return _loadingPromise;
}

/**
 * 遍历 FAQ 列表，关键词不区分大小写匹配用户输入
 * @param {string} userInput 用户输入的文字
 * @returns {string|null} 匹配到的答案，未命中返回 null
 */
function matchFAQ(userInput) {
  if (!userInput || typeof userInput !== 'string') return null;
  if (!_faqCache || _faqCache.length === 0) return null;

  const lowerInput = userInput.toLowerCase().trim();

  for (let i = 0; i < _faqCache.length; i++) {
    const item = _faqCache[i];
    if (!item || !item.answer) continue;

    const keywords = item.keywords;
    if (!Array.isArray(keywords) || keywords.length === 0) continue;

    for (let j = 0; j < keywords.length; j++) {
      const kw = String(keywords[j]).toLowerCase().trim();
      if (kw && lowerInput.includes(kw)) {
        console.log('[FAQ] 命中关键词：', keywords[j]);
        return item.answer;
      }
    }
  }

  return null;
}

/**
 * 清除内存中的 FAQ 缓存（可用于刷新 FAQ 数据）
 */
function clearFAQCache() {
  _faqCache = null;
  _isLoading = false;
  _loadingPromise = null;
  console.log('[FAQ] 缓存已清除');
}

module.exports = {
  loadFAQ,
  matchFAQ,
  clearFAQCache,
};
