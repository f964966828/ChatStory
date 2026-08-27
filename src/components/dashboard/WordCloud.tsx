"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocale } from "@/components/LocaleProvider";
import { EXPORT_IDLE_EVENT } from "@/components/dashboard/export-idle";
import { formatNumber } from "@/lib/analyze";
import type { ChatMessage } from "@/lib/chat-types";
import {
  countMessageWordsProgress,
  type WordCount,
} from "@/lib/words";
import {
  readWordCloudCache,
  readWordCloudWords,
  writeWordCloudCache,
  writeWordCloudWords,
  type CachedPlacedWord,
} from "@/lib/word-cloud-cache";

const COLORS = ["#7c5cbf", "#9b6fe8", "#b794f6", "#8b7aa3"];

type PlacedWord = WordCount & {
  x: number;
  y: number;
  fontSize: number;
  width: number;
  height: number;
  color: string;
  z: number;
};

type DragState = {
  id: string;
  pointerId: number;
  ox: number;
  oy: number;
  px: number;
  py: number;
};

type ResetAnim = {
  start: number;
  from: Map<string, { x: number; y: number; z: number }>;
  to: PlacedWord[];
  delay: Map<string, number>;
  duration: number;
};

const RESET_DURATION = 720;
const RESET_MAX_DELAY = 260;
const LAYOUT_TAG = "v5";
const SETTLE_STOP = 0.16;
const SETTLE_MAX_FRAMES = 120;

function layoutCacheKey(cacheKey: string, compact: boolean) {
  return `${cacheKey}:${compact ? "m" : "d"}:${LAYOUT_TAG}`;
}

function hydrateWordCloud(
  cacheKey: string,
  autoload: boolean,
  seedWords: WordCount[],
): { words: WordCount[]; phase: "idle" | "ready" } {
  if (autoload && seedWords.length) {
    return { words: seedWords, phase: "ready" };
  }
  const cached = readWordCloudWords(cacheKey);
  if (cached) return { words: cached, phase: "ready" };
  return { words: [], phase: "idle" };
}

function hydratePlaced(
  cacheKey: string,
  words: WordCount[],
): { placed: PlacedWord[]; initial: PlacedWord[]; size: { w: number; h: number } } {
  if (!words.length) {
    return { placed: [], initial: [], size: { w: 0, h: 0 } };
  }
  const compact =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 639px)").matches;
  const wordsKey = words.map((item) => `${item.word}:${item.count}`).join("|");
  const hit = readWordCloudCache(layoutCacheKey(cacheKey, compact), wordsKey);
  if (!hit) return { placed: [], initial: [], size: { w: 0, h: 0 } };
  return {
    placed: hit.placed as PlacedWord[],
    initial: hit.initial as PlacedWord[],
    size: { w: hit.width, h: hit.height },
  };
}

