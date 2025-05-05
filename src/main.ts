
import MCPClient from "./mcpClient.ts";
import Agent from "./Agent.ts";

const model = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B'
async function main () {
  // const fetchMcp = new MCPClient('fetchMcp', 'npx', ['mcp-server-fetch']);
  const fileMcp = new MCPClient('fileMcp', 'npx', ['-y', '@modelcontextprotocol/server-filesystem', `${process.cwd()}`]);
  const agent = new Agent(model, [fileMcp]);
  await agent.init();
  const content = await agent.invoke(`请帮我一部小说大纲，不少于200字，并将结果写入到当前目录的output/res.md文件里面`)
  console.log(content);
}

main()