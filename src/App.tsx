import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import TextInput from "ink-text-input";
import { loadHistory, saveHistory } from "./history";
import type { Message } from "./history";
import { processUserPrompt } from "./agent";
import { handleSlashCommand } from "./commands";
import { registerMcpServer, getMcpTools } from "./mcp";

export default function App() {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const { exit } = useApp();

  // Carregar histórico ao iniciar
  useEffect(() => {
    const loaded = loadHistory();
    if (loaded.length > 0) {
      setHistory(loaded);
    } else {
      setHistory([
        { role: "assistant", content: "Olá! Sou o Agent2LLM. Digite /help para ver meus comandos." }
      ]);
    }
  }, []);

  const addMcpServer = async (commandStr: string) => {
    try {
      const serverConfig = commandStr.split(" ");
      const serverName = serverConfig[0] || "mcp_server";
      await registerMcpServer(serverName, serverConfig[0]!, serverConfig.slice(1));
      setStatus("MCP server configurado.");
      setTimeout(() => setStatus(""), 2000);

      const mcpMsg: Message = { role: "system", content: `Servidor MCP ${serverName} iniciado.` };
      setHistory(prev => [...prev, mcpMsg]);
    } catch (err) {
      const errMsg: Message = { role: "system", content: `Falha MCP: ${(err as Error).message}` };
      setHistory(prev => [...prev, errMsg]);
    }
  };

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    setInput("");

    const isCommand = await handleSlashCommand(value, {
      history,
      setHistory,
      setStatus,
      exitApp: exit,
      addMcpServer
    });

    if (isCommand) return;

    // Atualizar UI com mensagem do usuário
    const userMsg: Message = { role: "user", content: value };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setIsProcessing(true);
    setStatus("Pensando...");

    // Remove msgs internas (system) pra mandar pro LLM
    const promptHistory = newHistory.filter(h => h.role !== "system").slice(-10);

    try {
      // Injeta ferramentas MCP se existirem
      const mcpTools = await getMcpTools();

      const response = await processUserPrompt(value, promptHistory, mcpTools, (msg) => {
        setStatus(msg);
      });

      const assistantMsg: Message = { role: "assistant", content: response };
      const finalHistory = [...newHistory, assistantMsg];

      setHistory(finalHistory);
      // Salva em disco só o q importa pro LLM
      saveHistory(finalHistory.filter(h => h.role !== "system"));
    } catch (error) {
      const errorMsg: Message = { role: "assistant", content: `Erro: ${(error as Error).message}` };
      const finalHistory = [...newHistory, errorMsg];
      setHistory(finalHistory);
      saveHistory(finalHistory.filter(h => h.role !== "system"));
    } finally {
      setIsProcessing(false);
      setStatus("");
    }
  };

  // Ajuda UI Slash /
  const showCommandsHint = input.startsWith("/");

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
        <Text bold color="cyan">🤖 Agent2LLM - Interface de Programação TUI</Text>
      </Box>

      {/* Histórico de Chat */}
      <Box flexDirection="column" marginBottom={1}>
        {history.map((msg, index) => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";
          const color = isUser ? "green" : (isSystem ? "blue" : "magenta");
          const label = isUser ? "Você:" : (isSystem ? "Sistema:" : "Agente:");
          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Text bold color={color}>
                {label}
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

      {/* Hint Comandos */}
      {showCommandsHint && !isProcessing && (
        <Box marginBottom={1} borderStyle="single" borderColor="blue" padding={1}>
          <Text color="blue">Comandos rápidos: /help, /clear, /mcp, /exit</Text>
        </Box>
      )}

      {/* Entrada de Texto */}
      <Box borderStyle="single" borderColor={showCommandsHint ? "blue" : "gray"} paddingX={1}>
        <Text color="green" bold>{showCommandsHint ? "⚡" : "❯"} </Text>
        {isProcessing ? (
          <Text color="gray">Aguarde a resposta...</Text>
        ) : (
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            // @ts-ignore
            placeholder={showCommandsHint ? "Digite o comando..." : "Digite seu comando aqui..."}
          />
        )}
      </Box>
    </Box>
  );
}