export function WordCloud({
  cacheKey,
  words: seedWords = [],
  messages = [],
  senderName = null,
  autoload = false,
}: {
  cacheKey: string;
  words?: WordCount[];
  messages?: ChatMessage[];
  senderName?: string | null;
  autoload?: boolean;
}) {
  const { t, locale } = useLocale();
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [boot] = useState(() => {
    const cloud = hydrateWordCloud(cacheKey, autoload, seedWords);
    const layout = hydratePlaced(cacheKey, cloud.words);
    return { ...cloud, ...layout };
  });
  const zRef = useRef(Math.max(1, ...boot.placed.map((item) => item.z), 1));
  const placedRef = useRef<PlacedWord[]>(boot.placed);
  const initialRef = useRef<PlacedWord[]>(boot.initial);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const rafRef = useRef<number | null>(null);
  const settleRafRef = useRef<number | null>(null);
  const settlingRef = useRef(false);
  const settleFramesRef = useRef(0);
  const resetRafRef = useRef<number | null>(null);
  const resetAnimRef = useRef<ResetAnim | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const loadGenRef = useRef(0);
  const [size, setSize] = useState(boot.size);
  const [placed, setPlaced] = useState<PlacedWord[]>(boot.placed);
  const [loadedWords, setLoadedWords] = useState<WordCount[]>(boot.words);
  const [phase, setPhase] = useState<"idle" | "loading" | "ready">(boot.phase);
  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 639px)").matches
      : false,
  );
  const words = loadedWords;
  const ready = phase === "ready";
  const wordsKey = useMemo(
    () => words.map((item) => `${item.word}:${item.count}`).join("|"),
    [words],
  );
  const numberLocale = locale === "en" ? "en" : "zh";

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const sync = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (phase !== "ready") return;
    if (!words.length || size.w < 40 || size.h < 40) return;

    const layoutKey = layoutCacheKey(cacheKey, compact);
    const hit = readWordCloudCache(layoutKey, wordsKey, size.w, size.h);
    if (hit) {
      initialRef.current = hit.initial as PlacedWord[];
      placedRef.current = hit.placed as PlacedWord[];
      zRef.current = Math.max(1, ...hit.placed.map((item) => item.z));
      persistCloud(
        layoutKey,
        wordsKey,
        size.w,
        size.h,
        initialRef.current,
        placedRef.current,
      );
      const first = placed[0];
      const nextFirst = hit.placed[0];
      if (
        placed.length !== hit.placed.length ||
        first?.x !== nextFirst?.x ||
        first?.y !== nextFirst?.y
      ) {
        setPlaced(hit.placed as PlacedWord[]);
      }
      setResetting(false);
    } else {
      zRef.current = 1;
      const next = layoutWords(words, size.w, size.h, compact);
      initialRef.current = clonePlaced(next);
      placedRef.current = next;
      setPlaced(next);
      setResetting(false);
      persistCloud(layoutKey, wordsKey, size.w, size.h, initialRef.current, next);
    }

    return () => {
      persistCloud(
        layoutKey,
        wordsKey,
        size.w,
        size.h,
        initialRef.current,
        placedRef.current,
      );
    };
  }, [cacheKey, wordsKey, size.w, size.h, compact, phase]);

  useEffect(() => {
    const onIdle = () => {
      stopDragFrame();
      stopSettle(true);
      stopResetAnim("end");
      dragRef.current = null;
      pointerRef.current = null;
      setDragging(null);
      setHover(null);
      setResetting(false);
    };
    window.addEventListener(EXPORT_IDLE_EVENT, onIdle);
    return () => {
      window.removeEventListener(EXPORT_IDLE_EVENT, onIdle);
      stopDragFrame();
      stopSettle();
      stopResetAnim();
    };
  }, []);

  function stopDragFrame() {
    if (rafRef.current == null) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function stopSettle(commit = false) {
    if (settleRafRef.current != null) {
      cancelAnimationFrame(settleRafRef.current);
      settleRafRef.current = null;
    }
    const wasSettling = settlingRef.current;
    settlingRef.current = false;
    if (commit && wasSettling) commitPlaced();
  }

  function startSettle() {
    stopSettle();
    settlingRef.current = true;
    settleFramesRef.current = 0;
    settleRafRef.current = requestAnimationFrame(runSettleFrame);
  }

  function runSettleFrame() {
    settleRafRef.current = null;
    const box = boxRef.current;
    if (!box || !settlingRef.current) {
      settlingRef.current = false;
      return;
    }
    const items = placedRef.current;
    const before = items.map((item) => ({ x: item.x, y: item.y }));
    settleCloud(items, box.clientWidth, box.clientHeight);
    let moved = 0;
    for (let i = 0; i < items.length; i += 1) {
      moved = Math.max(
        moved,
        Math.hypot(items[i].x - before[i].x, items[i].y - before[i].y),
      );
    }
    paintWords();
    settleFramesRef.current += 1;
    if (moved < SETTLE_STOP || settleFramesRef.current >= SETTLE_MAX_FRAMES) {
      settlingRef.current = false;
      commitPlaced();
      return;
    }
    settleRafRef.current = requestAnimationFrame(runSettleFrame);
  }

  function stopResetAnim(snap?: "end" | "keep") {
    if (resetRafRef.current != null) {
      cancelAnimationFrame(resetRafRef.current);
      resetRafRef.current = null;
    }
    const anim = resetAnimRef.current;
    resetAnimRef.current = null;
    if (!anim) return;
    if (snap === "end") {
      placedRef.current = clonePlaced(anim.to);
      paintWords();
    }
  }

  function finishResetAnim() {
    const anim = resetAnimRef.current;
    const dest = clonePlaced(anim?.to ?? initialRef.current);
    stopResetAnim();
    zRef.current = 1;
    placedRef.current = dest;
    setPlaced(dest);
    setResetting(false);
    persistCurrent();
  }

  function runResetFrame() {
    const anim = resetAnimRef.current;
    if (!anim) return;
    const now = performance.now();
    let done = true;
    for (const item of placedRef.current) {
      const start = anim.from.get(item.word);
      const dest = anim.to.find((entry) => entry.word === item.word);
      if (!start || !dest) continue;
      const delay = anim.delay.get(item.word) ?? 0;
      const local = clamp((now - anim.start - delay) / anim.duration, 0, 1);
      if (local < 1) done = false;
      const t = easeOutCubic(local);
      const dx = dest.x - start.x;
      const dy = dest.y - start.y;
      const dist = Math.hypot(dx, dy);
      const sign = item.word.charCodeAt(0) % 2 === 0 ? 1 : -1;
      const arc =
        dist < 1
          ? 0
          : Math.sin(local * Math.PI) * Math.min(16, dist * 0.14) * sign;
      const px = dist < 1 ? 0 : (-dy / dist) * arc;
      const py = dist < 1 ? 0 : (dx / dist) * arc;
      item.x = start.x + dx * t + px;
      item.y = start.y + dy * t + py;
      item.z = dest.z;
    }
    paintWords();
    if (done) {
      resetRafRef.current = null;
      finishResetAnim();
      return;
    }
    resetRafRef.current = requestAnimationFrame(runResetFrame);
  }

  function paintWords() {
    for (const item of placedRef.current) {
      const node = nodeRefs.current.get(item.word);
      if (!node) continue;
      node.style.left = `${item.x}px`;
      node.style.top = `${item.y}px`;
      node.style.zIndex = String(item.z);
    }
    const tip = tooltipRef.current;
    const box = boxRef.current;
    const id = dragRef.current?.id;
    if (!tip || !box || !id) return;
    const item = placedRef.current.find((entry) => entry.word === id);
    if (!item) return;
    const pos = wordTooltipPos(item, box.clientWidth);
    tip.style.left = `${pos.left}px`;
    tip.style.top = `${pos.top}px`;
  }

  function persistCurrent() {
    if (phase !== "ready") return;
    persistCloud(
      `${layoutCacheKey(cacheKey, compact)}`,
      wordsKey,
      size.w,
      size.h,
      initialRef.current,
      placedRef.current,
    );
  }

  function commitPlaced() {
    setPlaced(placedRef.current.map((item) => ({ ...item })));
    persistCurrent();
  }

  function runDragFrame() {
    rafRef.current = null;
    const drag = dragRef.current;
    const pointer = pointerRef.current;
    const box = boxRef.current;
    if (!drag || !pointer || !box) return;
    const items = placedRef.current;
    const dragged = items.find((item) => item.word === drag.id);
    if (!dragged) return;
    dragged.x = clamp(
      drag.ox + pointer.x - drag.px,
      0,
      box.clientWidth - dragged.width,
    );
    dragged.y = clamp(
      drag.oy + pointer.y - drag.py,
      0,
      box.clientHeight - dragged.height,
    );
    collideDrag(items, drag.id, box.clientWidth, box.clientHeight);
    paintWords();
  }

  function endDrag() {
    stopDragFrame();
    runDragFrame();
    dragRef.current = null;
    pointerRef.current = null;
    setDragging(null);
    setHover(null);
    startSettle();
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>, word: string) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopSettle();
    if (resetAnimRef.current) {
      stopResetAnim("keep");
      setResetting(false);
      commitPlaced();
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const item = placedRef.current.find((entry) => entry.word === word);
    if (!item) return;
    zRef.current += 1;
    placedRef.current = placedRef.current.map((entry) =>
      entry.word === word ? { ...entry, z: zRef.current } : entry,
    );
    const current = placedRef.current.find((entry) => entry.word === word);
    if (!current) return;
    dragRef.current = {
      id: word,
      pointerId: event.pointerId,
      ox: current.x,
      oy: current.y,
      px: event.clientX,
      py: event.clientY,
    };
    setDragging(word);
    setHover(word);
    setPlaced(placedRef.current.map((entry) => ({ ...entry })));
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    pointerRef.current = { x: event.clientX, y: event.clientY };
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(runDragFrame);
  }

  function resetLayout() {
    if (!ready) return;
    stopDragFrame();
    stopSettle();
    stopResetAnim("keep");
    dragRef.current = null;
    pointerRef.current = null;
    setDragging(null);
    setHover(null);

    const to = clonePlaced(initialRef.current);
    const from = new Map(
      placedRef.current.map((item) => [
        item.word,
        { x: item.x, y: item.y, z: item.z },
      ]),
    );
    const moved = to.filter((item) => {
      const start = from.get(item.word);
      if (!start) return true;
      return Math.hypot(item.x - start.x, item.y - start.y) > 0.6;
    });
    if (!moved.length) {
      zRef.current = 1;
      placedRef.current = to;
      setPlaced(to);
      setResetting(false);
      persistCurrent();
      return;
    }

    const ranked = [...moved].sort((a, b) => {
      const sa = from.get(a.word);
      const sb = from.get(b.word);
      const da = sa ? Math.hypot(a.x - sa.x, a.y - sa.y) : 0;
      const db = sb ? Math.hypot(b.x - sb.x, b.y - sb.y) : 0;
      return da - db;
    });
    const delay = new Map<string, number>();
    const last = Math.max(ranked.length - 1, 1);
    ranked.forEach((item, index) => {
      delay.set(item.word, (index / last) * RESET_MAX_DELAY);
    });

    setResetting(true);
    resetAnimRef.current = {
      start: performance.now(),
      from,
      to,
      delay,
      duration: RESET_DURATION,
    };
    resetRafRef.current = requestAnimationFrame(runResetFrame);
  }

  async function loadCloud() {
    if (phase !== "idle") return;
    const gen = ++loadGenRef.current;
    setPhase("loading");
    setProgress(4);
    try {
      const cached = readWordCloudWords(cacheKey);
      let next: WordCount[] = [];
      if (cached?.length) {
        next = cached;
        setProgress(90);
      } else if (seedWords.length) {
        next = seedWords;
        writeWordCloudWords(cacheKey, next);
        setProgress(90);
      } else if (messages.length) {
        next = await countMessageWordsProgress(
          messages,
          senderName,
          (ratio) => {
            if (loadGenRef.current !== gen) return;
            setProgress(Math.max(4, Math.min(90, Math.round(ratio * 90))));
          },
        );
        if (loadGenRef.current !== gen) return;
        writeWordCloudWords(cacheKey, next);
      }
      if (loadGenRef.current !== gen) return;
      setProgress(100);
      setLoadedWords(next);
      setPhase("ready");
    } catch {
      if (loadGenRef.current !== gen) return;
      setLoadedWords([]);
      setPhase("ready");
      setProgress(0);
    }
  }

  const hovered = placed.find((item) => item.word === hover) ?? null;

  return (
    <>
      <button
          type="button"
          data-export-ignore="true"
          onClick={resetLayout}
          disabled={!ready}
          aria-label={t("chartWordCloudReset")}
          className={`group absolute right-2 top-2 z-20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-[0_2px_0_rgba(124,92,191,0.12)] sm:right-3 sm:top-2.5 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm ${
            ready
              ? "border-accent/35 bg-accent/15 text-accent-deep transition hover:border-accent hover:bg-accent/25 hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(124,92,191,0.14)] active:translate-y-0 active:shadow-[0_1px_0_rgba(124,92,191,0.12)]"
              : "cursor-not-allowed border-card-border bg-stone-100 text-muted opacity-50"
          }`}
        >
          <svg
            viewBox="0 0 20 20"
            className={`size-4 transition-transform duration-700 ease-out sm:size-[18px] ${
              !ready ? "" : resetting ? "-rotate-180" : "group-hover:rotate-[-30deg]"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.2 10a6.2 6.2 0 1 1-1.7-4.3"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.2 3.8v3.2h-3.2"
            />
            <circle cx="10" cy="10" r="1.15" fill="currentColor" stroke="none" />
          </svg>
          {t("chartWordCloudReset")}
        </button>
    <div
      ref={boxRef}
      data-word-cloud-box=""
      data-word-cloud-ready={ready ? "true" : "false"}
      data-word-cloud-words={ready ? JSON.stringify(words) : ""}
      data-word-cloud-load-label={t("chartWordCloudLoad")}
      className="relative mt-1 h-60 overflow-hidden sm:mt-1.5 sm:h-72"
    >
      {phase === "idle" ? (
        <button
          type="button"
          onClick={loadCloud}
          className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center"
        >
          <span
            data-word-cloud-idle=""
            className="inline-flex items-center rounded-full border border-accent/40 bg-accent/15 px-4 py-2 text-sm font-bold text-accent-deep shadow-[0_2px_0_rgba(124,92,191,0.12)] transition hover:border-accent hover:bg-accent/25 sm:px-5 sm:py-2.5 sm:text-base"
          >
            {t("chartWordCloudLoad")}
          </span>
        </button>
      ) : phase === "loading" ? (
        <div className="flex h-full w-full flex-col items-center justify-center px-8">
          <p className="mb-3 text-sm font-bold text-accent-deep">
            {t("chartWordCloudLoading")}
          </p>
          <div className="h-2.5 w-56 overflow-hidden rounded-full bg-accent/20 sm:w-72">
            <div
              className="h-full w-full origin-left rounded-full bg-accent-deep transition-transform duration-150 ease-out"
              style={{ transform: `scaleX(${Math.max(progress, 0) / 100})` }}
            />
          </div>
          <p className="mt-2 font-mono text-xs tabular-nums text-muted">
            {progress}%
          </p>
        </div>
      ) : words.length === 0 ? (
        <p className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">
          {t("chartWordCloudEmpty")}
        </p>
      ) : (
        placed.map((item) => {
          const active = hover === item.word;
          return (
            <button
              key={item.word}
              type="button"
              data-word-cloud-item=""
              data-word={item.word}
              data-word-color={item.color}
              aria-label={t("wordTooltip", {
                word: item.word,
                count: formatNumber(item.count, numberLocale),
              })}
              onPointerDown={(event) => onPointerDown(event, item.word)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerEnter={(event) => {
                if (resetting || settlingRef.current) return;
                if (event.pointerType !== "mouse") return;
                if (!window.matchMedia("(hover: hover)").matches) return;
                setHover(item.word);
              }}
              onPointerLeave={(event) => {
                if (resetting) return;
                if (event.pointerType !== "mouse") return;
                if (dragging) return;
                if (!window.matchMedia("(hover: hover)").matches) return;
                setHover((current) => (current === item.word ? null : current));
              }}
              className={`absolute m-0 border-0 bg-transparent p-0 text-center font-bold leading-none whitespace-nowrap select-none ${
                dragging === item.word ? "cursor-grabbing" : "cursor-grab"
              }`}
              ref={(node) => {
                if (node) nodeRefs.current.set(item.word, node);
                else nodeRefs.current.delete(item.word);
              }}
              style={{
                left: item.x,
                top: item.y,
                zIndex: item.z,
                fontSize: item.fontSize,
                color: active ? "#7c5cbf" : item.color,
                width: item.width,
                height: item.height,
                touchAction: "none",
                appearance: "none",
                WebkitAppearance: "none",
                transform: "none",
                transformOrigin: "center center",
                transition:
                  dragging || resetting ? "none" : "color 150ms ease",
              }}
            >
              {item.word}
            </button>
          );
        })
      )}
      {hovered && !resetting ? (
        <div
          ref={tooltipRef}
          data-export-ignore="true"
          className="pointer-events-none absolute z-50 rounded-lg bg-foreground px-2 py-1 font-mono text-[11px] whitespace-nowrap text-white shadow-sm"
          style={wordTooltipPos(hovered, size.w)}
        >
          {t("wordTooltip", {
            word: hovered.word,
            count: formatNumber(hovered.count, numberLocale),
          })}
        </div>
      ) : null}
    </div>
    </>
  );
}

function persistCloud(
  key: string,
  wordsKey: string,
  width: number,
  height: number,
  initial: CachedPlacedWord[],
  placed: CachedPlacedWord[],
) {
  writeWordCloudCache(key, {
    wordsKey,
    width,
    height,
    initial,
    placed,
  });
}

function clonePlaced(items: PlacedWord[]): PlacedWord[] {
  return items.map((item) => ({ ...item }));
}

function wordTooltipPos(item: PlacedWord, boxW: number) {
  return {
    left: Math.min(
      Math.max(0, item.x + item.width / 2 - 40),
      Math.max(0, boxW - 96),
    ),
    top:
      item.y < 36 ? item.y + item.height + 6 : Math.max(0, item.y - 28),
  };
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function layoutWords(
  words: WordCount[],
  width: number,
  height: number,
  compact: boolean,
) {
  const { min: fontMin, range: fontRange } = fontScale(compact);
  const placed: PlacedWord[] = [];
  const maxCount = words[0]?.count ?? 1;
  const minCount = words[words.length - 1]?.count ?? 1;
  const { cx, cy, rx, ry } = ellipseOf(width, height);

  for (let index = 0; index < words.length; index += 1) {
    const item = words[index];
    let fontSize = fontSizeFor(item.count, minCount, maxCount, fontMin, fontRange);
    let measured = measureWord(item.word, fontSize);
    while (measured.width > width && fontSize > fontMin) {
      fontSize -= 1;
      measured = measureWord(item.word, fontSize);
    }
    const color = COLORS[index % COLORS.length];
    const box = { width: measured.width, height: measured.height };
    let x = cx - box.width / 2;
    let y = cy - box.height / 2;
    let found = index === 0;

    if (!found) {
      for (let t = 0.15; t < 180; t += 0.2) {
        const u = Math.min(1, t / 28);
        x = cx + rx * u * Math.cos(t) - box.width / 2;
        y = cy + ry * u * Math.sin(t) - box.height / 2;
        x = clamp(x, 0, width - box.width);
        y = clamp(y, 0, height - box.height);
        if (!placed.some((other) => overlaps({ x, y, ...box }, other))) {
          found = true;
          break;
        }
      }
    }

    if (!found) continue;
    const next = {
      ...item,
      x,
      y,
      fontSize,
      width: box.width,
      height: box.height,
      color,
      z: 1,
    };
    constrainWord(next, width, height, false);
    placed.push(next);
  }
  for (let i = 0; i < 7; i += 1) {
    packWords(placed, null, width, height);
  }
  return placed;
}

export function relayoutWordCloudBox(box: HTMLElement, compact = false) {
  const raw = box.dataset.wordCloudWords;
  if (!raw) return false;
  let words: WordCount[];
  try {
    words = JSON.parse(raw) as WordCount[];
  } catch {
    return false;
  }
  if (!Array.isArray(words) || words.length === 0) return false;
  const width = box.clientWidth;
  const height = box.clientHeight;
  if (width < 40 || height < 40) return false;

  const placed = layoutWords(words, width, height, compact);
  const nodes = [
    ...box.querySelectorAll<HTMLElement>("[data-word-cloud-item]"),
  ];
  const byWord = new Map<string, HTMLElement>();
  for (const node of nodes) {
    const word = node.dataset.word || node.textContent?.trim() || "";
    if (word) byWord.set(word, node);
    node.style.display = "none";
  }
  const template = nodes[0];
  for (const item of placed) {
    let node = byWord.get(item.word);
    if (!node && template) {
      node = template.cloneNode(true) as HTMLElement;
      node.textContent = item.word;
      node.dataset.word = item.word;
      box.appendChild(node);
    }
    if (!node) continue;
    node.style.display = "";
    node.style.left = `${item.x}px`;
    node.style.top = `${item.y}px`;
    node.style.fontSize = `${item.fontSize}px`;
    node.style.width = `${item.width}px`;
    node.style.height = `${item.height}px`;
    node.style.color = item.color;
    node.dataset.wordColor = item.color;
    node.style.transform = "none";
    node.style.filter = "none";
    node.style.zIndex = "1";
  }
  return true;
}

const FONT_DESKTOP = { min: 12, range: 40 };
const FONT_MOBILE = { min: 10, range: 28 };
const FONT_POWER = 1.3;

function fontScale(compact: boolean) {
  return compact ? FONT_MOBILE : FONT_DESKTOP;
}

function fontSizeFor(
  count: number,
  minCount: number,
  maxCount: number,
  fontMin: number,
  fontRange: number,
) {
  if (maxCount <= minCount) return fontMin + fontRange * 0.4;
  const linear = (count - minCount) / (maxCount - minCount);
  return fontMin + linear ** FONT_POWER * fontRange;
}

let measureCtx: CanvasRenderingContext2D | null = null;

function measureWord(word: string, fontSize: number) {
  if (typeof document !== "undefined") {
    if (!measureCtx) {
      measureCtx = document.createElement("canvas").getContext("2d");
    }
    if (measureCtx) {
      measureCtx.font = `700 ${fontSize}px Nunito, "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
      return {
        width: Math.ceil(measureCtx.measureText(word).width + 16),
        height: Math.ceil(fontSize * 1.5),
      };
    }
  }
  const cjk = /[\u3400-\u9FFF]/u.test(word);
  return {
    width: Math.ceil((cjk ? fontSize : fontSize * 0.62) * word.length + 16),
    height: Math.ceil(fontSize * 1.5),
  };
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return colliding(a, b, GAP);
}

