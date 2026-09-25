import type { ChatMessage, ParsedChat } from "@/lib/chat-types";

type JsonRecord = Record<string, unknown>;
type TelegramExport = { messages: unknown[] };

type ParsedTelegramMessage = {
  messages: ChatMessage[];
  participant: { id: string; name: string };
};

export function readTelegramExport(text: string): TelegramExport {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("<")) {
    console.error("[Telegram parser] expected JSON export");
    throw new Error("PARSE_FAILED");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    console.error("[Telegram parser] JSON.parse failed");
    throw new Error("PARSE_FAILED");
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.messages)) {
    console.error("[Telegram parser] missing messages array");
    throw new Error("PARSE_FAILED");
  }

  return { messages: parsed.messages };
}

export function parseTelegramChat(text: string): ParsedChat {
  const data = readTelegramExport(text);
  const messages: ParsedChat["messages"] = [];
  const participants = new Map<string, string>();

  for (let index = 0; index < data.messages.length; index += 1) {
    const item = data.messages[index];
    if (!isRecord(item)) continue;
    const parsed = parseTelegramMessage(item, index);
    if (!parsed) continue;

    messages.push(...parsed.messages);
    if (!participants.has(parsed.participant.id)) {
      participants.set(parsed.participant.id, parsed.participant.name);
    }
  }

  if (messages.length === 0) {
    console.error("[Telegram parser] no readable messages");
    throw new Error("PARSE_FAILED");
  }

  if (participants.size !== 2) {
    console.error(
      "[Telegram parser] expected exactly two participants",
      [...participants.keys()],
    );
    throw new Error("NOT_TWO_USERS");
  }

  const [usernameA, usernameB] = [...participants.values()];
  return {
    messages: messages.sort((a, b) => a.timestamp - b.timestamp),
    usernameA,
    usernameB,
  };
}

function parseTelegramMessage(
  item: JsonRecord,
  index: number,
): ParsedTelegramMessage | null {
  const kind = stringValue(item.type);
  if (kind !== "message" && kind !== "service") return null;

  const participant = telegramParticipant(item);
  const timestamp = telegramTimestamp(item);
  if (!participant || timestamp == null) return null;

  const baseId = `telegram-${stringValue(item.id) ?? index + 1}`;
  if (kind === "service") {
    const action = stringValue(item.action);
    const type = action === "phone_call" ? "call" : "system";
    const durationMs =
      type === "call" ? durationMilliseconds(item.duration_seconds) : null;
    return {
      participant,
      messages: [
        {
          id: baseId,
          timestamp,
          senderId: participant.id,
          senderName: participant.name,
          content: serviceContent(action, telegramText(item.text)),
          platform: "telegram",
          type,
          ...(durationMs != null ? { callDurationMs: durationMs } : {}),
        },
      ],
    };
  }

  const content = telegramText(item.text);
  const mediaTypes = telegramMediaTypes(item);
  if (!content && mediaTypes.length === 0) return null;

  const messages: ChatMessage[] = [];
  if (content) {
    messages.push({
      id: mediaTypes.length > 0 ? `${baseId}-text` : baseId,
      timestamp,
      senderId: participant.id,
      senderName: participant.name,
      content,
      platform: "telegram",
      type: "text",
    });
  }
  mediaTypes.forEach((type, mediaIndex) => {
    messages.push({
      id: mediaMessageId(
        baseId,
        content.length > 0,
        mediaTypes.length,
        mediaIndex,
      ),
      timestamp,
      senderId: participant.id,
      senderName: participant.name,
      content: type === "system" ? "File" : "",
      platform: "telegram",
      type,
    });
  });

  return { participant, messages };
}

function telegramParticipant(item: JsonRecord) {
  const id = stringValue(item.from_id) ?? stringValue(item.actor_id);
  const name = stringValue(item.from) ?? stringValue(item.actor);
  if (!id || !id.startsWith("user")) return null;
  return { id, name: name ?? id };
}

function telegramTimestamp(item: JsonRecord) {
  const unix = stringValue(item.date_unixtime);
  if (unix) {
    const seconds = Number(unix);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }

  const date = stringValue(item.date);
  if (!date) return null;
  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function telegramText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";

  return value
    .map((part) => {
      if (typeof part === "string") return part;
      return isRecord(part) ? stringValue(part.text) ?? "" : "";
    })
    .join("");
}

function telegramMediaTypes(item: JsonRecord): ChatMessage["type"][] {
  const mediaType = stringValue(item.media_type)?.toLowerCase();
  const types: ChatMessage["type"][] = [];
  const stickerCount = mediaCount(item.sticker);
  const photoCount = mediaCount(item.photo);
  const videoCount = mediaCount(item.video);

  if (stickerCount > 0) {
    addMediaTypes(types, "sticker", stickerCount);
  } else if (mediaType === "sticker") {
    addMediaTypes(types, "sticker", Math.max(1, mediaCount(item.file)));
  }

  if (photoCount > 0) {
    addMediaTypes(types, "image", photoCount);
  } else if (mediaType === "photo") {
    addMediaTypes(types, "image", 1);
  }

  if (videoCount > 0) {
    addMediaTypes(types, "video", videoCount);
  } else if (
    mediaType === "video" ||
    mediaType === "video_file" ||
    mediaType === "video_message" ||
    mediaType === "animation"
  ) {
    addMediaTypes(types, "video", 1);
  }

  if (types.length === 0) {
    addMediaTypes(types, "system", mediaCount(item.file));
  }
  return types;
}

function addMediaTypes(
  types: ChatMessage["type"][],
  type: ChatMessage["type"],
  count: number,
) {
  for (let index = 0; index < count; index += 1) types.push(type);
}

function mediaCount(value: unknown) {
  if (Array.isArray(value)) return value.filter(isMediaValue).length;
  return isMediaValue(value) ? 1 : 0;
}

function isMediaValue(value: unknown) {
  return value != null && value !== "";
}

function mediaMessageId(
  baseId: string,
  hasText: boolean,
  mediaCount: number,
  mediaIndex: number,
) {
  if (!hasText && mediaCount === 1) return baseId;
  if (mediaCount === 1) return `${baseId}-media`;
  return `${baseId}-media-${mediaIndex + 1}`;
}

function serviceContent(action: string | null, text: string) {
  if (text) return text;
  if (action === "phone_call") return "Phone call";
  if (action === "pin_message") return "Pinned message";
  return action?.replaceAll("_", " ") || "Telegram service";
}

function durationMilliseconds(value: unknown) {
  const seconds =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return seconds * 1000;
}

function stringValue(value: unknown) {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
