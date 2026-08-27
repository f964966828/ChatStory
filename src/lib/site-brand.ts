import { hostnameOf } from "@/lib/https-links";

export type SiteBrand =
  | "google"
  | "gmail"
  | "googledrive"
  | "googlemaps"
  | "googlemeet"
  | "googledocs"
  | "youtube"
  | "instagram"
  | "threads"
  | "facebook"
  | "messenger"
  | "line"
  | "x"
  | "tiktok"
  | "discord"
  | "whatsapp"
  | "telegram"
  | "reddit"
  | "pinterest"
  | "snapchat"
  | "github"
  | "spotify"
  | "netflix"
  | "twitch"
  | "bilibili"
  | "soundcloud"
  | "vimeo"
  | "apple"
  | "applemusic"
  | "appstore"
  | "shopee"
  | "notion"
  | "wikipedia"
  | "xiaohongshu"
  | "weibo"
  | "wechat"
  | "kakaotalk"
  | "plurk"
  | "pixiv"
  | "medium"
  | "figma"
  | "dropbox"
  | "zoom"
  | "uber"
  | "airbnb";

const LABELS: Record<SiteBrand, string> = {
  google: "Google",
  gmail: "Gmail",
  googledrive: "Google Drive",
  googlemaps: "Google Maps",
  googlemeet: "Google Meet",
  googledocs: "Google Docs",
  youtube: "YouTube",
  instagram: "Instagram",
  threads: "Threads",
  facebook: "Facebook",
  messenger: "Messenger",
  line: "LINE",
  x: "X",
  tiktok: "TikTok",
  discord: "Discord",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  reddit: "Reddit",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  github: "GitHub",
  spotify: "Spotify",
  netflix: "Netflix",
  twitch: "Twitch",
  bilibili: "Bilibili",
  soundcloud: "SoundCloud",
  vimeo: "Vimeo",
  apple: "Apple",
  applemusic: "Apple Music",
  appstore: "App Store",
  shopee: "Shopee",
  notion: "Notion",
  wikipedia: "Wikipedia",
  xiaohongshu: "Xiaohongshu",
  weibo: "Weibo",
  wechat: "WeChat",
  kakaotalk: "KakaoTalk",
  plurk: "Plurk",
  pixiv: "pixiv",
  medium: "Medium",
  figma: "Figma",
  dropbox: "Dropbox",
  zoom: "Zoom",
  uber: "Uber",
  airbnb: "Airbnb",
};

function hostMatches(host: string, root: string) {
  return host === root || host.endsWith(`.${root}`);
}

function isGoogleHost(host: string) {
  if (hostMatches(host, "google.com")) return true;
  if (/(^|\.)google\.com\.[a-z]{2}$/.test(host)) return true;
  if (/(^|\.)google\.co\.[a-z]{2}$/.test(host)) return true;
  return /(^|\.)google\.[a-z]{2}$/.test(host);
}

type Rule = {
  brand: SiteBrand;
  roots?: string[];
  exact?: string[];
  test?: (host: string) => boolean;
};

