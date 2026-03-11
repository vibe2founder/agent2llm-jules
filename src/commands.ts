import { saveHistory } from "./history";
import type { Message } from "./history";
import { closeMcpServers } from "./mcp";
import { processA2A, processAP2 } from "./agents2agent";

export interface CommandContext {
  history: Message[];
  setHistory: (history: Message[]) => void;
  setStatus: (status: string) => void;
  exitApp: () => void;
  addMcpServer?: (commandStr: string) => Promise<void>;
}

export async function handleSlashCommand(input: string, context: CommandContext): Promise<boolean> {
  if (!input.startsWith("/")) return false;

  const args = input.trim().split(" ");
  const command = args[0]?.toLowerCase();

  switch (command) {
    case "/help":
      addSystemMessage(
        "Comandos disponíveis:\n" +
        "/help - Mostra esta ajuda\n" +
        "/clear - Limpa o histórico atual\n" +
        "/mcp <comando> - Adiciona um servidor MCP\n" +
        "/a2a <agente> <mensagem> - Envia uma mensagem para outro agente\n" +
        "/ap2 <agente> <valor> - Realiza um pagamento de agente (Agent Payments)\n" +
        "/exit ou /quit - Sair do Agent2LLM",
        context
      );
      break;

    case "/clear":
      context.setHistory([]);
      saveHistory([]);
      addSystemMessage("Histórico limpo.", context);
      break;

    case "/exit":
    case "/quit":
      closeMcpServers().finally(() => context.exitApp());
      break;

    case "/mcp":
      if (args.length < 2) {
        addSystemMessage("Uso correto: /mcp npx -y @modelcontextprotocol/server-postgres ...", context);
      } else {
        if (context.addMcpServer) {
          addSystemMessage(`Tentando iniciar servidor MCP: ${args.slice(1).join(" ")}...`, context);
          await context.addMcpServer(args.slice(1).join(" "));
        } else {
          addSystemMessage("Servidor MCP não está configurado nesta sessão.", context);
        }
      }
      break;

    case "/a2a":
      if (args.length < 3) {
        addSystemMessage("Uso correto: /a2a <nome_agente_alvo> <mensagem_a_ser_enviada>", context);
      } else {
        const targetAgent = args[1]!;
        const messagePayload = args.slice(2).join(" ");
        context.setStatus(`Comunicando com Agente ${targetAgent}...`);

        try {
          const response = await processA2A(targetAgent, messagePayload);
          addSystemMessage(`[A2A Resposta] ${response}`, context);
        } catch (e) {
          addSystemMessage(`[A2A Erro] Não foi possível contatar ${targetAgent}.`, context);
        } finally {
          context.setStatus("");
        }
      }
      break;

    case "/ap2":
      if (args.length < 3) {
        addSystemMessage("Uso correto: /ap2 <nome_agente_alvo> <valor_numerico>", context);
      } else {
        const targetAgent = args[1]!;
        const amountStr = args[2]!;
        const amount = parseFloat(amountStr);

        if (isNaN(amount) || amount <= 0) {
          addSystemMessage(`[AP2 Erro] O valor de pagamento "${amountStr}" é inválido.`, context);
          break;
        }

        context.setStatus(`Autorizando pagamento AP2 para ${targetAgent}...`);
        try {
          const response = await processAP2(amount, targetAgent);
          addSystemMessage(`[AP2 Sucesso] ${response}`, context);
        } catch (e) {
          addSystemMessage(`[AP2 Erro] Falha na transação.`, context);
        } finally {
          context.setStatus("");
        }
      }
      break;

    default:
      addSystemMessage(`Comando desconhecido: ${command}. Digite /help para ver os comandos disponíveis.`, context);
      break;
  }

  return true; // Indicates it was a command
}

function addSystemMessage(text: string, context: CommandContext) {
  const msg: Message = { role: "system", content: text };
  const newHist = [...context.history, msg];
  context.setHistory(newHist);
  // Não salva msgs de sistema internas do CLI no arquivo de histórico para não poluir o LLM na próxima run
}
