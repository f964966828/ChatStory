import type { Locale } from "@/lib/messages";

export type LineGuideCopy = {
  needTitle: string;
  needItems: string[];
  phoneTitle: string;
  phoneSteps: string[];
  saveTitle: string;
  saveBody: string;
  pcTitle: string;
  pcNote: string;
  officialHref: string;
};

export const LINE_GUIDE: Record<Locale, LineGuideCopy> = {
  zh: {
    needTitle: "開始前",
    needItems: [
      "目前只支援兩人聊天室，群組還不能分析。",
      "檔案會留在你的裝置上解析，不會上傳到伺服器。",
    ],
    phoneTitle: "手機（iPhone / Android）",
    phoneSteps: [
      "打開要分析的兩人聊天室。",
      "點聊天室右上角的選單（≡ 或 ⋮），再點「設定」。",
      "點「傳送聊天記錄」。",
      "選擇儲存或分享檔案的方式，例如「檔案」、郵件或雲端空間。",
      "回到這個網站，把得到的 .txt 拖進首頁，或點選匯入。",
    ],
    saveTitle: "檔案要存哪裡？",
    saveBody:
      "iPhone 可存到「檔案」App；Android 可存到下載資料夾或雲端。只要最後拿到副檔名是 .txt 的文字檔即可。檔案名稱通常會像「[LINE] 與小明的聊天.txt」。",
    pcTitle: "電腦版 LINE（Windows / Mac）",
    pcNote:
      "根據官方文檔，電腦版也能匯出檔案。但目前有一些已知問題，格式錯誤會導致解析失敗。建議一律用手機匯出 .txt 再匯入。",
    officialHref:
      "https://help.line.me/line/smartphone/sp?contentId=20007388&lang=zh-Hant",
  },
  en: {
    needTitle: "Before you start",
    needItems: [
      "Only 1-on-1 chats are supported. Group chats can’t be analyzed yet.",
      "The file is parsed on your device and is not uploaded to a server.",
    ],
    phoneTitle: "Phone (iPhone / Android)",
    phoneSteps: [
      "Open the 1-on-1 chat you want to analyze.",
      "Tap the menu at the top right (≡ or ⋮), then tap Settings.",
      "Tap Export chat history.",
      "Choose how to save or share the file, such as Files, email, or cloud storage.",
      "Come back here and drop the .txt on the home page, or choose it to import.",
    ],
    saveTitle: "Where should the file go?",
    saveBody:
      "On iPhone, save it to the Files app. On Android, save it to Downloads or cloud storage. You just need a .txt file. The name is often like “[LINE] Chat with Ming.txt”.",
    pcTitle: "LINE for Windows / Mac",
    pcNote:
      "Official docs say desktop LINE can also export a file. There are known issues though: the format is often wrong and parsing fails. We recommend exporting a .txt from your phone and importing that.",
    officialHref:
      "https://help.line.me/line/smartphone/pc?lang=en&contentId=20007388",
  },
};

export type MetaGuideCopy = {
  needTitle: string;
  needItems: string[];
  exportTitle: string;
  exportStartSteps: string[];
  exportOptionsTitle: string;
  exportOptions: string[];
  exportEndSteps: string[];
  fileTitle: string;
  fileLead: string;
  fileChatFolder: string;
  fileFindTitle: string;
  fileFindItems: string[];
  pinyinTitle: string;
  pinyinLead: string;
  pinyinResult: string;
  pinyinFolder: string;
  noticeTitle: string;
  noticeItems: string[];
  officialHref: string;
};

