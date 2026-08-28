import { describe, expect, it } from "vitest";
import { parseLineChat } from "./parse-line";

const LINE_24H = `[LINE] 與 userB 的聊天紀錄
儲存日期： 2026/08/28 14:00

2026/08/28（五）
00:05	userA	hello
13:45	userB	hi
23:59	userA	bye
`;

const LINE_ZH_12H = `[LINE] 與 userB 的聊天紀錄
儲存日期： 2026/08/28 14:00

2026/08/28（五）
上午11:05	userA	hello
下午1:45	userB	hi
`;

const LINE_EN_12H = `[LINE] Chat history with userB
Saved on: 2026/08/28 14:00

Fri, 08/28/2026
11:05 AM	userA	hello
1:45 PM	userB	hi
`;

describe("parseLineChat", () => {
  it("parses 24-hour timestamps", () => {
    const chat = parseLineChat(LINE_24H);

    expect(chat.messages).toHaveLength(3);
    expect(chat.messages.map((message) => message.content)).toEqual([
      "hello",
      "hi",
      "bye",
    ]);
    expect(new Date(chat.messages[0].timestamp).getHours()).toBe(0);
    expect(new Date(chat.messages[0].timestamp).getMinutes()).toBe(5);
    expect(new Date(chat.messages[1].timestamp).getHours()).toBe(13);
    expect(new Date(chat.messages[1].timestamp).getMinutes()).toBe(45);
    expect(new Date(chat.messages[2].timestamp).getHours()).toBe(23);
    expect(new Date(chat.messages[2].timestamp).getMinutes()).toBe(59);
  });

  it("still parses Chinese 12-hour timestamps", () => {
    const chat = parseLineChat(LINE_ZH_12H);

    expect(chat.messages).toHaveLength(2);
    expect(new Date(chat.messages[0].timestamp).getHours()).toBe(11);
    expect(new Date(chat.messages[1].timestamp).getHours()).toBe(13);
  });

  it("still parses English 12-hour timestamps", () => {
    const chat = parseLineChat(LINE_EN_12H);

    expect(chat.messages).toHaveLength(2);
    expect(new Date(chat.messages[0].timestamp).getHours()).toBe(11);
    expect(new Date(chat.messages[1].timestamp).getHours()).toBe(13);
  });
});
