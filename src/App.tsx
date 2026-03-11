import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { loadHistory, saveHistory } from "./history";
import type { Message } from "./history";
import { processUserPrompt } from "./agent";

export default function App() {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");

  // Carregar histórico ao iniciar
  useEffect(() => {
    const loaded = loadHistory();
    if (loaded.length > 0) {
      setHistory(loaded);
    } else {
      setHistory([
        { role: "assistant", content: "Olá! Sou o Agent2LLM. Como posso te ajudar a programar hoje?" }
      ]);
    }
  }, []);

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    // Atualizar UI com mensagem do usuário
    const userMsg: Message = { role: "user", content: value };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setInput("");
    setIsProcessing(true);
    setStatus("Pensando...");

    // Enviar para o agente, passando o contexto antigo (limitado aos últimos 10 turnos)
    const recentHistory = newHistory.slice(-10);

    try {
      const response = await processUserPrompt(value, recentHistory, (msg) => {
        setStatus(msg);
      });

      const assistantMsg: Message = { role: "assistant", content: response };
      const finalHistory = [...newHistory, assistantMsg];

      setHistory(finalHistory);
      saveHistory(finalHistory);
    } catch (error) {
      const errorMsg: Message = { role: "assistant", content: `Erro: ${(error as Error).message}` };
      const finalHistory = [...newHistory, errorMsg];
      setHistory(finalHistory);
      saveHistory(finalHistory);
    } finally {
      setIsProcessing(false);
      setStatus("");
    }
  };

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
        <Text bold color="cyan">🤖 Agent2LLM - Interface de Programação TUI</Text>
      </Box>

      {/* Histórico de Chat */}
      <Box flexDirection="column" marginBottom={1}>
        {history.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Text bold color={isUser ? "green" : "magenta"}>
                {isUser ? "Você:" : "Agente:"}
              </Text>
              <Text>{msg.content}</Text>
            </Box>
          );
        })}
      </Box>

      {/* Indicador de Status */}
      {isProcessing && (
        <Box marginBottom={1}>
          <Text color="yellow">⏳ {status || "Processando..."}</Text>
        </Box>
      )}

      {/* Entrada de Texto */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="green" bold>❯ </Text>
        {isProcessing ? (
          <Text color="gray">Aguarde a resposta...</Text>
        ) : (
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            // @ts-ignore
            placeholder="Digite seu comando aqui..."
          />
        )}
      </Box>
    </Box>
  );
}
