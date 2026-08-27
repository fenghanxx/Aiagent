# AI Agent 项目

基于 Claude API 的 AI Agent 开发入门项目。

## 功能特性

- ✅ 基础对话 Agent
- ✅ 工具调用（Tool Use）
- ✅ 真实 API 集成（GitHub 搜索）
- ✅ 错误处理和重试机制
- ✅ 浏览器自动化示例
- ✅ React 集成示例

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 并重命名为 `.env`，填入你的配置：

```env
ANTHROPIC_API_KEY=你的API密钥
ANTHROPIC_BASE_URL=https://code.newcli.com/claude/ultra
```

### 3. 运行示例

```bash
# 基础对话
node index.js

# 工具调用示例
node agent-with-tools.js

# 真实 API 集成
node real-api-example.js
```

## 项目结构

```
ai-agent/
├── index.js                 # 基础对话 Agent
├── agent-with-tools.js      # 带工具调用的 Agent
├── real-api-example.js      # 真实API集成示例
├── browser-agent.js         # 浏览器自动化示例
├── react-chat-agent.js      # React集成示例
└── test-api-key.js         # API测试工具
```

## 核心概念

### Messages API

基础的对话接口：

```javascript
const response = await client.messages.create({
  model: 'claude-sonnet-5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: '你好' }]
});
```

### Tool Use（工具调用）

Agent 的核心能力，让 AI 能调用外部工具：

```javascript
const tools = [{
  name: 'get_weather',
  description: '获取天气信息',
  input_schema: {
    type: 'object',
    properties: {
      city: { type: 'string' }
    }
  }
}];
```

## 技术栈

- Node.js 18+
- @anthropic-ai/sdk
- dotenv

## 参考资源

- [Claude API 文档](https://docs.anthropic.com)
- [Tool Use 指南](https://docs.anthropic.com/en/docs/tool-use)

## License

MIT
