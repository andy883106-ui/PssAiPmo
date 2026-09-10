import { uid } from "@/lib/utils";

const WORK_LOG_KEY = "pika-work-logs-v1";
const WORK_LOG_KEY_ALT = "jun-work-logs-v1";
const CHAT_KEY = "jun-chat-thread-v1";

export type WorkLog = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  author?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  author: string;
  text: string;
  createdAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isWorkLog(value: unknown): value is WorkLog {
  if (!value || typeof value !== "object") return false;
  const e = value as WorkLog;
  return (
    typeof e.id === "string" &&
    typeof e.title === "string" &&
    typeof e.content === "string" &&
    Array.isArray(e.tags) &&
    typeof e.createdAt === "string"
  );
}

export function loadWorkLogs(): WorkLog[] {
  if (!canUseStorage()) return [];
  try {
    const raw =
      window.localStorage.getItem(WORK_LOG_KEY_ALT) ??
      window.localStorage.getItem(WORK_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWorkLog).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } catch {
    return [];
  }
}

export function saveWorkLogs(logs: WorkLog[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(WORK_LOG_KEY, JSON.stringify(logs));
  window.localStorage.setItem(WORK_LOG_KEY_ALT, JSON.stringify(logs));
}

export function addWorkLog(input: Omit<WorkLog, "id" | "createdAt"> & { id?: string; createdAt?: string }) {
  const logs = loadWorkLogs();
  const next: WorkLog = {
    id: input.id ?? uid("log"),
    title: input.title,
    content: input.content,
    tags: input.tags,
    createdAt: input.createdAt ?? new Date().toISOString(),
    author: input.author,
  };
  const merged = [next, ...logs];
  saveWorkLogs(merged);
  return next;
}

export function loadChat(threadKey: string): ChatMessage[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(`${CHAT_KEY}:${threadKey}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChat(threadKey: string, messages: ChatMessage[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(`${CHAT_KEY}:${threadKey}`, JSON.stringify(messages));
}

export function appendChat(threadKey: string, message: Omit<ChatMessage, "id" | "createdAt"> & Partial<ChatMessage>) {
  const list = loadChat(threadKey);
  const next: ChatMessage = {
    id: message.id ?? uid("msg"),
    role: message.role,
    author: message.author,
    text: message.text,
    createdAt: message.createdAt ?? new Date().toISOString(),
  };
  const merged = [...list, next];
  saveChat(threadKey, merged);
  return next;
}
