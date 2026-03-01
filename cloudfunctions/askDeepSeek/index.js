// cloudfunctions/askDeepSeek/index.js
/**
 * 云函数：askDeepSeek
 * 调用 DeepSeek-V3 API，返回 AI 回复
 * 使用 Node.js 原生 https 模块，无需 axios
 */

const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ===== 替换为你的 DeepSeek API Key =====
const DEEPSEEK_API_KEY = 'sk-81dc9e3e37f743dd9bc6af877fa4b86a';

// DeepSeek API 配置
const DEEPSEEK_HOST = 'api.deepseek.com';
const DEEPSEEK_PATH = '/v1/chat/completions';
const MODEL = 'deepseek-chat'; // DeepSeek-V3

// 系统提示词
const SYSTEM_PROMPT =
  '你是一个专业友好的企业客服助手，用简洁中文回答，每次回答不超过200字，不确定时引导用户转人工客服。';

/**
 * 使用 Node.js 原生 https 模块发送 POST 请求
 * @param {string} host 域名
 * @param {string} path 路径
 * @param {object} headers 请求头
 * @param {string} body 请求体（JSON字符串）
 * @returns {Promise<string>} 响应体字符串
 */
function httpsPost(host, path, headers, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(
            new Error(
              `HTTP ${res.statusCode}: ${data.slice(0, 200)}`
            )
          );
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    // 设置 20 秒超时
    req.setTimeout(20000, () => {
      req.destroy(new Error('请求超时（20s）'));
    });

    req.write(body);
    req.end();
  });
}

/**
 * 云函数入口
 * event.userInput  {string}  当前用户输入
 * event.history    {Array}   最近对话历史 [{role, content}]
 */
exports.main = async (event, context) => {
  const { userInput, history = [] } = event;

  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    return {
      success: false,
      error: '输入内容不能为空',
    };
  }

  // 构造消息列表：系统提示 + 历史对话 + 当前问题
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim()
    ),
    { role: 'user', content: userInput.trim() },
  ];

  const requestBody = JSON.stringify({
    model: MODEL,
    messages: messages,
    max_tokens: 300,
    temperature: 0.7,
    stream: false,
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    Accept: 'application/json',
  };

  try {
    const responseText = await httpsPost(
      DEEPSEEK_HOST,
      DEEPSEEK_PATH,
      headers,
      requestBody
    );

    const responseJson = JSON.parse(responseText);

    // 提取回复内容
    const answer =
      responseJson &&
      responseJson.choices &&
      responseJson.choices[0] &&
      responseJson.choices[0].message &&
      responseJson.choices[0].message.content;

    if (!answer) {
      return {
        success: false,
        error: 'AI 返回内容为空，请稍后重试',
      };
    }

    return {
      success: true,
      answer: answer.trim(),
    };
  } catch (err) {
    console.error('[askDeepSeek] API 调用异常：', err.message || err);

    let friendlyError = '抱歉，AI 服务暂时不可用，请稍后重试或转接人工客服 😊';

    if (err.message && err.message.includes('超时')) {
      friendlyError = '请求超时，AI 响应较慢，请稍后重试 ⏱️';
    } else if (err.message && err.message.includes('401')) {
      friendlyError = '服务配置异常，请联系管理员处理';
    } else if (err.message && err.message.includes('429')) {
      friendlyError = '请求过于频繁，请稍候片刻再试 🙏';
    }

    return {
      success: false,
      error: friendlyError,
    };
  }
};
