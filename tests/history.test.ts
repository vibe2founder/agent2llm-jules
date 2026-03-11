import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import { loadHistory, saveHistory } from "../src/history";
import type { Message } from "../src/history";

describe("History Storage (TDD)", () => {
  const HISTORY_FILE = path.join(process.cwd(), ".agent_history.json");
  let originalFileExisted = false;
  let originalData = "";

  beforeAll(() => {
    // Save state
    if (fs.existsSync(HISTORY_FILE)) {
      originalFileExisted = true;
      originalData = fs.readFileSync(HISTORY_FILE, "utf-8");
    }
    // Clean start
    if (fs.existsSync(HISTORY_FILE)) {
      fs.unlinkSync(HISTORY_FILE);
    }
  });

  afterAll(() => {
    // Restore state
    if (originalFileExisted) {
      fs.writeFileSync(HISTORY_FILE, originalData, "utf-8");
    } else if (fs.existsSync(HISTORY_FILE)) {
      fs.unlinkSync(HISTORY_FILE);
    }
  });

  test("Should load empty history when file does not exist", () => {
    const history = loadHistory();
    expect(history).toEqual([]);
  });

  test("Should save history correctly to disk", () => {
    const mockData: Message[] = [{ role: "user", content: "hello world" }];
    saveHistory(mockData);

    expect(fs.existsSync(HISTORY_FILE)).toBe(true);
    const content = fs.readFileSync(HISTORY_FILE, "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed).toEqual(mockData);
  });

  test("Should load existing history from file", () => {
    const history = loadHistory();
    expect(history.length).toBe(1);
    expect(history[0]?.content).toBe("hello world");
  });
});