type Box = { x: number; y: number; width: number; height: number };

const GAP = 5;
const HARD_PAD = 2;
const PULL_GAIN_IN = 0.085;
const PULL_GAIN_OUT = 0.028;
const PULL_MAX = 1.8;

function ellipseOf(boxW: number, boxH: number) {
  return {
    cx: boxW / 2,
    cy: boxH / 2,
    rx: Math.max(28, boxW * 0.47),
    ry: Math.max(22, boxH * 0.5),
  };
}

function colliding(a: Box, b: Box, pad: number) {
  const { overlapX, overlapY } = overlapAmounts(a, b, pad);
  return overlapX > 0 && overlapY > 0;
}

function overlapAmounts(a: Box, b: Box, pad = GAP) {
  return {
    overlapX:
      Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) + pad,
    overlapY:
      Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) + pad,
  };
}

function clampWord(item: PlacedWord, boxW: number, boxH: number) {
  item.x = clamp(item.x, 0, boxW - item.width);
  item.y = clamp(item.y, 0, boxH - item.height);
}

function clampToEllipse(item: PlacedWord, boxW: number, boxH: number) {
  const { cx, cy, rx, ry } = ellipseOf(boxW, boxH);
  const localRx = Math.max(12, rx - item.width / 2);
  const localRy = Math.max(10, ry - item.height / 2);
  const icx = item.x + item.width / 2;
  const icy = item.y + item.height / 2;
  const nx = (icx - cx) / localRx;
  const ny = (icy - cy) / localRy;
  const d2 = nx * nx + ny * ny;
  if (d2 <= 1) return;
  const s = 1 / Math.sqrt(d2);
  item.x = cx + (icx - cx) * s - item.width / 2;
  item.y = cy + (icy - cy) * s - item.height / 2;
}

