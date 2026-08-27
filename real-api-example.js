import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 真实 API 工具示例
const tools = [
  {
    name: 'fetch_webpage',
    description: '获取网页内容',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL地址' }
      },
      required: ['url']
    }
  },
  {
    name: 'search_github',
    description: '搜索 GitHub 仓库',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' }
      },
      required: ['query']
    }
  }
];

// 实现真实 API 调用
async function fetchWebpage(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    // 截取前1000字符避免 token 超限
    return { content: text.slice(0, 1000), url };
  } catch (error) {
    return { error: error.message };
  }
}

async function searchGithub(query) {
  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=3`,
      {
        headers: {
          'User-Agent': 'AI-Agent-Demo',
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    const data = await response.json();
    return {
      total: data.total_count,
      repos: data.items.map(item => ({
        name: item.full_name,
        stars: item.stargazers_count,
        description: item.description,
        url: item.html_url
      }))
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function executeTool(toolName, toolInput) {
  console.log(`🔧 调用工具: ${toolName}`, toolInput);

  switch (toolName) {
    case 'fetch_webpage':
      return await fetchWebpage(toolInput.url);
    case 'search_github':
      return await searchGithub(toolInput.query);
    default:
      return { error: '未知工具' };
  }
}

async function runAgent(userMessage) {
  console.log(`\n💬 用户: ${userMessage}\n`);
  const messages = [{ role: 'user', content: userMessage }];

  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      messages,
      tools
    });

    if (response.stop_reason === 'end_turn') {
      const text = response.content.find(b => b.type === 'text');
      if (text) console.log(`\n🤖 Agent: ${text.text}\n`);
      break;
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input);
          console.log(`✅ 结果:`, JSON.stringify(result, null, 2).slice(0, 200));
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }
      }

      messages.push({ role: 'user', content: toolResults });
    }
  }
}

// 测试真实 API
async function main() {
  await runAgent('搜索 GitHub 上最流行的 AI Agent 项目');
}

main().catch(console.error);
