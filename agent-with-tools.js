import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://code.newcli.com/claude/ultra'
});

// 定义工具
const tools = [
  {
    name: 'get_weather',
    description: '获取指定城市的天气信息',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市名称，如"北京"、"上海"'
        }
      },
      required: ['city']
    }
  },
  {
    name: 'calculate',
    description: '执行数学计算',
    input_schema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: '数学表达式，如"2+3*4"'
        }
      },
      required: ['expression']
    }
  }
];

// 模拟天气 API（实际项目中替换为真实 API）
function getWeather(city) {
  const weatherData = {
    '北京': { temp: 18, condition: '晴天', humidity: 45 },
    '上海': { temp: 22, condition: '多云', humidity: 65 },
    '深圳': { temp: 28, condition: '小雨', humidity: 80 }
  };

  return weatherData[city] || {
    temp: 20,
    condition: '数据暂缺',
    humidity: 50
  };
}

// 计算器
function calculate(expression) {
  try {
    // 安全的数学计算（生产环境建议用 math.js）
    const result = eval(expression);
    return { result, expression };
  } catch (error) {
    return { error: '计算错误', expression };
  }
}

// 执行工具调用
function executeTool(toolName, toolInput) {
  console.log(`🔧 调用工具: ${toolName}`, toolInput);

  switch (toolName) {
    case 'get_weather':
      return getWeather(toolInput.city);
    case 'calculate':
      return calculate(toolInput.expression);
    default:
      return { error: '未知工具' };
  }
}

// Agent 主循环
async function runAgent(userMessage) {
  console.log(`\n💬 用户: ${userMessage}\n`);

  const messages = [{ role: 'user', content: userMessage }];
  let iteration = 0;

  while (iteration < 5) {  // 防止无限循环
    iteration++;

    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      messages,
      tools
    });

    console.log(`📊 第 ${iteration} 轮 - stop_reason: ${response.stop_reason}`);

    // 情况1: Agent 完成任务，给出最终回复
    if (response.stop_reason === 'end_turn') {
      const finalText = response.content.find(block => block.type === 'text');
      if (finalText) {
        console.log(`\n🤖 Agent: ${finalText.text}\n`);
      }
      break;
    }

    // 情况2: Agent 需要调用工具
    if (response.stop_reason === 'tool_use') {
      // 把 Agent 的响应加入对话历史
      messages.push({ role: 'assistant', content: response.content });

      // 执行所有工具调用
      const toolResults = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = executeTool(block.name, block.input);
          console.log(`✅ 工具返回:`, result);

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }
      }

      // 把工具执行结果返回给 Agent
      messages.push({
        role: 'user',
        content: toolResults
      });
    }
  }
}

// 测试不同场景
async function main() {
  // 场景1: 查询天气
  await runAgent('北京现在天气怎么样？');

  // 场景2: 数学计算
  await runAgent('帮我算一下 25 * 8 + 100');

  // 场景3: 组合任务
  await runAgent('如果北京气温超过20度，计算 (30-18)*2 的值');
}

main().catch(console.error);
