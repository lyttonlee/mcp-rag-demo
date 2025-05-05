import OpenAI from "openai";
import {Tool} from '@modelcontextprotocol/sdk/types.js'
import {logMessage} from './log.js'
import 'dotenv/config'

const gj = {
  key: process.env.MODEL_API_KEY,
  baseURL: process.env.MODEL_BASE_URL
}

const openRouter = {
  key: process.env.OPENROUTER_MODEL_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}
export default class ChatOpenAI {
    private openai: OpenAI;
    private model: string;
    private tools: Tool[];
    private systemPrompt: string;
    private messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    constructor(tools: Tool[] = [], context: string = '', systemPrompt: string = '', model: string = 'qwen/qwen3-8b:free') {
        this.openai = new OpenAI({apiKey: gj.key, baseURL: gj.baseURL});
        this.model = model;
        this.tools = tools;
        if (systemPrompt) {
           this.messages.push({role: 'system', content: systemPrompt}); 
        }
        if (context) {
            this.messages.push({role:'user', content: context});
        }
        // console.log(this.tools)
    }

    public appendToolResult (toolCallId: string, result: string) {
        this.messages.push({role:'tool', content: result, tool_call_id: toolCallId}); 
    }

    async chat (prompt?: string) {
        logMessage(`Chatting with model ${this.model}...`, 'green');
        try {
            if (prompt) {
                this.messages.push({role:'user', content: prompt}); 
            }
            const stream = await this.openai.chat.completions.create({
                model: this.model,
                messages: this.messages,
                stream: true,
                tools: this.tools.map((tool) => ({type: 'function' as const, function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.inputSchema
                }})),
                tool_choice: 'auto',
            });
            let constent = '';
            let toolCalls: ToolCall[] = [];
            //  logMessage('RESPONES: ', 'blue');
            for await (const chunk of stream) {
                // console.log(chunk);
                const delta = chunk.choices[0]?.delta;
                // console.log(delta);
                if (delta?.content) {
                    process.stdout.write(delta.content);
                    constent += delta.content;
                    // console.log(constent);
                } 
                if (delta?.tool_calls) { // 处理工具调用
                    for (const toolCall of delta.tool_calls) {
                        if (toolCalls.length <= toolCall.index) {
                            toolCalls.push({
                                id: '',
                                function: {
                                    name: '',
                                    arguments: '',
                                }
                            });
                        }
                        let currentCall = toolCalls[toolCall.index];
                        if (toolCall.id) {
                            currentCall.id += toolCall.id;
                        }
                        if (toolCall.function?.name) {
                            currentCall.function.name += toolCall.function.name;
                        }
                        if (toolCall.function?.arguments) {
                            currentCall.function.arguments += toolCall.function.arguments;
                        }
                    }
                }
            }
            this.messages.push({role:'assistant', content: constent, tool_calls: toolCalls.map((toolCall) => ({id: toolCall.id, function: toolCall.function, type: 'function'}))});
            return {content: constent, toolCalls};
        }catch (error) {
            logMessage(`Error chatting with model: ${error}`, 'red');
        } 
    }
}