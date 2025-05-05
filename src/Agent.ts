import ChatOpenAI from "./ChatOPenAI";
import MCPClient from "./mcpClient.ts";
import {logMessage} from './log.ts'


export default class Agent {
  private llm: ChatOpenAI;
  private mcps: MCPClient[];
  private model: string;
  private systemPrompt: string;
  private context: string;

  constructor (model: string = 'mistralai/mistral-small-3.1-24b-instruct:free', mcps: MCPClient[], systemPrompt: string = '', context: string = '') {
    this.model = model;
    this.mcps = mcps;
    this.systemPrompt = systemPrompt;
    this.context = context;
  }

  public async init () {
    for (const mcp of this.mcps) {
      await mcp.init(); 
    }
    const tools = await Promise.all(this.mcps.map((mcp) => mcp.getTools())); 
    const allTools = tools.flat();
    this.llm = new ChatOpenAI(allTools, this.context, this.systemPrompt, this.model); 
    logMessage(`Agent initialized with model ${this.model}`, 'green');
  }

  public async close () {
    for await (const mcp of this.mcps) {
        await mcp.close();
    }
  }

  public async invoke (prompt?: string) {
    try {
      if (!this.llm) {
        throw new Error('Agent is not initialized');
      }
      let res = await this.llm.chat(prompt);
      if (!res) {
        throw new Error('No response from agent');
      }
      // console.log(`agent content res: ${res.content}`);
      // console.log(res.toolCalls)
      while (true) {
        if (res.toolCalls.length > 0) {
          for (const toolCall of res.toolCalls) { 
            console.log(`tool call: ${JSON.stringify(toolCall)}`);
            const mcp = this.mcps.find((mcp) => mcp.getTools().some(tool => tool.name === toolCall.function?.name)); 
            if (mcp) {
              logMessage(`Invoking tool ${toolCall.function?.name} USE`, 'green');
              const result = await mcp.callTool(toolCall.function?.name || '', JSON.parse(toolCall.function?.arguments || '{}'));
              console.log(`tool result: ${JSON.stringify(result)}`);
              this.llm.appendToolResult(toolCall.id as string, JSON.stringify(result));
            } else {
              this.llm.appendToolResult(toolCall.id as string, 'Tool not found');
            }
          } 
          res = await this.llm.chat();
          continue;
        }
        await this.close();
        return res.content;
      }
    } catch (error) {
      logMessage(`Error invoking agent: ${error}`,'red');
    }
    
  }

}