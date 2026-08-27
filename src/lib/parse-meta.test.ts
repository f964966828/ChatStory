import { describe, expect, it } from "vitest";
import { parseMetaChat } from "./parse-meta";

const RAW_META_GIF_SHARE = `{
  "participants": [
    { "name": "userA" },
    { "name": "userB" }
  ],
  "messages": [
    {
      "sender_name": "userA",
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
    { "name": "userA" },
    { "name": "userB" }
  ],
  "messages": [
    {
      "sender_name": "userA",
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
    { "name": "userA" },
    { "name": "userB" }
  ],
  "messages": [
    {
      "sender_name": "userB",
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
    { "name": "userA" },
    { "name": "userB" }
  ],
  "messages": [
    {
      "sender_name": "userB",
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

const RAW_META_ATTACHMENT_PLACEHOLDER = `{
  "participants": [
    { "name": "userA" },
    { "name": "userB" }
  ],
  "messages": [
    {
      "sender_name": "userB",
      "timestamp_ms": 1700000004000,
      "content": "Instagram 用戶傳送了 1 份附件。",
      "is_geoblocked_for_viewer": false,
      "is_unsent_image_by_messenger_kid_parent": false
    }
  ]
}`;

const RAW_META_CONTENT_AND_PHOTO = `{
  "participants": [
    { "name": "userA" },
    { "name": "userB" }
  ],
  "messages": [
    {
      "sender_name": "userA",
      "timestamp_ms": 1700000005000,
      "content": "look at this",
      "photos": [
        {
          "uri": "your_instagram_activity/messages/inbox/fakeuser_000/photos/444.jpg",
          "creation_timestamp": 1700000005
        }
      ],
      "is_geoblocked_for_viewer": false,
      "is_unsent_image_by_messenger_kid_parent": false
    }
  ]
}`;

const RAW_META_SYSTEM_NOTICES = `{
  "participants": [
    { "name": "userA" },
    { "name": "userB" }
  ],
  "messages": [
    {
      "sender_name": "userB",
      "timestamp_ms": 1700000006000,
      "content": "Reacted 😡 to your message "
    },
    {
      "sender_name": "userA",
      "timestamp_ms": 1700000007000,
      "content": "You started an audio call"
    },
    {
      "sender_name": "userA",
      "timestamp_ms": 1700000008000,
      "content": "Audio call ended",
      "call_duration": 0
    },
    {
      "sender_name": "userA",
      "timestamp_ms": 1700000009000,
      "content": "You changed the theme to Non-Binary"
    },
    {
      "sender_name": "userB",
      "timestamp_ms": 1700000010000,
      "content": "Liked a message"
    },
    {
      "sender_name": "userB",
      "timestamp_ms": 1700000010500,
      "content": "userB started an audio call"
    }
  ]
}`;

const RAW_META_EMPTY_SHELL = `{
  "participants": [
    { "name": "userA" },
    { "name": "userB" }
  ],
  "messages": [
    {
      "sender_name": "userA",
      "timestamp_ms": 1700000011000,
      "content": "hello"
    },
    {
      "sender_name": "userB",
      "timestamp_ms": 1700000012000,
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
      senderName: "userA",
    });
  });

  it("treats audio_files as a video", () => {
    const chat = parseMetaChat(RAW_META_AUDIO_FILE);

    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]).toMatchObject({
      type: "video",
      content: "",
      senderName: "userA",
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
      senderName: "userB",
    });
    expect(chat.messages[2]).toMatchObject({
      type: "video",
      content: "",
      senderName: "userB",
    });
  });

  it("uses the share link as content", () => {
    const chat = parseMetaChat(RAW_META_SHARE_LINK);

    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]).toMatchObject({
      type: "text",
      content: "https://www.instagram.com/reel/fakeid/",
      senderName: "userB",
    });
  });

  it("treats attachment placeholders as other", () => {
    const chat = parseMetaChat(RAW_META_ATTACHMENT_PLACEHOLDER);

    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]).toMatchObject({
      type: "other",
      content: "Instagram 用戶傳送了 1 份附件。",
      senderName: "userB",
    });
  });

  it("keeps caption text and the photo as separate messages", () => {
    const chat = parseMetaChat(RAW_META_CONTENT_AND_PHOTO);

    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[0]).toMatchObject({
      type: "text",
      content: "look at this",
      senderName: "userA",
    });
    expect(chat.messages[1]).toMatchObject({
      type: "image",
      content: "",
      senderName: "userA",
    });
  });

  it("treats reactions and started-call notices as other", () => {
    const chat = parseMetaChat(RAW_META_SYSTEM_NOTICES);

    expect(chat.messages).toHaveLength(6);
    expect(chat.messages[0]).toMatchObject({
      type: "other",
      content: "Reacted 😡 to your message ",
      senderName: "userB",
    });
    expect(chat.messages[1]).toMatchObject({
      type: "other",
      content: "You started an audio call",
      senderName: "userA",
    });
    expect(chat.messages[2]).toMatchObject({
      type: "call",
      content: "Audio call ended",
      senderName: "userA",
      callDurationMs: 0,
    });
    expect(chat.messages[3]).toMatchObject({
      type: "other",
      content: "You changed the theme to Non-Binary",
      senderName: "userA",
    });
    expect(chat.messages[4]).toMatchObject({
      type: "other",
      content: "Liked a message",
      senderName: "userB",
    });
    expect(chat.messages[5]).toMatchObject({
      type: "other",
      content: "userB started an audio call",
      senderName: "userB",
    });
  });

  it("drops empty shell messages", () => {
    const chat = parseMetaChat(RAW_META_EMPTY_SHELL);

    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]).toMatchObject({
      type: "text",
      content: "hello",
      senderName: "userA",
    });
  });
});
