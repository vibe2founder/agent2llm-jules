import { createSecureFileTools, runToolCallingAgent } from "@purecore/one-llm-4-all";
import type { LLMProviderSelection, AgentTool } from "@purecore/one-llm-4-all";
import dotenv from "dotenv";
import type { Message } from "./history";

dotenv.config();

// Configura as ferramentas seguras para o diretório atual do projeto
const tools = createSecureFileTools({
  rootDir: process.cwd(), // Permite acessar a pasta atual
  allowWrite: true,       // Permite criar/editar arquivos
  maxFileSizeBytes: 1024 * 1024, // 1MB limite
});

const SYSTEM_PROMPT = `Você é Agent2LLM, um assistente de programação experiente que vive no terminal (CLI/TUI) usando a lib one-llm-4-all.
Seu objetivo é ajudar o usuário a desenvolver software, entender o código, criar arquivos, fazer refatorações e debug.

Diretrizes:
1. Você tem acesso a ferramentas (tools) para ler, escrever, listar, excluir arquivos no diretório de trabalho atual e comandos adicionais do MCP.
2. Use essas ferramentas de forma autônoma para resolver o que o usuário pedir.
3. Se um usuário pedir para criar ou alterar um arquivo, USE A FERRAMENTA DE ARQUIVO. Não diga apenas o que deve ser feito, faça você mesmo.
4. Depois de usar uma ferramenta, sempre relate o que você fez de forma concisa.
5. Pense no contexto geral e certifique-se de não sobrescrever código importante sem pensar.
6. Responda em português.
7. O ambiente já possui um loop de ferramentas. Se precisar fazer múltiplas coisas (ex: ler arquivo, depois alterar), pode fazer passo a passo usando as ferramentas.`;

export async function processUserPrompt(
  prompt: string,
  history: Message[],
  mcpTools: AgentTool[] = [],
  onProgress?: (msg: string) => void
): Promise<string> {
  const model = process.env.MODEL || "llama-3.1-8b-instant";
  const provider = (process.env.PROVIDER || "auto") as LLMProviderSelection;

  try {
    if (onProgress) onProgress("Iniciando raciocínio...");

    let fullPrompt = "";
    if (history.length > 0) {
      fullPrompt += "CONVERSA ANTERIOR:\n";
      history.forEach(msg => {
        fullPrompt += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
      });
      fullPrompt += "NOVO PEDIDO DO USUÁRIO:\n";
    }
    fullPrompt += prompt;

    // Combina ferramentas de arquivo nativas com as importadas via MCP
    const combinedTools = [...tools, ...mcpTools];

    const response = await runToolCallingAgent(fullPrompt, {
      model,
      provider,
      apiKey: process.env.API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
      tools: combinedTools,
      maxSteps: 15,
      systemPrompt: SYSTEM_PROMPT,
    });

    return response;
  } catch (error) {
    console.error("Erro no agente:", error);
    const errMessage = (error as Error).message;
    if (errMessage.includes("429")) {
      return "⚠️ Ops! Atingimos o limite de taxa (Rate Limit 429) da API. Por favor, aguarde alguns instantes antes de tentar novamente, ou mude o provedor.";
    }
    return `Ocorreu um erro: ${errMessage}`;
  }
}
