# AI 智能客服微信小程序（DeepSeek-V3 驱动）

> 基于微信云开发（TCB）+ DeepSeek-V3 API 构建的企业级 AI 客服小程序

---

## 功能特性

- 🤖 **智能多轮对话** — DeepSeek-V3 大模型驱动，理解上下文
- 📖 **FAQ 知识库** — 关键词优先匹配，节省 API 费用
- 👨‍💼 **一键转人工** — 微信原生 contact-button 组件
- 🎨 **仿微信聊天 UI** — 绿色 / 白色气泡，Loading 三点动画

---

## 完整文件清单

```
ai-wechat-mini-custservice-deepseek/
├── project.config.json                        # 项目配置（appid、cloudfunctionRoot）
├── README.md
├── miniprogram/
│   ├── app.js                                 # 云开发初始化
│   ├── app.json                               # 全局路由 & 导航栏配置
│   ├── app.wxss                               # 全局样式
│   ├── sitemap.json
│   ├── images/
│   │   ├── bot-avatar.svg                     # AI 头像（可替换为 .png）
│   │   └── user-avatar.svg                    # 用户头像（可替换为 .png）
│   ├── pages/
│   │   ├── index/
│   │   │   ├── index.wxml                     # 首页结构
│   │   │   ├── index.js                       # 首页逻辑
│   │   │   ├── index.wxss                     # 首页样式
│   │   │   └── index.json                     # 首页配置
│   │   └── chat/
│   │       ├── chat.wxml                      # 聊天页结构
│   │       ├── chat.js                        # 聊天逻辑（FAQ+云函数调用）
│   │       ├── chat.wxss                      # 聊天样式（仿微信 UI）
│   │       └── chat.json                      # 聊天页配置
│   └── utils/
│       └── faq.js                             # FAQ 工具（loadFAQ/matchFAQ/clearFAQCache）
└── cloudfunctions/
    └── askDeepSeek/
        ├── index.js                           # 云函数：调用 DeepSeek-V3 API
        └── package.json                       # 依赖：wx-server-sdk ~2.6.3
```

---

## 快速开始

### 1. 前置准备

- 微信开发者工具（最新版）
- 已开通**微信云开发**的小程序账号
- [DeepSeek API Key](https://platform.deepseek.com/)

### 2. 配置修改（4 处）

| 文件 | 位置 | 替换内容 |
|------|------|----------|
| `project.config.json` | `appid` | 你的小程序 AppID |
| `miniprogram/app.js` | `env: 'your-env-id'` | 你的云开发环境 ID |
| `cloudfunctions/askDeepSeek/index.js` | `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key |
| `miniprogram/pages/index/index.js` | `CUSTOMER_SERVICE_QR_URL` | 你的客服二维码链接 |

### 3. 初始化云数据库 FAQ 集合

云开发控制台 → 数据库 → 新建集合 `faq`，批量导入以下 JSON：

```json
[
  { "keywords": ["退款", "退钱", "退货"], "answer": "您好！退款流程：订单页 → 申请退款，1-3个工作日内原路退回。如有疑问请转人工客服。" },
  { "keywords": ["发货", "快递", "物流", "配送"], "answer": "付款后通常1-2个工作日发货，发货后可在订单页查看物流信息。" },
  { "keywords": ["优惠券", "折扣", "活动", "打折"], "answer": "请关注我们的公众号或小程序首页获取最新优惠活动信息！" },
  { "keywords": ["联系", "电话", "客服", "人工"], "answer": "工作时间（9:00-18:00）可点击右下角按钮转接人工客服，或拨打 400-XXX-XXXX。" },
  { "keywords": ["营业时间", "工作时间", "几点"], "answer": "我们的服务时间为周一至周日 9:00 - 22:00，节假日照常服务。" }
]
```

### 4. 部署云函数

微信开发者工具 → 右键 `cloudfunctions/askDeepSeek` → **上传并部署：云端安装依赖**

### 5. 编译运行

微信开发者工具打开本项目目录，点击编译即可预览。

---

## 架构说明

```
用户输入
   │
   ▼
matchFAQ() ──命中──▶ 直接回复（不消耗 API）
   │
  未命中
   │
   ▼
wx.cloud.callFunction('askDeepSeek')
   │
   ▼
云函数：DeepSeek-V3 API（https POST）
   │
   ▼
返回 AI 回复 → 显示到聊天界面
```

---

## 注意事项

- **API Key 安全**：Key 仅存放在云函数服务端，不暴露给前端
- **图片资源**：`images/*.svg` 可替换为同名 `.png`，同步修改 WXML 中 `src` 后缀即可
- **云函数 API 域名**：`api.deepseek.com` 需在云开发控制台添加到 HTTP 外网访问白名单

---

## 技术栈

- 微信小程序原生（WXML + WXSS + JavaScript）
- 微信云开发 TCB（云函数 + 云数据库）
- DeepSeek-V3 API（`model: deepseek-chat`）
- Node.js 原生 `https` 模块