function constrainWord(
  item: PlacedWord,
  boxW: number,
  boxH: number,
  frozen: boolean,
) {
  if (!frozen) clampToEllipse(item, boxW, boxH);
  clampWord(item, boxW, boxH);
}

function separatePair(
  a: PlacedWord,
  b: PlacedWord,
  freezeA: boolean,
  freezeB: boolean,
  boxW: number,
  boxH: number,
  useEllipse: boolean,
  pad: number,
  gain: number,
  maxPush: number,
) {
  const { overlapX, overlapY } = overlapAmounts(a, b, pad);
  if (overlapX <= 0 || overlapY <= 0) return false;
  let dx = b.x + b.width / 2 - (a.x + a.width / 2);
  let dy = b.y + b.height / 2 - (a.y + a.height / 2);
  if (dx === 0 && dy === 0) {
    dx = 0.35;
    dy = 0.2;
  }
  const dist = Math.hypot(dx, dy);
  const ndx = dx / dist;
  const ndy = dy / dist;
  const t = Math.min(
    overlapX / Math.max(Math.abs(ndx), 1e-4),
    overlapY / Math.max(Math.abs(ndy), 1e-4),
  );
  const push = Math.min(t * gain, maxPush);
  if (freezeA && !freezeB) {
    b.x += ndx * push;
    b.y += ndy * push;
    constrainWord(b, boxW, boxH, !useEllipse);
  } else if (freezeB && !freezeA) {
    a.x -= ndx * push;
    a.y -= ndy * push;
    constrainWord(a, boxW, boxH, !useEllipse);
  } else {
    a.x -= (ndx * push) / 2;
    a.y -= (ndy * push) / 2;
    b.x += (ndx * push) / 2;
    b.y += (ndy * push) / 2;
    constrainWord(a, boxW, boxH, !useEllipse);
    constrainWord(b, boxW, boxH, !useEllipse);
  }
  return true;
}

