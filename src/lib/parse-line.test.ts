import { describe, expect, it } from "vitest";
import { parseLineChat } from "./parse-line";

function lineExport(time: string) {
  return [
    "[LINE] 與User B的聊天記錄",
    "儲存日期：2026/8/28 13:46",
    "",
    "2024/11/8（週五）",
    `${time}\tUser B\t你好`,
    `${time}\tUser A\t收到`,
  ].join("\n");
}

describe("parseLineChat", () => {
  it.each([
    ["00:00", 0, 0],
    ["08:32", 8, 32],
    ["12:00", 12, 0],
    ["16:16", 16, 16],
    ["23:59", 23, 59],
  ])("imports valid 24-hour timestamps such as %s", (time, hour, minute) => {
    const chat = parseLineChat(lineExport(time));

    expect(chat).toMatchObject({
      usernameA: "User A",
      usernameB: "User B",
    });
    expect(chat.messages).toHaveLength(2);
    expect(new Date(chat.messages[0].timestamp).getHours()).toBe(hour);
    expect(new Date(chat.messages[0].timestamp).getMinutes()).toBe(minute);
  });

  it.each(["24:00", "12:60"])("rejects invalid 24-hour timestamp %s", (time) => {
    expect(() => parseLineChat(lineExport(time))).toThrow("PARSE_FAILED");
  });

  it.each([
    ["上午 8:32", 8],
    ["下午 4:16", 16],
    ["08:32 AM", 8],
    ["04:16 PM", 16],
  ])("preserves existing AM/PM timestamp %s", (time, hour) => {
    const chat = parseLineChat(lineExport(time));

    expect(new Date(chat.messages[0].timestamp).getHours()).toBe(hour);
  });
});
