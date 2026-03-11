import fs from "fs";
import path from "path";

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

const HISTORY_FILE = path.join(process.cwd(), ".agent_history.json");

export function loadHistory(): Message[] {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const data = fs.readFileSync(HISTORY_FILE, "utf-8");
      return JSON.parse(data) as Message[];
    } catch (err) {
      console.error("Erro ao carregar o histórico:", err);
      return [];
    }
  }
  return [];
}

export function saveHistory(messages: Message[]): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(messages, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar o histórico:", err);
  }
}
