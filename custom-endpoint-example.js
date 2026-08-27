import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://code.newcli.com/claude/ultra',

  // 可选配置
  timeout: 60000,  // 60秒超时
  maxRetries: 3,   // SDK 自动重试3次

  // 自定义请求头（如果你的接口需要）
  defaultHeaders: {
    'X-Custom-Header': 'value'
  }
});

async function chat(message) {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }]
    });

    console.log(response.content[0].text);
  } catch (error) {
    console.error('❌ 错误:', error.status, error.message);

    // 调试信息
    if (error.status) {
      console.error('状态码:', error.status);
      console.error('请求的接口:', client.baseURL);
    }
    throw error;
  }
}

chat('你好，测试自定义接口');