function pullToEllipse(
  items: PlacedWord[],
  frozenId: string | null,
  boxW: number,
  boxH: number,
) {
  const { cx, cy, rx, ry } = ellipseOf(boxW, boxH);
  const maxSize = Math.max(...items.map((item) => item.fontSize), 1);
  const minSize = Math.min(...items.map((item) => item.fontSize), maxSize);
  for (const item of items) {
    if (item.word === frozenId) continue;
    const span = maxSize - minSize || 1;
    const weight = (item.fontSize - minSize) / span;
    const target = 0.52 - weight * 0.42;
    const icx = item.x + item.width / 2;
    const icy = item.y + item.height / 2;
    let nx = (icx - cx) / rx;
    let ny = (icy - cy) / ry;
    let d = Math.hypot(nx, ny);
    if (d < 1e-4) {
      nx = 0.04;
      ny = 0.02;
      d = Math.hypot(nx, ny);
    }
    const err = target - d;
    const gain = err < 0 ? PULL_GAIN_IN : PULL_GAIN_OUT;
    const step = clamp(err * gain, -PULL_MAX, PULL_MAX * 0.35);
    item.x += (nx / d) * step * rx;
    item.y += (ny / d) * step * ry;
    constrainWord(item, boxW, boxH, false);
  }
}

