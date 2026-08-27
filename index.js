import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
});

async function chat(message, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: message }]
      });

      console.log(response.content[0].text);
      return;
    } catch (error) {
      console.log(`❌ 尝试 ${i + 1}/${retries} 失败: ${error.status} ${error.message}`);

      if (i < retries - 1) {
        const delay = (i + 1) * 2000; // 2s, 4s, 6s
        console.log(`⏳ ${delay/1000}秒后重试...\n`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('\n💥 所有重试失败，请检查:');
        console.error('1. 网络连接是否正常');
        console.error('2. API 服务状态: https://status.anthropic.com');
        console.error('3. 是否使用了代理或转发服务');
        throw error;
      }
    }
  }
}

chat('你是什么模型？');
