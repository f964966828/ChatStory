"use client";

import { useId } from "react";
import {
  siAirbnb,
  siApple,
  siApplemusic,
  siAppstore,
  siBilibili,
  siDiscord,
  siDropbox,
  siFacebook,
  siFigma,
  siGithub,
  siGmail,
  siGoogle,
  siGoogledocs,
  siGoogledrive,
  siGooglemaps,
  siGooglemeet,
  siInstagram,
  siKakaotalk,
  siLine,
  siMedium,
  siMessenger,
  siNetflix,
  siNotion,
  siPinterest,
  siPixiv,
  siPlurk,
  siReddit,
  siShopee,
  siSinaweibo,
  siSnapchat,
  siSoundcloud,
  siSpotify,
  siTelegram,
  siThreads,
  siTiktok,
  siTwitch,
  siUber,
  siVimeo,
  siWechat,
  siWhatsapp,
  siWikipedia,
  siX,
  siXiaohongshu,
  siYoutube,
  siZoom,
} from "simple-icons";
import type { SiteBrand } from "@/lib/site-brand";

const ICONS = {
  google: siGoogle,
  gmail: siGmail,
  googledrive: siGoogledrive,
  googlemaps: siGooglemaps,
  googlemeet: siGooglemeet,
  googledocs: siGoogledocs,
  youtube: siYoutube,
  threads: siThreads,
  facebook: siFacebook,
  line: siLine,
  x: siX,
  tiktok: siTiktok,
  discord: siDiscord,
  whatsapp: siWhatsapp,
  telegram: siTelegram,
  reddit: siReddit,
  pinterest: siPinterest,
  snapchat: siSnapchat,
  github: siGithub,
  spotify: siSpotify,
  netflix: siNetflix,
  twitch: siTwitch,
  bilibili: siBilibili,
  soundcloud: siSoundcloud,
  vimeo: siVimeo,
  apple: siApple,
  applemusic: siApplemusic,
  appstore: siAppstore,
  shopee: siShopee,
  notion: siNotion,
  wikipedia: siWikipedia,
  xiaohongshu: siXiaohongshu,
  weibo: siSinaweibo,
  wechat: siWechat,
  kakaotalk: siKakaotalk,
  plurk: siPlurk,
  pixiv: siPixiv,
  medium: siMedium,
  figma: siFigma,
  dropbox: siDropbox,
  zoom: siZoom,
  uber: siUber,
  airbnb: siAirbnb,
} as const;

export function SiteLogo({
  brand,
  size = 18,
}: {
  brand: SiteBrand;
  size?: number;
}) {
  const uid = useId();

  if (brand === "instagram") {
    const fill = `instagram-logo-${uid}`;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <radialGradient id={fill} cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <path d={siInstagram.path} fill={`url(#${fill})`} />
      </svg>
    );
  }

  if (brand === "messenger") {
    const fill = `messenger-logo-${uid}`;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id={fill} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00B2FF" />
            <stop offset="50%" stopColor="#A033FF" />
            <stop offset="100%" stopColor="#FF5280" />
          </linearGradient>
        </defs>
        <path d={siMessenger.path} fill={`url(#${fill})`} />
      </svg>
    );
  }

  const icon = ICONS[brand];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );
}
