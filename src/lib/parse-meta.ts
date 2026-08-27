import type { ParsedChat } from "@/lib/chat-types";

export function parseMetaChat(_text: string): ParsedChat {
  return {
    messages: [],
    usernameA: "",
    usernameB: "",
  };
}
