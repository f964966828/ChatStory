import { describe, expect, it } from "vitest";
import { parseMetaChat } from "./parse-meta";

const RAW_META_GIF_SHARE = `{
  "participants": [
    { "name": "Alex" },
    { "name": "Blake" }
  ],
  "messages": [
    {
      "sender_name": "Alex",
      "timestamp_ms": 1700000000000,
      "share": {
        "link": "https://media.example.com/media/fake-id/200.gif",
        "original_content_owner": "gif_owner"
      },
      "is_geoblocked_for_viewer": false,
      "is_unsent_image_by_messenger_kid_parent": false
    }
  ]
}`;

describe("parseMetaChat", () => {
  it("treats a shared .gif as a sticker", () => {
    const chat = parseMetaChat(RAW_META_GIF_SHARE);

    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]).toMatchObject({
      type: "sticker",
      content: "",
      senderName: "Alex",
    });
  });
});
