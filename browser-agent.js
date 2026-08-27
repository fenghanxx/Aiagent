import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

/**
 * 浏览器自动化 Agent
 * 适合前端开发者：结合 Puppeteer 做页面自动化
 */

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const tools = [
  {
    name: 'extract_page_content',
    description: '从 HTML 中提取关键信息',
    input_schema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML 内容' },
        target: { type: 'string', description: '要提取的信息类型，如"标题"、"价格"、"联系方式"' }
      },
      required: ['html', 'target']
    }
  },
  {
    name: 'fill_form_data',
    description: '生成表单填写数据',
    input_schema: {
      type: 'object',
      properties: {
        formFields: {
          type: 'array',
          description: '表单字段列表',
          items: { type: 'string' }
        },
        userContext: { type: 'string', description: '用户信息上下文' }
      },
      required: ['formFields']
    }
  }
];

// 模拟页面内容提取
function extractPageContent(html, target) {
  // 实际项目中用 cheerio 或 jsdom 解析
  const mockData = {
    '标题': '高性能 React 组件库',
    '价格': '￥299/月',
    '联系方式': 'support@example.com'
  };

  return {
    extracted: mockData[target] || '未找到',
    source: html.slice(0, 100)
  };
}

// 智能表单填写
function fillFormData(formFields, userContext) {
  const data = {};

  formFields.forEach(field => {
    if (field.includes('name') || field.includes('姓名')) {
      data[field] = '张三';
    } else if (field.includes('email') || field.includes('邮箱')) {
      data[field] = 'zhangsan@example.com';
    } else if (field.includes('phone') || field.includes('电话')) {
      data[field] = '13800138000';
    } else {
      data[field] = userContext ? `基于上下文生成: ${userContext}` : '默认值';
    }
  });

  return { formData: data };
}

async function executeTool(toolName, toolInput) {
  switch (toolName) {
    case 'extract_page_content':
      return extractPageContent(toolInput.html, toolInput.target);
    case 'fill_form_data':
      return fillFormData(toolInput.formFields, toolInput.userContext);
    default:
      return { error: '未知工具' };
  }
}

async function runBrowserAgent(task) {
  console.log(`\n📋 任务: ${task}\n`);

  const messages = [{ role: 'user', content: task }];

  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      messages,
      tools,
      system: '你是一个浏览器自动化助手，帮助用户提取网页信息和填写表单。'
    });

    if (response.stop_reason === 'end_turn') {
      const text = response.content.find(b => b.type === 'text');
      if (text) console.log(`\n✅ 完成: ${text.text}\n`);
      break;
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          console.log(`🔧 ${block.name}`, block.input);
          const result = await executeTool(block.name, block.input);
          console.log(`📦 结果:`, result);

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

// 测试场景
async function main() {
  // 场景1: 提取页面信息
  await runBrowserAgent(
    '从这个 HTML 中提取价格信息：<html><div class="price">￥299/月</div></html>'
  );

  // 场景2: 智能填表
  await runBrowserAgent(
    '帮我填写一个注册表单，字段有：username, email, phone, company'
  );
}

main().catch(console.error);
