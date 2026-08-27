"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { LinkPreview } from "@/components/LinkPreview";
import { SiteLogo } from "@/components/SiteLogo";
import { useLocale } from "@/components/LocaleProvider";
import type { ChatMessage } from "@/lib/chat-types";
import {
  firstHttpsUrl,
  isUrlOnlyMessage,
  splitHttpsText,
} from "@/lib/https-links";
import { siteBrandOf } from "@/lib/site-brand";

const PAGE_SIZE = 40;
const WINDOW_MAX = 100;
const EMPTY_MESSAGES: ChatMessage[] = [];

function dateKey(timestamp: number) {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatMonthDay(timestamp: number, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en" : "zh-Hant", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function formatTimeLabel(timestamp: number, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en" : "zh-Hant", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale === "en",
  }).format(new Date(timestamp));
}

function buildDemoMessages(nameA: string, nameB: string): ChatMessage[] {
  const now = Date.now();
  const lines = [
    [nameA, "哈哈"],
    [nameB, "哈哈"],
  ] as const;

  return lines.map(([senderName, content], index) => ({
    id: `demo-chat-${index + 1}`,
    timestamp: now - (lines.length - index) * 7 * 60 * 1000,
    senderId: senderName,
    senderName,
    content,
    platform: "line",
    type: "text" as const,
  }));
}

function messageBody(
  message: ChatMessage,
  labels: {
    stickers: string;
    photos: string;
    videos: string;
    system: string;
  },
) {
  if (message.type === "sticker") return `[ ${labels.stickers} ]`;
  if (message.type === "image") return `[ ${labels.photos} ]`;
  if (message.type === "video") return `[ ${labels.videos} ]`;
  if (message.type === "system") {
    return message.content
      ? `[ ${labels.system} ] ${message.content}`
      : `[ ${labels.system} ]`;
  }
  if (message.type === "call") return `☎ ${message.content}`;
  return message.content;
}

