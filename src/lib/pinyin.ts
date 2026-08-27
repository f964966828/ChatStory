import pinyin from "tiny-pinyin";

const LATIN = /[A-Za-z0-9]/;

/**
 * Convert a chat display name to the pinyin-style slug Meta uses in folder names.
 * Chinese characters become lowercase, toneless pinyin with no separators.
 * "許光漢" → "xuguanghan"
 */
export function toPinyinSlug(text: string): string {
  const input = text.trim();
  if (!input) return "";
  if (!pinyin.isSupported()) return slugifyAscii(input);

  const parts: string[] = [];
  let latin = "";
  let han = "";

  for (const token of pinyin.parse(input)) {
    if (token.type === 2) {
      flushLatin();
      han += token.target.toLowerCase();
      continue;
    }
    if (token.type === 1 && LATIN.test(token.source)) {
      flushHan();
      latin += token.source;
      continue;
    }
    flushLatin();
    flushHan();
  }
  flushLatin();
  flushHan();

  return parts.join("_");

  function flushLatin() {
    const chunk = latin.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
    latin = "";
    if (chunk) parts.push(chunk);
  }

  function flushHan() {
    if (!han) return;
    parts.push(han);
    han = "";
  }
}

function slugifyAscii(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
