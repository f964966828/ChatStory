import type { ImportPlatform, ParsedChat } from "@/lib/chat-types";
import { parseChatText } from "@/lib/parsers";

export const MAX_CHAT_FILE_BYTES = 50 * 1024 * 1024;

export function acceptForPlatform(platform: ImportPlatform) {
  if (platform === "line") return ".txt,text/plain";
  return ".json,application/json";
}

export function isAllowedFileType(file: File, platform: ImportPlatform) {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  if (platform === "line") {
    return name.endsWith(".txt") || mime === "text/plain";
  }
  return name.endsWith(".json") || mime === "application/json";
}

function decodeBuffer(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes);
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export async function importChatFile(
  file: File,
  platform: ImportPlatform,
): Promise<ParsedChat> {
  if (!isAllowedFileType(file, platform)) {
    throw new Error("WRONG_FILE_TYPE");
  }

  if (file.size > MAX_CHAT_FILE_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const buffer = await file.arrayBuffer();
  const text = decodeBuffer(buffer).replace(/^\uFEFF/, "");
  const parsed = parseChatText(text, platform, file.name);

  if (parsed.messages.length === 0) {
    throw new Error("EMPTY_CHAT");
  }

  return parsed;
}