function collideDrag(
  items: PlacedWord[],
  frozenId: string,
  boxW: number,
  boxH: number,
) {
  const frozen = items.find((item) => item.word === frozenId);
  if (!frozen) return;
  pullToEllipse(items, frozenId, boxW, boxH);
  for (let iter = 0; iter < 8; iter += 1) {
    for (const other of items) {
      if (other.word === frozenId) continue;
      separatePair(
        frozen,
        other,
        true,
        false,
        boxW,
        boxH,
        false,
        HARD_PAD,
        0.38,
        2.4,
      );
    }
  }
  resolveCollisions(items, frozenId, boxW, boxH, false, HARD_PAD, 0.3, 2, 5);
  resolveCollisions(items, frozenId, boxW, boxH, false, GAP, 0.16, 1.5, 3);
  pullToEllipse(items, frozenId, boxW, boxH);
  clearTrueOverlaps(items, frozenId, boxW, boxH);
}

function settleCloud(items: PlacedWord[], boxW: number, boxH: number) {
  pullToEllipse(items, null, boxW, boxH);
  resolveCollisions(items, null, boxW, boxH, false, HARD_PAD, 0.3, 2, 5);
  resolveCollisions(items, null, boxW, boxH, false, GAP, 0.16, 1.5, 3);
  pullToEllipse(items, null, boxW, boxH);
  clearTrueOverlaps(items, null, boxW, boxH);
}

