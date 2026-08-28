import { Providers } from "@/components/Providers";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC, Nunito, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const notoSans = Noto_Sans_TC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const titleFont = Zen_Maru_Gothic({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  preload: false,
});

const siteUrl =
  process.env.GITHUB_PAGES === "true"
    ? "https://f964966828.github.io"
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ChatStory",
  description: "把聊天紀錄變成可以翻看的小故事",
  openGraph: {
    title: "ChatStory",
    description: "把聊天紀錄變成可以翻看的小故事",
    type: "website",
    locale: "zh_TW",
    siteName: "ChatStory",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatStory",
    description: "把聊天紀錄變成可以翻看的小故事",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f2fc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${nunito.variable} ${notoSans.variable} ${titleFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers initialLocale="zh">{children}</Providers>
      </body>
    </html>
  );
}
