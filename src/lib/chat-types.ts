export type ImportPlatform = "line" | "meta";

export type MessageType =
  | "text"
  | "sticker"
  | "image"
  | "video"
  | "call"
  | "other";

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