function packWords(
  items: PlacedWord[],
  frozenId: string | null,
  boxW: number,
  boxH: number,
) {
  pullToEllipse(items, frozenId, boxW, boxH);
  resolveCollisions(items, frozenId, boxW, boxH, false, HARD_PAD, 0.42, 6, 8);
  for (const item of items) {
    constrainWord(item, boxW, boxH, item.word === frozenId);
  }
  resolveCollisions(items, frozenId, boxW, boxH, true, HARD_PAD, 0.42, 6, 7);
  resolveCollisions(items, frozenId, boxW, boxH, true, GAP, 0.22, 3.5, 4);
  pullToEllipse(items, frozenId, boxW, boxH);
  clearTrueOverlaps(items, frozenId, boxW, boxH);
  return items;
}

function clearTrueOverlaps(
  items: PlacedWord[],
  frozenId: string | null,
  boxW: number,
  boxH: number,
) {
  for (let iter = 0; iter < 18; iter += 1) {
    let hit = false;
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        if (
          separatePair(
            a,
            b,
            a.word === frozenId,
            b.word === frozenId,
            boxW,
            boxH,
            false,
            1,
            1,
            12,
          )
        ) {
          hit = true;
        }
      }
    }
    if (!hit) break;
  }
}

function resolveCollisions(
  items: PlacedWord[],
  frozenId: string | null,
  boxW: number,
  boxH: number,
  useEllipse: boolean,
  pad: number,
  gain: number,
  maxPush: number,
  iters: number,
) {
  for (let iter = 0; iter < iters; iter += 1) {
    let shifted = false;
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        if (
          separatePair(
            a,
            b,
            a.word === frozenId,
            b.word === frozenId,
            boxW,
            boxH,
            useEllipse,
            pad,
            gain,
            maxPush,
          )
        ) {
          shifted = true;
        }
      }
    }
    if (!shifted) break;
  }
  return items;
}