const RULES: Rule[] = [
  {
    brand: "youtube",
    roots: ["youtube.com", "youtube-nocookie.com"],
    exact: ["youtu.be"],
  },
  {
    brand: "gmail",
    roots: ["gmail.com"],
    test: (host) => host === "mail.google.com" || host.startsWith("mail.google."),
  },
  {
    brand: "googledrive",
    test: (host) => host === "drive.google.com" || host.startsWith("drive.google."),
  },
  {
    brand: "googlemaps",
    exact: ["maps.app.goo.gl"],
    test: (host) => host === "maps.google.com" || host.startsWith("maps.google."),
  },
  {
    brand: "googlemeet",
    test: (host) => host === "meet.google.com" || host.startsWith("meet.google."),
  },
  {
    brand: "googledocs",
    test: (host) => /^(docs|sheets|slides)\.google\./.test(host),
  },
  { brand: "instagram", roots: ["instagram.com"] },
  { brand: "threads", roots: ["threads.net", "threads.com"] },
  {
    brand: "messenger",
    roots: ["messenger.com"],
    exact: ["m.me"],
  },
  {
    brand: "facebook",
    roots: ["facebook.com", "fb.com"],
    exact: ["fb.me", "fb.watch"],
  },
  { brand: "line", roots: ["line.me"], exact: ["lin.ee"] },
  { brand: "x", roots: ["x.com", "twitter.com"], exact: ["t.co"] },
  { brand: "tiktok", roots: ["tiktok.com"] },
  {
    brand: "discord",
    roots: ["discord.com", "discordapp.com"],
    exact: ["discord.gg"],
  },
  { brand: "whatsapp", roots: ["whatsapp.com"], exact: ["wa.me"] },
  { brand: "telegram", roots: ["telegram.org", "telegram.me"], exact: ["t.me"] },
  { brand: "reddit", roots: ["reddit.com"], exact: ["redd.it"] },
  { brand: "pinterest", roots: ["pinterest.com"], exact: ["pin.it"] },
  { brand: "snapchat", roots: ["snapchat.com"] },
  { brand: "github", roots: ["github.com"] },
  {
    brand: "spotify",
    roots: ["spotify.com"],
    exact: ["spoti.fi", "spotify.link"],
  },
  { brand: "netflix", roots: ["netflix.com"] },
  { brand: "twitch", roots: ["twitch.tv"] },
  { brand: "bilibili", roots: ["bilibili.com"], exact: ["b23.tv"] },
  { brand: "soundcloud", roots: ["soundcloud.com"] },
  { brand: "vimeo", roots: ["vimeo.com"] },
  {
    brand: "applemusic",
    test: (host) => host === "music.apple.com" || host.startsWith("music.apple."),
  },
  {
    brand: "appstore",
    test: (host) =>
      host === "apps.apple.com" ||
      host === "itunes.apple.com" ||
      host.startsWith("apps.apple.") ||
      host.startsWith("itunes.apple."),
  },
  { brand: "apple", roots: ["apple.com"] },
  {
    brand: "shopee",
    test: (host) => host === "shopee.tw" || host.startsWith("shopee."),
  },
  { brand: "notion", roots: ["notion.so", "notion.site"] },
  { brand: "wikipedia", roots: ["wikipedia.org"] },
  {
    brand: "xiaohongshu",
    roots: ["xiaohongshu.com"],
    exact: ["xhslink.com"],
  },
  { brand: "weibo", roots: ["weibo.com", "weibo.cn"] },
  { brand: "wechat", roots: ["wechat.com"], exact: ["weixin.qq.com"] },
  { brand: "kakaotalk", roots: ["kakao.com", "kakaocorp.com"] },
  { brand: "plurk", roots: ["plurk.com"] },
  { brand: "pixiv", roots: ["pixiv.net"] },
  { brand: "medium", roots: ["medium.com"] },
  { brand: "figma", roots: ["figma.com"] },
  { brand: "dropbox", roots: ["dropbox.com"], exact: ["db.tt"] },
  { brand: "zoom", roots: ["zoom.us", "zoom.com"] },
  { brand: "uber", roots: ["uber.com", "ubereats.com"] },
  { brand: "airbnb", roots: ["airbnb.com"] },
  { brand: "google", test: isGoogleHost },
];

function matchesRule(host: string, rule: Rule) {
  if (rule.test?.(host)) return true;
  if (rule.roots?.some((root) => hostMatches(host, root))) return true;
  if (rule.exact?.includes(host)) return true;
  return false;
}

export function siteBrandOf(href: string): SiteBrand | null {
  const host = hostnameOf(href);
  if (!host) return null;
  for (const rule of RULES) {
    if (matchesRule(host, rule)) return rule.brand;
  }
  return null;
}

export function siteLabelOf(href: string) {
  const brand = siteBrandOf(href);
  if (brand) return LABELS[brand];
  return hostnameOf(href) || href;
}
