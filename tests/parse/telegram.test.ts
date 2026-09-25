import { describe, expect, it } from "vitest";
import { parseTelegramChat } from "@/lib/parse";

const RAW_TELEGRAM = JSON.stringify({
  messages: [
    {
      id: 3,
      type: "service",
      date: "2025-05-30T02:05:48",
      date_unixtime: "1748541948",
      actor: "Sirius Koan",
      actor_id: "user-a",
      action: "phone_call",
      duration_seconds: 8,
      text: "",
    },
    {
      id: 4,
      type: "message",
      date_unixtime: "1748542000",
      from: "ymlai",
      from_id: "user-b",
      text: ["看這個 ", { type: "link", text: "https://example.com" }],
      photo: "photos/example.jpg",
    },
    {
      id: 1,
      type: "message",
      date_unixtime: "1748541000",
      from: "Sirius Koan",
      from_id: "user-a",
      text: "早安",
      media_type: "sticker",
      file: "stickers/example.webp",
    },
    {
      id: 5,
      type: "message",
      date_unixtime: "1748542100",
      from: "ymlai",
      from_id: "user-b",
      text: "",
      file: "documents/example.pdf",
    },
    {
      id: 6,
      type: "service",
      date_unixtime: "1748542200",
      actor: "ymlai",
      actor_id: "user-b",
      action: "pin_message",
      text: "",
    },
  ],
});

describe("parseTelegramChat", () => {
  it("parses the Telegram Desktop message shapes", () => {
    const chat = parseTelegramChat(RAW_TELEGRAM);

    expect(chat).toMatchObject({
      usernameA: "Sirius Koan",
      usernameB: "ymlai",
    });
    expect(chat.messages).toHaveLength(7);
    expect(chat.messages.map((message) => message.type)).toEqual([
      "text",
      "sticker",
      "call",
      "text",
      "image",
      "system",
      "system",
    ]);
    expect(chat.messages[0]).toMatchObject({
      id: "telegram-1-text",
      content: "早安",
      senderId: "user-a",
    });
    expect(chat.messages[2]).toMatchObject({
      id: "telegram-3",
      type: "call",
      content: "Phone call",
      callDurationMs: 8_000,
    });
    expect(chat.messages[3]).toMatchObject({
      content: "看這個 https://example.com",
      senderName: "ymlai",
    });
    expect(chat.messages[4]).toMatchObject({
      type: "image",
      content: "",
      senderName: "ymlai",
    });
    expect(chat.messages[5]).toMatchObject({
      type: "system",
      content: "File",
    });
  });

  it("expands multiple photo and video attachments from one message", () => {
    const raw = JSON.stringify({
      messages: [
        {
          id: 9,
          type: "message",
          date_unixtime: "100",
          from: "A",
          from_id: "user-a",
          text: "album",
          photo: ["photos/1.jpg", "photos/2.jpg"],
          video: ["videos/1.mp4"],
        },
        {
          id: 10,
          type: "message",
          date_unixtime: "101",
          from: "B",
          from_id: "user-b",
          text: "reply",
        },
      ],
    });

    const chat = parseTelegramChat(raw);

    expect(chat.messages.map((message) => message.type)).toEqual([
      "text",
      "image",
      "image",
      "video",
      "text",
    ]);
    expect(chat.messages.slice(0, 4).map((message) => message.id)).toEqual([
      "telegram-9-text",
      "telegram-9-media-1",
      "telegram-9-media-2",
      "telegram-9-media-3",
    ]);
  });

  it("ignores channel records when selecting participants", () => {
    const raw = JSON.stringify({
      messages: [
        {
          id: 1,
          type: "message",
          date_unixtime: "1",
          from: "A",
          from_id: "user-a",
          text: "hello",
        },
        {
          id: 2,
          type: "message",
          date_unixtime: "2",
          from: "Channel",
          from_id: "channel1890746481",
          text: "announcement",
        },
        {
          id: 3,
          type: "message",
          date_unixtime: "3",
          from: "B",
          from_id: "user-b",
          text: "reply",
        },
      ],
    });

    expect(parseTelegramChat(raw)).toMatchObject({
      usernameA: "A",
      usernameB: "B",
      messages: [
        { senderId: "user-a", content: "hello" },
        { senderId: "user-b", content: "reply" },
      ],
    });
  });

  it("rejects exports with anything other than two participants", () => {
    const raw = JSON.stringify({
      messages: [
        { id: 1, type: "message", date_unixtime: "1", from: "A", from_id: "user-a", text: "a" },
        { id: 2, type: "message", date_unixtime: "2", from: "B", from_id: "user-b", text: "b" },
        { id: 3, type: "message", date_unixtime: "3", from: "C", from_id: "user-c", text: "c" },
      ],
    });

    expect(() => parseTelegramChat(raw)).toThrow("NOT_TWO_USERS");
  });

  it.each(["not json", "{}", "[]"])("rejects malformed export %s", (raw) => {
    expect(() => parseTelegramChat(raw)).toThrow("PARSE_FAILED");
  });
});
