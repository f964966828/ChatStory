export type ImportPlatform = "line" | "meta" | "telegram";

export const IMPORT_PLATFORM_LABELS: Record<ImportPlatform, string> = {
  line: "LINE",
  meta: "Meta",
  telegram: "Telegram",
};

export type MessageType =
  | "text"
  | "sticker"
  | "image"
  | "video"
  | "call"
  | "system";

export type ChatMessage = {
  id: string;
  timestamp: number;
  senderId: string;
  senderName: string;
  content: string;
  platform: ImportPlatform;
  type: MessageType;
  callDurationMs?: number;
};

export type ParsedChat = {
  messages: ChatMessage[];
  usernameA: string;
  usernameB: string;
};
