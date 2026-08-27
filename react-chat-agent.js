import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

/**
 * React 集成示例：聊天组件中的 AI Agent
 * 展示如何在前端项目中集成 Agent
 */

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 模拟 React Hook 风格的 Agent
class ChatAgent {
  constructor() {
    this.messages = [];
    this.tools = [
      {
        name: 'get_user_info',
        description: '获取用户信息',
        input_schema: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          },
          required: ['userId']
        }
      },
      {
        name: 'create_todo',
        description: '创建待办事项',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            dueDate: { type: 'string' }
          },
          required: ['title']
        }
      }
    ];
  }

  // 执行工具
  async executeTool(toolName, input) {
    console.log(`🔧 工具调用: ${toolName}`, input);

    switch (toolName) {
      case 'get_user_info':
        return {
          userId: input.userId,
          name: '李明',
          email: 'liming@example.com',
          todoCount: 5
        };

      case 'create_todo':
        return {
          id: Date.now(),
          title: input.title,
          dueDate: input.dueDate || '未设置',
          status: 'pending'
        };

      default:
        return { error: '未知工具' };
    }
  }

  // 发送消息（类似 React 中的 handleSubmit）
  async sendMessage(userMessage) {
    console.log(`\n💬 用户: ${userMessage}`);

    this.messages.push({
      role: 'user',
      content: userMessage
    });

    let assistantReply = '';

    // Agent 循环
    for (let i = 0; i < 5; i++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 2048,
        messages: this.messages,
        tools: this.tools,
        system: '你是一个智能助手，帮助用户管理待办事项和查询信息。'
      });

      // 收集文本回复（用于 UI 显示）
      const textBlocks = response.content.filter(b => b.type === 'text');
      if (textBlocks.length > 0) {
        assistantReply = textBlocks[0].text;
      }

      if (response.stop_reason === 'end_turn') {
        this.messages.push({
          role: 'assistant',
          content: response.content
        });
        break;
      }

      if (response.stop_reason === 'tool_use') {
        this.messages.push({
          role: 'assistant',
          content: response.content
        });

        // 执行工具调用
        const toolResults = [];
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const result = await this.executeTool(block.name, block.input);
            console.log(`✅ 返回:`, result);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result)
            });
          }
        }

        this.messages.push({
          role: 'user',
          content: toolResults
        });
      }
    }

    console.log(`🤖 Agent: ${assistantReply}\n`);
    return {
      reply: assistantReply,
      timestamp: new Date().toISOString()
    };
  }

  // 获取聊天历史（用于 UI 渲染）
  getHistory() {
    return this.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role,
        content: typeof m.content === 'string'
          ? m.content
          : m.content.find(b => b.type === 'text')?.text || '[工具调用]'
      }));
  }
}

// 模拟前端使用场景
async function simulateChat() {
  const agent = new ChatAgent();

  // 第一轮对话
  await agent.sendMessage('帮我查一下用户 user_123 的信息');

  // 第二轮对话
  await agent.sendMessage('帮我创建一个待办：明天下午开会');

  // 第三轮对话
  await agent.sendMessage('我现在有几个待办事项？');

  // 打印完整对话历史
  console.log('📜 对话历史:');
  console.log(JSON.stringify(agent.getHistory(), null, 2));
}

simulateChat().catch(console.error);

// 导出供 React 使用
export { ChatAgent };
