import type { AgentTool } from "@purecore/one-llm-4-all";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface McpServerInstance {
  name: string;
  client: Client;
  transport: StdioClientTransport;
}

const servers: McpServerInstance[] = [];

export async function registerMcpServer(name: string, command: string, args: string[]): Promise<void> {
  // Configura o transporte STDIO (executa o comando como processo)
  const transport = new StdioClientTransport({
    command,
    args,
    stderr: "ignore", // opcional, ignora log do child
  });

  const client = new Client(
    { name: "agent2llm-jules", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  servers.push({
    name,
    client,
    transport
  });
}

export async function getMcpTools(): Promise<AgentTool[]> {
  const allTools: AgentTool[] = [];

  for (const server of servers) {
    try {
      // Lista as tools deste servidor MCP
      const result = await server.client.listTools();
      if (!result?.tools) continue;

      for (const t of result.tools) {
        // Converte o modelo do MCP SDK para o padrão AgentTool suportado pelo `llm2router`
        allTools.push({
          name: t.name,
          description: t.description || `Tool ${t.name} from MCP`,
          // Aqui garantimos a tipagem se existir um inputSchema
          inputSchema: t.inputSchema as Record<string, unknown>,
          execute: async (input: Record<string, unknown>, context) => {
            // Chamamos a ferramenta real no MCP
            const callResult = await server.client.callTool({
              name: t.name,
              arguments: input as Record<string, any>
            });

            // O MCP SDK retorna isError e content[] array, formatamos:
            if (callResult.isError) {
              return `Error: ${JSON.stringify(callResult.content)}`;
            }
            return JSON.stringify(callResult.content, null, 2);
          }
        });
      }
    } catch (err) {
      console.error(`Erro ao obter ferramentas do servidor MCP ${server.name}:`, err);
    }
  }

  return allTools;
}

// Fechar todas as conexões (ao sair)
export async function closeMcpServers() {
  for (const s of servers) {
    await s.transport.close();
  }
}
