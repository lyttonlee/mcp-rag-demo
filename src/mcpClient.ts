import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { logMessage } from "./log.ts";
 export default class MCPClient {
  private mcp: Client;
  private tools: Tool[];
  private transport: StdioClientTransport;
  private command: string;
  private args: string[];
  constructor (name: string, command: string, args: string[], version?: string, description?: string) {
    this.mcp = new Client({
      name,
      version: version || '1.0.0',
      description: description   || 'A simple client for ModelContextProtocol',
    });
    this.command = command;
    this.args = args;
  }

  async connectToServer () {
    this.transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
    });
    await this.mcp.connect(this.transport);
    const tools = await this.mcp.listTools();
    this.tools = tools.tools;
    logMessage(`Connected to server ${this.command} ${this.args.join(' ')}`, 'green');
  }

  public async callTool (toolName: string, input: Record<string, any>) {
   return await this.mcp.callTool({
    name: toolName,
    arguments: input,
   });
  }

  public async close () {
    await this.mcp.close();
    logMessage(`close from server`, 'green');
  }

  public async init () {
    await this.connectToServer();
    logMessage(`init from server`, 'green');
  }

  public getTools () {
    return this.tools;
  }
 }