export const META_GUIDE: Record<Locale, MetaGuideCopy> = {
  zh: {
    needTitle: "開始前",
    needItems: [
      "目前只支援兩人聊天室，群組還不能分析。",
      "檔案會留在你的裝置上解析，不會上傳到伺服器。",
      "請匯出 JSON。HTML 檔沒辦法用。",
      "因為 Meta 平台不允許只下載單個聊天室的資料，所以只能一次下載所有的，再挑出你想分析的那個人的聊天資料。",
    ],
    exportTitle: "從帳號管理中心匯出",
    exportStartSteps: [
      "打開 Messenger / Instagram / Threads。",
      "「設定」→「帳號管理中心」→「你的資訊和權限」→「匯出你的資訊」。",
      "點「建立匯出檔案」，選擇 Messenger、Instagram 或 Threads 的個人檔案。",
      "選「匯出到裝置」。",
    ],
    exportOptionsTitle: "特別注意",
    exportOptions: [
      "資料類型只勾「訊息」，其他全部取消勾選。",
      "時間範圍可選「所有時間」，或自訂較短的區間，下載會快一點。",
      "格式選 JSON。請注意選對，選到 HTML 就要重新下載。",
      "媒體畫質選低；這裡不會用到圖片，但 Meta 一定要一次整包下載。",
    ],
    exportEndSteps: [
      "點「開始匯出」。檔案好了會寄信，可能要等幾分鐘到幾天。",
      "下載 ZIP，解壓縮後把該聊天室的 .json 匯入這個網站。",
    ],
    fileTitle: "要匯入哪個檔案？",
    fileLead:
      "下載的是一整包 ZIP，請先解壓縮。整個 ZIP 沒辦法直接丟進網站。解壓縮後，聊天紀錄通常在 messages → inbox 裡；外層資料夾名稱可能略有不同。",
    fileChatFolder: "聊天室資料夾",
    fileFindTitle: "怎麼從聊天室名稱找到檔案",
    fileFindItems: [
      "inbox 裡每一個資料夾就是一個聊天室。",
      "中文名字會轉成拼音，後面再加一串數字。例如跟「許光漢」的對話，資料夾可能叫 xuguanghan_123456789。可用下面的工具把名字轉成拼音再搜。",
      "英文名字會變小寫，並把空白換成底線。例如跟「Greg Hsu」的對話，資料夾可能叫 greg_hsu_123456789。",
      "若 inbox 找不到，再看同層的 archived_threads（封存）或 message_requests（訊息邀請）。",
      "打開該資料夾，匯入裡面的 message_1.json。長對話可能還有 message_2.json。",
    ],
    pinyinTitle: "中文名字轉拼音",
    pinyinLead:
      "輸入對方在聊天室顯示的中文名字，會轉成資料夾名稱用的拼音。後面通常還會再接一串數字。",
    pinyinResult: "資料名稱是",
    pinyinFolder: "{slug}_（數字）",
    noticeTitle: "手機也可以申請資料，但下載建議用電腦操作",
    noticeItems: [
      "手機 App 的設定也能走進帳號管理中心。",
      "但下載和解壓縮用電腦比較好，我沒用過手機解壓縮但感覺不好處理。",
    ],
    officialHref:
      "https://www.facebook.com/help/212802592074644?locale=zh_TW",
  },
  en: {
    needTitle: "Before you start",
    needItems: [
      "Only 1-on-1 chats are supported. Group chats can’t be analyzed yet.",
      "The file is parsed on your device and is not uploaded to a server.",
      "Export JSON. HTML files won’t work.",
      "Meta doesn’t let you download a single chat, so you have to download everything, then pick the person you want to analyze.",
    ],
    exportTitle: "Export from Accounts Center",
    exportStartSteps: [
      "Open Messenger, Instagram, or Threads.",
      "Settings → Accounts Center → Your information and permissions → Export your information.",
      "Click Create export, then choose your Messenger, Instagram, or Threads profile.",
      "Choose Export to device.",
    ],
    exportOptionsTitle: "Pay special attention",
    exportOptions: [
      "Check only Messages. Uncheck every other data type.",
      "Date range can be All time, or a custom range if you want a faster download.",
      "Set the format to JSON. Pick this carefully—if you choose HTML, you’ll have to download everything again.",
      "Pick low media quality. This site doesn’t use photos, but Meta still makes you download the whole package.",
    ],
    exportEndSteps: [
      "Click Start export. You’ll get an email when it’s ready—this can take minutes to a few days.",
      "Download the ZIP, unzip it, and import that chat’s .json file on this site.",
    ],
    fileTitle: "Which file should I import?",
    fileLead:
      "The download is a ZIP. Unzip it first. Don’t drop the whole ZIP on this site. After unzipping, chats are usually under messages → inbox. The outer folder names may vary a little.",
    fileChatFolder: "chat folder",
    fileFindTitle: "How to find the file from the chat name",
    fileFindItems: [
      "Each folder inside inbox is one chat.",
      "Chinese names become pinyin, then a string of numbers is added. A chat with 許光漢 might be xuguanghan_123456789. Use the converter below, then search for that pinyin.",
      "English names become lowercase, and spaces become underscores. A chat with “Greg Hsu” might be greg_hsu_123456789.",
      "If it isn’t in inbox, check archived_threads or message_requests in the same folder.",
      "Open that folder and import message_1.json. Long chats may also have message_2.json.",
    ],
    pinyinTitle: "Convert a Chinese name to pinyin",
    pinyinLead:
      "Type the Chinese name you see in the chat. You’ll get the pinyin used in the folder name. A string of numbers is usually added after it.",
    pinyinResult: "The name is",
    pinyinFolder: "{slug}_(numbers)",
    noticeTitle: "You can request the data on your phone, but download it on a computer",
    noticeItems: [
      "App settings can also open Accounts Center.",
      "Downloading and unzipping is easier on a computer. I haven’t tried unzipping on a phone, but it doesn’t seem easy to handle.",
    ],
    officialHref: "https://www.facebook.com/help/212802592074644",
  },
};
