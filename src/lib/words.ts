import type { ChatMessage } from "@/lib/chat-types";

export type WordCount = {
  word: string;
  count: number;
};

const WORD_LIMIT = 120;
const MAX_MESSAGE_CHARS = 2000;
const HTTPS_RE = /https:\/\/[^\s<>"'）】」』]+/gi;
const EMOJI_RE = /\p{Extended_Pictographic}/gu;
const CJK_RUN_RE = /[\u3400-\u9FFF\uF900-\uFAFF]+/g;
const LATIN_RE = /[A-Za-z][A-Za-z'-]{1,}/g;

const STOPWORDS = new Set([
  "的",
  "了",
  "是",
  "在",
  "有",
  "就",
  "都",
  "也",
  "和",
  "跟",
  "與",
  "及",
  "對",
  "把",
  "被",
  "讓",
  "給",
  "從",
  "到",
  "去",
  "來",
  "說",
  "嗎",
  "啊",
  "吧",
  "呢",
  "喔",
  "哦",
  "呀",
  "嘛",
  "嗯",
  "這",
  "那",
  "我",
  "你",
  "他",
  "她",
  "它",
  "我們",
  "你們",
  "他們",
  "自己",
  "什麼",
  "怎麼",
  "為什麼",
  "一個",
  "這個",
  "那個",
  "這樣",
  "那樣",
  "因為",
  "所以",
  "但是",
  "然後",
  "還是",
  "或是",
  "或者",
  "可以",
  "沒",
  "不",
  "要",
  "會",
  "能",
  "很",
  "太",
  "更",
  "最",
  "再",
  "才",
  "只",
  "還",
  "又",
  "已",
  "已經",
  "現在",
  "比較",
  "有點",
  "一下",
  "什麼",
  "如果",
  "的話",
  "就是",
  "還有",
  "而且",
  "其實",
  "覺得",
  "知道",
  "看到",
  "貼圖",
  "照片",
  "影片",
  "語音",
  "訊息",
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "to",
  "of",
  "in",
  "on",
  "for",
  "and",
  "or",
  "but",
  "if",
  "so",
  "not",
  "no",
  "do",
  "did",
  "does",
  "have",
  "has",
  "had",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "we",
  "they",
  "he",
  "she",
  "me",
  "my",
  "your",
  "our",
  "with",
  "at",
  "as",
  "from",
  "just",
  "like",
  "about",
  "what",
  "when",
  "how",
  "why",
  "can",
  "will",
  "would",
  "could",
  "should",
  "yeah",
  "yes",
  "oh",
  "um",
  "uh",
]);

let wordSegmenter: Intl.Segmenter | null | undefined;

function getWordSegmenter() {
  if (wordSegmenter !== undefined) return wordSegmenter;
  try {
    wordSegmenter = new Intl.Segmenter("zh", { granularity: "word" });
  } catch {
    wordSegmenter = null;
  }
  return wordSegmenter;
}

function normalizeToken(raw: string) {
  return raw.trim().replace(/(.)\1{2,}/gu, "$1$1");
}

function isCjk(token: string) {
  return /[\u3400-\u9FFF\uF900-\uFAFF]/u.test(token);
}

function keepToken(token: string) {
  if (!token || STOPWORDS.has(token)) return false;
  if (/^\d+$/.test(token)) return false;
  if (isCjk(token)) return token.length >= 2;
  return token.length >= 2;
}

function cjkTokens(run: string) {
  if (run.length < 2) return [] as string[];
  if (run.length === 2) return [run];
  const segmenter = getWordSegmenter();
  if (segmenter) {
    const parts: string[] = [];
    for (const item of segmenter.segment(run)) {
      if (item.isWordLike && item.segment.length >= 2) {
        parts.push(item.segment);
      }
    }
    if (parts.length) return parts;
  }
  const grams: string[] = [];
  for (let i = 0; i < run.length - 1; i += 1) {
    grams.push(run.slice(i, i + 2));
  }
  return grams;
}

export function tokenizeText(text: string) {
  const cleaned = text
    .replace(HTTPS_RE, " ")
    .replace(EMOJI_RE, " ");
  const tokens: string[] = [];
  for (const match of cleaned.matchAll(LATIN_RE)) {
    tokens.push(match[0].toLowerCase());
  }
  for (const match of cleaned.matchAll(CJK_RUN_RE)) {
    tokens.push(...cjkTokens(match[0]));
  }
  return tokens;
}

function rankWords(counts: Map<string, number>): WordCount[] {
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, "zh"))
    .slice(0, WORD_LIMIT);
}

function addTextWords(counts: Map<string, number>, content: string) {
  const text = content.slice(0, MAX_MESSAGE_CHARS);
  HTTPS_RE.lastIndex = 0;
  EMOJI_RE.lastIndex = 0;
  for (const raw of tokenizeText(text)) {
    const token = normalizeToken(raw);
    if (!keepToken(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
}

function addMessageWords(
  counts: Map<string, number>,
  message: ChatMessage,
  senderName?: string | null,
) {
  if (message.type !== "text") return;
  if (message.senderName === "system") return;
  if (senderName && message.senderName !== senderName) return;
  addTextWords(counts, message.content);
}

export function countMessageWords(
  messages: ChatMessage[],
  senderName?: string | null,
): WordCount[] {
  const counts = new Map<string, number>();
  for (const message of messages) {
    addMessageWords(counts, message, senderName);
  }
  return rankWords(counts);
}

function yieldToUi() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

const COUNT_BUDGET_MS = 48;

export async function countMessageWordsProgress(
  messages: ChatMessage[],
  senderName: string | null | undefined,
  onProgress?: (ratio: number) => void,
): Promise<WordCount[]> {
  const mine = senderName
    ? messages.filter(
        (message) =>
          message.type === "text" &&
          message.senderName !== "system" &&
          message.senderName === senderName,
      )
    : [];
  const counts = new Map<string, number>();
  const total = Math.max(mine.length, 1);
  let lastYield = performance.now();

  for (let i = 0; i < mine.length; i += 1) {
    addTextWords(counts, mine[i].content);
    const now = performance.now();
    if (now - lastYield >= COUNT_BUDGET_MS || i === mine.length - 1) {
      onProgress?.((i + 1) / total);
      await yieldToUi();
      lastYield = performance.now();
    }
  }

  if (mine.length === 0) onProgress?.(1);
  return rankWords(counts);
}
