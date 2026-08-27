import type { ImportPlatform, ParsedChat } from "@/lib/chat-types";
import { parseLineChat } from "@/lib/parse-line";
import { parseMetaChat } from "@/lib/parse-meta";

export { extractLineUsernameB, parseLineChat } from "@/lib/parse-line";
export { parseMetaChat } from "@/lib/parse-meta";

export function parseChatText(
  text: string,
  platform: ImportPlatform,
  _fileName?: string,
): ParsedChat {
  return platform === "line" ? parseLineChat(text) : parseMetaChat(text);
}
