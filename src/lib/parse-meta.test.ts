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

const RAW_META_AUDIO_FILE = `{
  "participants": [
    { "name": "Alex" },
    { "name": "Blake" }
  ],
  "messages": [
    {
      "sender_name": "Alex",
      "timestamp_ms": 1700000001000,
      "audio_files": [
        {
          "uri": "your_instagram_activity/messages/inbox/fakeuser_000/audio/000000000000000.mp4",
          "creation_timestamp": 1700000001
        }
      ],
      "is_geoblocked_for_viewer": false,
      "is_unsent_image_by_messenger_kid_parent": false
    }
  ]
}`;

const RAW_META_PHOTOS_AND_VIDEO = `{
  "participants": [
    { "name": "Alex" },
    { "name": "Blake" }
  ],
  "messages": [
    {
      "sender_name": "Blake",
      "timestamp_ms": 1700000002000,
      "photos": [
        {
          "uri": "your_instagram_activity/messages/inbox/fakeuser_000/photos/111.jpg",
          "creation_timestamp": 1700000002
        },
        {
          "uri": "your_instagram_activity/messages/inbox/fakeuser_000/photos/222.jpg",
          "creation_timestamp": 1700000002
        }
      ],
      "videos": [
        {
          "uri": "your_instagram_activity/messages/inbox/fakeuser_000/videos/333.mp4",
          "creation_timestamp": 1700000002
        }
      ],
      "is_geoblocked_for_viewer": false,
      "is_unsent_image_by_messenger_kid_parent": false
    }
  ]
}`;

const RAW_META_SHARE_LINK = `{
  "participants": [
    { "name": "Alex" },
    { "name": "Blake" }
  ],
  "messages": [
    {
      "sender_name": "Blake",
      "timestamp_ms": 1700000003000,
      "content": "sent 1 attachment.",
      "share": {
        "link": "https://www.instagram.com/reel/fakeid/",
        "share_text": "a fake caption",
        "original_content_owner": "fake_owner"
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
      content: "https://media.example.com/media/fake-id/200.gif",
      senderName: "Alex",
    });
  });

  it("treats audio_files as a video", () => {
    const chat = parseMetaChat(RAW_META_AUDIO_FILE);

    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]).toMatchObject({
      type: "video",
      content: "",
      senderName: "Alex",
    });
  });

  it("counts each photo and video in a mixed album", () => {
    const chat = parseMetaChat(RAW_META_PHOTOS_AND_VIDEO);

    expect(chat.messages).toHaveLength(3);
    expect(chat.messages.map((message) => message.type)).toEqual([
      "image",
      "image",
      "video",
    ]);
    expect(chat.messages[0]).toMatchObject({
      type: "image",
      content: "",
      senderName: "Blake",
    });
    expect(chat.messages[2]).toMatchObject({
      type: "video",
      content: "",
      senderName: "Blake",
    });
  });

  it("uses the share link as content", () => {
    const chat = parseMetaChat(RAW_META_SHARE_LINK);

    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]).toMatchObject({
      type: "text",
      content: "https://www.instagram.com/reel/fakeid/",
      senderName: "Blake",
    });
  });
});
