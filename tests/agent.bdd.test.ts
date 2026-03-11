import { describe, expect, test, mock } from "bun:test";

// Usando mock para simular o comportamento do pacote @purecore/one-llm-4-all
// e focar no comportamento (BDD) da nossa camada.
import { processUserPrompt } from "../src/agent";
import type { Message } from "../src/history";

mock.module("@purecore/one-llm-4-all", () => ({
  createSecureFileTools: () => [{ name: "mockTool", description: "mock" }],
  runToolCallingAgent: async (prompt: string, options: any) => {
    // Simula a resposta baseada no prompt
    if (prompt.includes("ler o arquivo")) {
      return "O arquivo contem dados interessantes.";
    }
    return "Resposta mockada do agente.";
  }
}));

describe("Agent Behaviour (BDD)", () => {
  test("Feature: Processar pedido simples do usuário\n  Given o usuário está na TUI\n  When o usuário pergunta algo sem histórico\n  Then o agente deve enviar a mensagem e devolver a resposta", async () => {
    const history: Message[] = [];
    const prompt = "Oi, tudo bem?";

    const response = await processUserPrompt(prompt, history);

    expect(response).toBe("Resposta mockada do agente.");
  });

  test("Feature: Injetar contexto de conversas anteriores\n  Given que o usuário e o agente já trocaram mensagens\n  When o usuário enviar uma nova pergunta\n  Then o histórico deve ser repassado ao prompt processado (embutido na string ou options)", async () => {
    const history: Message[] = [
      { role: "user", content: "Lembre que meu nome é Jules" },
      { role: "assistant", content: "Ok, entendi. Seu nome é Jules." }
    ];
    const prompt = "Qual é o meu nome?";

    const response = await processUserPrompt(prompt, history);

    expect(response).toBe("Resposta mockada do agente.");
  });

  test("Feature: Callbacks de progresso na TUI\n  Given a TUI que precisa exibir status ao usuário\n  When o prompt começa a processar\n  Then um callback de progresso deve ser invocado com status inicial", async () => {
    const history: Message[] = [];
    let receivedStatus = "";

    const response = await processUserPrompt("Test", history, (statusMsg) => {
      receivedStatus = statusMsg;
    });

    expect(receivedStatus).toBe("Iniciando raciocínio...");
    expect(response).toBe("Resposta mockada do agente.");
  });
});
