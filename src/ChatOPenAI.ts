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
        console.log(this.tools)
    }

    public appendToolResult (toolCallId: string, result: string) {
        this.messages.push({role:'tool', content: result, tool_call_id: toolCallId}); 
    }

    async chat (prompt?: string): Promise<{content: string, toolCalls: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall[]}> {
        logMessage(`Chatting with model ${this.model}...`, 'green');
        try {
           if (prompt) {
            this.messages.push({role:'user', content: prompt}); 
           }
           const stream = await this.openai.chat.completions.create({
            model: this.model,
            messages: this.messages,
            stream: true,
            tools: this.tools.map((tool) => ({type: 'function' as const, function: tool})),
            tool_choice: 'auto',
           });
           let constent = '';
           let toolCalls: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall[] = [];
          //  logMessage('RESPONES: ', 'blue');
           for await (const chunk of stream) {
            // console.log(chunk);
            const delta = chunk.choices[0]?.delta;
            // console.log(delta);
            if (delta?.content) {
                process.stdout.write(delta.content);
                constent += delta.content;
                console.log(constent);
            } 
            if (delta?.tool_calls && delta.tool_calls.length > 0) { 
              for (const toolCall of delta.tool_calls) {
                console.log(toolCall);
                 if (toolCalls.findIndex((t) => t.id === toolCall.id) === -1) {
                    toolCalls.push(toolCall);
                 }
              }
            }
           }
           this.messages.push({role:'assistant', content: constent});
          //  return {content: constent, toolCalls};
          Promise.resolve({content: constent, toolCalls});
        }catch (error) {
            logMessage(`Error chatting with model: ${error}`, 'red');
        } 
    }
}