function renderMessageText(text: string, isSelf: boolean) {
  const nodes: ReactNode[] = [];
  splitHttpsText(text).forEach((part, index) => {
    if (part.type !== "link") {
      nodes.push(part.value);
      return;
    }
    const brand = siteBrandOf(part.value);
    nodes.push(
      <a
        key={`link-${index}`}
        href={part.value}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex max-w-full items-center gap-1 break-all underline underline-offset-2 ${
          isSelf
            ? "decoration-white/70 hover:decoration-white"
            : "text-accent-deep decoration-accent/70 hover:decoration-accent-deep"
        }`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {brand ? (
          <span className="inline-flex shrink-0 rounded-sm bg-white/90 p-px">
            <SiteLogo brand={brand} size={13} />
          </span>
        ) : null}
        <span className="min-w-0 break-all">{part.value}</span>
      </a>,
    );
  });
  return nodes.length ? nodes : text;
}

export function ChatSidePanel({
  open,
  messages,
  usernameA,
  usernameB,
  anonymous,
  focusDate = null,
  focusNonce = 0,
  onClose,
}: {
  open: boolean;
  messages: ChatMessage[];
  usernameA: string;
  usernameB: string;
  anonymous: boolean;
  focusDate?: string | null;
  focusNonce?: number;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const displayA = anonymous ? t("participantYou") : usernameA;
  const displayB = anonymous ? t("participantOther") : usernameB;
  const labels = {
    stickers: t("personStickers"),
    photos: t("personPhotos"),
    videos: t("personVideos"),
    system: t("chatSystem"),
  };
  const lastSortedRef = useRef<ChatMessage[]>(EMPTY_MESSAGES);
  const sorted = useMemo(() => {
    if (!open) return lastSortedRef.current;
    const source =
      messages.length > 0
        ? messages
        : buildDemoMessages(usernameA, usernameB);
    const next = [...source].sort((a, b) => a.timestamp - b.timestamp);
    lastSortedRef.current = next;
    return next;
  }, [messages, open, usernameA, usernameB]);
  const [range, setRange] = useState({ start: 0, end: PAGE_SIZE });
  const [currentTs, setCurrentTs] = useState<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ id: string; offset: number } | null>(null);
  const loadingOlderRef = useRef(false);
  const loadingNewerRef = useRef(false);
  const pendingScrollIdRef = useRef<string | null>(null);
  const jumpLockRef = useRef(false);
  const pinToBottomRef = useRef(false);
  const rangeRef = useRef(range);
  rangeRef.current = range;
  const topSentinelRef = useRef<HTMLLIElement>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    x: 0,
    locked: null as "h" | "v" | null,
  });
  const visible = sorted.slice(range.start, range.end);

  useEffect(() => {
    if (!sorted.length) return;
    if (focusDate) {
      const index = sorted.findIndex(
        (message) => dateKey(message.timestamp) === focusDate,
      );
      if (index >= 0) {
        pinToBottomRef.current = false;
        setRange({
          start: Math.max(0, index - PAGE_SIZE),
          end: Math.min(sorted.length, index + PAGE_SIZE),
        });
        pendingScrollIdRef.current = sorted[index].id;
        jumpLockRef.current = true;
        return;
      }
    }
    pinToBottomRef.current = true;
    setRange({
      start: Math.max(0, sorted.length - WINDOW_MAX),
      end: sorted.length,
    });
  }, [focusDate, focusNonce, sorted]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = Math.max(
      0,
      window.innerWidth - document.documentElement.clientWidth,
    );
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-chat-panel]")) return;
      if (target.closest("[data-chat-jump]")) return;
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose, open]);

  function captureAnchor() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const top = scroller.getBoundingClientRect().top;
    for (const node of scroller.querySelectorAll<HTMLElement>("[data-chat-id]")) {
      if (node.getBoundingClientRect().bottom > top + 8) {
        const id = node.dataset.chatId;
        if (!id) return;
        anchorRef.current = {
          id,
          offset: node.getBoundingClientRect().top - top,
        };
        return;
      }
    }
  }

  function restoreAnchor(scroller: HTMLElement) {
    const anchor = anchorRef.current;
    anchorRef.current = null;
    if (!anchor) return;
    const node = scroller.querySelector<HTMLElement>(
      `[data-chat-id="${CSS.escape(anchor.id)}"]`,
    );
    if (!node) return;
    scroller.scrollTop +=
      node.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top -
      anchor.offset;
  }

  function syncCurrentDate(scroller: HTMLElement) {
    const nodes = scroller.querySelectorAll<HTMLElement>("[data-chat-ts]");
    if (nodes.length === 0) {
      setCurrentTs(null);
      return;
    }
    const top = scroller.getBoundingClientRect().top;
    let timestamp = Number(nodes[0].dataset.chatTs);
    for (const node of nodes) {
      if (node.getBoundingClientRect().bottom > top + 12) {
        timestamp = Number(node.dataset.chatTs);
        break;
      }
    }
    if (Number.isFinite(timestamp)) setCurrentTs(timestamp);
  }

  function canScroll(scroller: HTMLElement) {
    return scroller.scrollHeight > scroller.clientHeight + 1;
  }

  function prependOlder(keepFocus: boolean) {
    const { start, end } = rangeRef.current;
    if (start <= 0 || loadingOlderRef.current) return false;
    if (!keepFocus) captureAnchor();
    loadingOlderRef.current = true;
    setRange({
      start: Math.max(0, start - PAGE_SIZE),
      end: keepFocus ? end : Math.min(end, Math.max(0, start - PAGE_SIZE) + WINDOW_MAX),
    });
    return true;
  }

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!open || !scroller) return;
    if (pendingScrollIdRef.current) {
      const target = scroller.querySelector<HTMLElement>(
        `[data-chat-id="${CSS.escape(pendingScrollIdRef.current)}"]`,
      );
      target?.scrollIntoView({ block: "start" });
      loadingOlderRef.current = false;
      if (range.start > 0 && !canScroll(scroller) && prependOlder(true)) {
        return;
      }
      pendingScrollIdRef.current = null;
      loadingOlderRef.current = false;
      loadingNewerRef.current = false;
      syncCurrentDate(scroller);
      window.setTimeout(() => {
        jumpLockRef.current = false;
        const node = scrollerRef.current;
        if (node && node.scrollTop < 72) loadOlder();
      }, 400);
      return;
    }
    if (anchorRef.current) {
      restoreAnchor(scroller);
      loadingOlderRef.current = false;
      loadingNewerRef.current = false;
      syncCurrentDate(scroller);
      if (range.start > 0 && !canScroll(scroller)) loadOlder();
      return;
    }
    if (pinToBottomRef.current) {
      scroller.scrollTop = scroller.scrollHeight;
      pinToBottomRef.current = false;
    }
    loadingOlderRef.current = false;
    loadingNewerRef.current = false;
    syncCurrentDate(scroller);
  }, [open, range.end, range.start, sorted]);

  function loadOlder() {
    if (jumpLockRef.current) return;
    prependOlder(false);
  }

  function loadNewer() {
    if (
      range.end >= sorted.length ||
      loadingNewerRef.current ||
      jumpLockRef.current
    ) {
      return;
    }
    captureAnchor();
    loadingNewerRef.current = true;
    setRange((current) => {
      const end = Math.min(sorted.length, current.end + PAGE_SIZE);
      return {
        start: Math.max(current.start, end - WINDOW_MAX),
        end,
      };
    });
  }

  useEffect(() => {
    if (!open || range.start <= 0) return;
    const scroller = scrollerRef.current;
    const sentinel = topSentinelRef.current;
    if (!scroller || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (jumpLockRef.current) return;
        prependOlder(false);
      },
      { root: scroller, rootMargin: "64px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, range.start, range.end]);

  function resetPanelTransform() {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.transition = "";
    panel.style.transform = "";
  }

  function beginPanelDrag(id: number, x: number, y: number) {
    dragRef.current = {
      pointerId: id,
      startX: x,
      startY: y,
      x: 0,
      locked: null,
    };
  }

  function movePanelDrag(id: number, x: number, y: number, event?: Event) {
    const drag = dragRef.current;
    if (drag.pointerId !== id) return;
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (!drag.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.locked = dx > 0 && Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (drag.locked === "h" && scrollerRef.current) {
        scrollerRef.current.style.overflowY = "hidden";
        scrollerRef.current.style.touchAction = "none";
      }
    }
    if (drag.locked !== "h") return;
    event?.preventDefault();
    drag.x = Math.max(0, dx);
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.transition = "none";
    panel.style.transform = `translateX(${drag.x}px)`;
  }

  function endPanelDrag(id: number) {
    const drag = dragRef.current;
    if (drag.pointerId !== id) return;
    drag.pointerId = -1;
    if (scrollerRef.current) {
      scrollerRef.current.style.overflowY = "";
      scrollerRef.current.style.touchAction = "";
    }
    const panel = panelRef.current;
    if (!panel || drag.locked !== "h") {
      drag.locked = null;
      return;
    }
    const shouldClose = drag.x > Math.min(panel.offsetWidth * 0.2, 72);
    drag.locked = null;
    panel.style.transition = "transform 0.25s ease-out";
    if (shouldClose) {
      panel.style.transform = "translateX(100%)";
      window.setTimeout(() => {
        resetPanelTransform();
        onClose();
      }, 250);
      return;
    }
    panel.style.transform = "translateX(0)";
    window.setTimeout(resetPanelTransform, 250);
  }

  function onPanelPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!open || event.button !== 0 || event.pointerType === "touch") return;
    if (event.target instanceof Element && event.target.closest("a[href]")) {
      return;
    }
    beginPanelDrag(event.pointerId, event.clientX, event.clientY);
  }

  function onPanelPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    const drag = dragRef.current;
    if (drag.pointerId === event.pointerId && drag.locked === "h") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    movePanelDrag(event.pointerId, event.clientX, event.clientY, event.nativeEvent);
  }

  function onPanelPointerEnd(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    endPanelDrag(event.pointerId);
  }

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const onTouchStart = (event: TouchEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("a[href]")) return;
      const touch = event.changedTouches[0];
      if (!touch || dragRef.current.pointerId !== -1) return;
      beginPanelDrag(touch.identifier, touch.clientX, touch.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      const drag = dragRef.current;
      if (drag.pointerId === -1) return;
      let touch: Touch | undefined;
      for (const item of Array.from(event.touches)) {
        if (item.identifier === drag.pointerId) {
          touch = item;
          break;
        }
      }
      touch ??= event.changedTouches[0];
      if (!touch) return;
      movePanelDrag(touch.identifier, touch.clientX, touch.clientY, event);
    };
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      endPanelDrag(touch.identifier);
    };

    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    panel.addEventListener("touchend", onTouchEnd);
    panel.addEventListener("touchcancel", onTouchEnd);
    return () => {
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove, true);
      panel.removeEventListener("touchend", onTouchEnd);
      panel.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [open, onClose]);

  return (
    <aside
      ref={panelRef}
      data-chat-panel="true"
      aria-hidden={!open}
      onPointerDown={onPanelPointerDown}
      onPointerMove={onPanelPointerMove}
      onPointerUp={onPanelPointerEnd}
      onPointerCancel={onPanelPointerEnd}
      className={`fixed top-8 bottom-8 right-0 z-40 flex w-[min(78vw,19rem)] flex-col overflow-hidden rounded-l-2xl border border-r-0 border-card-border bg-white shadow-[0_0_40px_rgba(124,92,191,0.18)] transition-transform duration-300 ease-out [touch-action:pan-x_pan-y] sm:w-[30rem] ${
        open ? "translate-x-0" : "pointer-events-none translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-card-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-accent-deep sm:text-base">
            {t("dashboardChat")}
          </p>
          <p className="truncate text-xs text-muted">
            {displayA} · {displayB}
          </p>
        </div>
        {currentTs != null ? (
          <p className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-sm font-semibold text-accent-deep">
            {formatMonthDay(currentTs, locale)}
          </p>
        ) : null}
      </div>
      <div
        ref={scrollerRef}
        className="chat-scroll min-h-0 flex-1 overflow-y-auto bg-[#f7f2fc] px-3 py-12"
        onScroll={(event) => {
          const scroller = event.currentTarget;
          if (!jumpLockRef.current) {
            if (scroller.scrollTop < 72) loadOlder();
            if (
              scroller.scrollTop + scroller.clientHeight >
              scroller.scrollHeight - 80
            ) {
              loadNewer();
            }
          }
          syncCurrentDate(scroller);
        }}
      >
        {!open || sorted.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted">
            {t("dashboardChatEmpty")}
          </p>
        ) : (
          <ol className="space-y-2">
            {range.start > 0 ? (
              <li
                ref={topSentinelRef}
                className="py-2 text-center text-[11px] text-muted"
              >
                {t("dashboardChatLoading")}
              </li>
            ) : null}
            {visible.map((message, index) => {
              const previous = sorted[range.start + index - 1];
              const showDate =
                !previous ||
                dateKey(previous.timestamp) !== dateKey(message.timestamp);
              const isSelf = message.senderName === usernameA;
              const body = messageBody(message, labels);
              const previewHref =
                message.type === "text"
                  ? firstHttpsUrl(message.content)
                  : null;
              const urlOnly =
                previewHref != null && isUrlOnlyMessage(message.content);
              return (
                <li
                  key={message.id}
                  data-chat-id={message.id}
                  data-chat-ts={message.timestamp}
                >
                  {showDate ? (
                    <p className="mb-3 mt-1 text-center text-sm font-medium text-muted">
                      {formatMonthDay(message.timestamp, locale)}
                    </p>
                  ) : null}
                  <div
                    className={`flex items-end gap-1.5 ${isSelf ? "justify-end" : "justify-start"}`}
                  >
                    {isSelf ? (
                      <p className="mb-0.5 shrink-0 font-mono text-[10px] text-muted">
                        {formatTimeLabel(message.timestamp, locale)}
                      </p>
                    ) : null}
                    <div
                      className={`flex min-w-0 flex-col gap-1 ${
                        previewHref
                          ? "w-[min(78%,18rem)]"
                          : "max-w-[78%]"
                      }`}
                    >
                      {urlOnly ? null : (
                        <div
                          className={`rounded-2xl px-3 py-2 ${
                            isSelf
                              ? "rounded-br-md bg-accent text-white"
                              : "rounded-bl-md bg-white text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-5">
                            {renderMessageText(body, isSelf)}
                          </p>
                        </div>
                      )}
                      {previewHref ? <LinkPreview href={previewHref} /> : null}
                    </div>
                    {!isSelf ? (
                      <p className="mb-0.5 shrink-0 font-mono text-[10px] text-muted">
                        {formatTimeLabel(message.timestamp, locale)}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}
