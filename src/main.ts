
import MCPClient from "./mcpClient.ts";
import Agent from "./Agent.ts";
import path from "path";

const model = 'Qwen/Qwen3-8B'
const outPath = path.join(process.cwd(), 'output');
// const task = `请帮我构思一部仙侠小说大纲，包括主要股市情节，人物，不少于2000字，并将结果写入到${outPath}/notion.md,输出一个md文件`
// const task = `读取${outPath}/notion.md的内容，并分析正文，分析不合理的地方并优化，输出一个md文件`
const task = '公路车有什么性价比特别高的选择'
async function main () {
  // const fetchMcp = new MCPClient('fetchMcp', 'npx', ['mcp-server-fetch']);
  const fileMcp = new MCPClient('fileMcp', 'npx', ['-y', '@modelcontextprotocol/server-filesystem', outPath]);
  const agent = new Agent(model, [fileMcp]);
  await agent.init();
  const content = await agent.invoke(task)
  console.log(content);
  await agent.close();
}

main()