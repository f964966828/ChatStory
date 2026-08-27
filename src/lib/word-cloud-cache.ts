export type CachedPlacedWord = {
  word: string;
  count: number;
  x: number;
  y: number;
  fontSize: number;
  width: number;
  height: number;
  color: string;
  z: number;
};

export type WordCloudCacheEntry = {
  wordsKey: string;
  width: number;
  height: number;
  initial: CachedPlacedWord[];
  placed: CachedPlacedWord[];
};

const cache = new Map<string, WordCloudCacheEntry>();
const wordsCache = new Map<string, { word: string; count: number }[]>();

function cloneWords(items: CachedPlacedWord[]): CachedPlacedWord[] {
  return items.map((item) => ({ ...item }));
}

export function readWordCloudCache(
  key: string,
  wordsKey: string,
  width?: number,
  height?: number,
): WordCloudCacheEntry | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.wordsKey !== wordsKey) return null;
  if (!hit.placed.length || hit.width < 40 || hit.height < 40) return null;
  const nextWidth = width ?? hit.width;
  const nextHeight = height ?? hit.height;
  if (hit.width === nextWidth && hit.height === nextHeight) {
    return {
      wordsKey: hit.wordsKey,
      width: hit.width,
      height: hit.height,
      initial: cloneWords(hit.initial),
      placed: cloneWords(hit.placed),
    };
  }
  const sx = nextWidth / hit.width;
  const sy = nextHeight / hit.height;
  const scale = (items: CachedPlacedWord[]) =>
    items.map((item) => ({
      ...item,
      x: clamp(item.x * sx, 0, Math.max(0, nextWidth - item.width)),
      y: clamp(item.y * sy, 0, Math.max(0, nextHeight - item.height)),
    }));
  return {
    wordsKey: hit.wordsKey,
    width: nextWidth,
    height: nextHeight,
    initial: scale(hit.initial),
    placed: scale(hit.placed),
  };
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

export function writeWordCloudCache(
  key: string,
  entry: WordCloudCacheEntry,
) {
  if (!key || !entry.placed.length) return;
  cache.set(key, {
    wordsKey: entry.wordsKey,
    width: entry.width,
    height: entry.height,
    initial: cloneWords(entry.initial),
    placed: cloneWords(entry.placed),
  });
}

export function readWordCloudWords(key: string) {
  const hit = wordsCache.get(key);
  return hit ? hit.map((item) => ({ ...item })) : null;
}

export function writeWordCloudWords(
  key: string,
  words: { word: string; count: number }[],
) {
  if (!key) return;
  wordsCache.set(
    key,
    words.map((item) => ({ ...item })),
  );
}

export function clearWordCloudCache(dashboardId: string) {
  const prefix = `${dashboardId}:`;
  for (const key of [...cache.keys()]) {
    if (key === dashboardId || key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
  for (const key of [...wordsCache.keys()]) {
    if (key === dashboardId || key.startsWith(prefix)) {
      wordsCache.delete(key);
    }
  }
}
