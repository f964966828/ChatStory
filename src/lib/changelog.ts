export type ChangelogEntry = {
  date: string;
  zh: string[];
  en: string[];
};

export const CHANGELOG_PAGE_SIZE = 5;

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026/08/28",
    zh: [
      "修正 LINE 無法讀取 24 小時制聊天紀錄。",
      "實作 Meta json 檔 parser (支援中英文)。",
      "新增匯入檔案確認畫面。",
      "正式上線。",
    ],
    en: [
      "Fixed LINE imports that use 24-hour timestamps.",
      "Added a Meta JSON file parser (Chinese and English).",
      "Added an import confirmation screen.",
      "Launched the site.",
    ],
  },
  {
    date: "2026/08/26",
    zh: [
      "新增 Meta 匯入指引。",
      "優化圖表互動。",
    ],
    en: [
      "Added a Meta import guide.",
      "Improved chart interactions.",
    ],
  },
  {
    date: "2026/08/23",
    zh: [
      "新增文字雲。",
      "聊天室瀏覽網址改為可點擊的小卡。",
      "新增更新日誌分頁。",
    ],
    en: [
      "Added a word cloud.",
      "Turned chat URLs into tappable link cards.",
      "Added changelog pagination.",
    ],
  },
  {
    date: "2026/08/19",
    zh: [
      "新增側邊聊天室瀏覽。",
      "新增 LINE 匯入指引。",
      "修正 LINE parser 無法處理跨行訊息問題。",
    ],
    en: [
      "Added a side chat panel for browsing messages.",
      "Added a LINE import guide.",
      "Fixed the LINE parser dropping multi-line messages.",
    ],
  },
  {
    date: "2026/08/15",
    zh: [
      "新增儀表板分享功能。",
      "優化儀表板畫面配置。",
      "訊息量比較改為圓餅圖搭配表格。",
    ],
    en: [
      "Added dashboard sharing.",
      "Improved the dashboard layout.",
      "Redesigned the message comparison with a donut chart and table.",
    ],
  },
  {
    date: "2026/08/10",
    zh: [
      "優化 heatmap 互動動畫。",
      "實作 LINE 文字檔 parser（支援中英文）。",
      "新增訊息量統計，支援每週／每月／每年。",
    ],
    en: [
      "Improved heatmap interaction and animation.",
      "Added a LINE text-file parser (Chinese and English).",
      "Added message volume stats by week, month, and year.",
    ],
  },
  {
    date: "2026/08/5",
    zh: ["新增語言切換功能。", "新增常見問題。"],
    en: ["Added language switching.", "Added a Q&A section."],
  },
  {
    date: "2026/07/29",
    zh: ["完成初版首頁及儀表板。"],
    en: ["Shipped the first version of the homepage and dashboard."],
  },
];
