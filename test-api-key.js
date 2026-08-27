import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

// 测试 API Key 是否有效
async function testApiKey() {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    console.log('🔍 测试 API Key...\n');
    console.log('Key 前缀:', process.env.ANTHROPIC_API_KEY?.slice(0, 20) + '...');

    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Hi' }]
    });

    console.log('\n✅ API Key 有效！');
    console.log('模型:', response.model);
    console.log('回复:', response.content[0].text);

  } catch (error) {
    console.error('\n❌ 错误:', error.status, error.error);

    if (error.status === 403) {
      console.log('\n可能的原因:');
      console.log('1. 模型 ID 错误（已修复为 claude-sonnet-5）');
      console.log('2. API Key 没有权限访问该模型');
      console.log('3. Workspace/Organization 限制');
      console.log('4. 账户额度不足');
      console.log('\n💡 建议: 前往 https://console.anthropic.com/settings/keys 检查');
    }
  }
}

testApiKey();
