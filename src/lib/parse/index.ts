import type { ImportPlatform, ParsedChat } from "@/lib/chat-types";
import { parseLineChat } from "@/lib/parse/line";
import { parseMetaChat } from "@/lib/parse/meta";
import { parseTelegramChat } from "@/lib/parse/telegram";

export { extractLineUsernameB, parseLineChat } from "@/lib/parse/line";
export { parseMetaChat } from "@/lib/parse/meta";
export { parseTelegramChat, readTelegramExport } from "@/lib/parse/telegram";

export function parseChatText(
  text: string,
  platform: ImportPlatform,
  _fileName?: string,
): ParsedChat {
  if (platform === "line") return parseLineChat(text);
  if (platform === "telegram") return parseTelegramChat(text);
  return parseMetaChat(text);
}
