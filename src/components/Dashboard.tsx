"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { BrandMark } from "@/components/BrandMark";
import { ChatSidePanel } from "@/components/ChatSidePanel";
import { WordCloud } from "@/components/dashboard/WordCloud";
import { useChat, getOrCreateAnalysis } from "@/components/ChatProvider";
import { useLocale } from "@/components/LocaleProvider";
import { Header } from "@/components/dashboard/Header";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { HourBars } from "@/components/dashboard/HourBars";
import { InitiativeCompare } from "@/components/dashboard/InitiativeCompare";
import {
  DashboardTabs,
  StatCard,
  dashboardLabel,
  type StatCardData,
} from "@/components/dashboard/StatCards";
import { TimelineChart } from "@/components/dashboard/TimelineChart";
import { WhoMorePie } from "@/components/dashboard/WhoMorePie";
import { formatDayKey } from "@/components/dashboard/date-utils";
import { EXPORT_IDLE_EVENT } from "@/components/dashboard/export-idle";
import { createDesktopExportTarget } from "@/components/dashboard/share-export";
import {
  formatDuration,
  formatNumber,
  type ChatAnalysis,
} from "@/lib/analyze";
import { buildDemoAnalysis } from "@/lib/demo-analysis";

export function Dashboard() {
  const { t, locale } = useLocale();
  const { dashboards, activeId, setActiveId, removeDashboard } =
    useChat();
  const deferredId = useDeferredValue(activeId);
  const demoAnalysis = useMemo(() => buildDemoAnalysis(), []);
  const displayBoard =
    dashboards.find((item) => item.id === deferredId) ?? dashboards[0];
  const analysis = useMemo(
    () => getOrCreateAnalysis(displayBoard),
    [displayBoard],
  );
  const data = analysis ?? demoAnalysis;
  const numberLocale = locale === "en" ? "en" : "zh";
  const [anonymous, setAnonymous] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFocusDate, setChatFocusDate] = useState<string | null>(null);
  const [chatFocusNonce, setChatFocusNonce] = useState(0);
  const chatReopenTimerRef = useRef<number | null>(null);
  const chatPendingDateRef = useRef<string | null>(null);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "working" | "error"
  >("idle");
  const [sharePreview, setSharePreview] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const activeBoard = dashboards.find((item) => item.id === activeId);
  const canDelete = dashboards.length > 1;
  const people = useMemo(() => {
    const configuredNames =
      analysis && displayBoard?.usernameA && displayBoard.usernameB
        ? [displayBoard.usernameA, displayBoard.usernameB]
        : [];
    const configuredSenders = configuredNames
      .map((name) => data.senders.find((person) => person.name === name))
      .filter(
        (person): person is ChatAnalysis["senders"][number] => person != null,
      );
    const senderPair =
      configuredSenders.length === 2
        ? configuredSenders
        : data.senders.slice(0, 2);
    const pair = senderPair.map((person, index) => ({
      ...person,
      name: anonymous
        ? index === 0
          ? t("participantYou")
          : t("participantOther")
        : analysis
          ? person.name
          : index === 0
            ? t("participantA")
            : t("participantB"),
    }));
    if (pair.length >= 2) return pair;
    return [
      ...pair,
      {
        name: anonymous ? t("participantOther") : t("participantB"),
        messages: 0,
        texts: 0,
        stickers: 0,
        photos: 0,
        videos: 0,
        ratio: 0,
        initiated: 0,
        avgChars: 0,
        avgReplyMs: 0,
        words: [],
      },
    ];
  }, [
    displayBoard?.usernameA,
    displayBoard?.usernameB,
    analysis,
    anonymous,
    data.senders,
    t,
  ]);
  const stats: StatCardData[] = [
    {
      key: "statMessages",
      value: formatNumber(data.totalMessages, numberLocale),
      featured: true,
      breakdown: people.slice(0, 2).map((person) => ({
        name: person.name,
        count: formatNumber(person.messages, numberLocale),
      })),
    },
    {
      key: "statCallCount",
      value: t("statCallCountValue", {
        count: formatNumber(data.callCount, numberLocale),
      }),
    },
    {
      key: "statActiveDays",
      value: t("statActiveDaysValue", {
        count: formatNumber(data.activeDays, numberLocale),
      }),
    },
    {
      key: "statPeakMessageDay",
      value: data.peakMessageDay
        ? formatDayKey(data.peakMessageDay.date, t)
        : "—",
      detail: data.peakMessageDay
        ? `${formatNumber(data.peakMessageDay.count, numberLocale)} ${t("personMessages")}`
        : undefined,
      compact: true,
      onJump: data.peakMessageDay
        ? () => jumpToChatDay(data.peakMessageDay?.date)
        : undefined,
    },
    {
      key: "statCallDuration",
      value: data.callDurationMs ? formatDuration(data.callDurationMs) : "—",
    },
    {
      key: "statDailyAvg",
      value: t("statDailyAvgValue", {
        count: formatNumber(data.avgPerDay, numberLocale),
      }),
    },
    {
      key: "statPeakCallDay",
      value: data.peakCallDay
        ? formatDayKey(data.peakCallDay.date, t)
        : "—",
      detail: data.peakCallDay
        ? formatDuration(data.peakCallDay.durationMs)
        : undefined,
      compact: true,
      onJump: data.peakCallDay
        ? () => jumpToChatDay(data.peakCallDay?.date)
        : undefined,
    },
  ];
  function jumpToChatDay(date: string | undefined) {
    if (!date) return;
    const reopen = () => {
      const next = chatPendingDateRef.current;
      chatReopenTimerRef.current = null;
      chatPendingDateRef.current = null;
      if (!next) return;
      setChatFocusDate(next);
      setChatFocusNonce((value) => value + 1);
      setChatOpen(true);
    };
    if (chatOpen) {
      if (date === chatFocusDate) {
        setChatFocusNonce((value) => value + 1);
        return;
      }
      chatPendingDateRef.current = date;
      setChatOpen(false);
      if (chatReopenTimerRef.current != null) {
        window.clearTimeout(chatReopenTimerRef.current);
      }
      chatReopenTimerRef.current = window.setTimeout(reopen, 320);
      return;
    }
    if (chatReopenTimerRef.current != null) {
      chatPendingDateRef.current = date;
      return;
    }
    setChatFocusDate(date);
    setChatFocusNonce((value) => value + 1);
    setChatOpen(true);
  }
  const partnerName = people[1]?.name ?? t("participantB");
  const featured = stats[0];
  const rest = stats.slice(1);

  useEffect(
    () => () => {
      if (sharePreview) URL.revokeObjectURL(sharePreview.url);
    },
    [sharePreview],
  );

  useEffect(
    () => () => {
      if (chatReopenTimerRef.current != null) {
        window.clearTimeout(chatReopenTimerRef.current);
      }
    },
    [],
  );

  async function createSharePreview() {
    if (!dashboardRef.current || shareStatus === "working") return;
    setShareStatus("working");
    const dashboard = dashboardRef.current;
    const previousPointerEvents = dashboard.style.pointerEvents;
    dashboard.style.pointerEvents = "none";
    window.dispatchEvent(new Event(EXPORT_IDLE_EVENT));
    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await document.fonts.ready;
      const exportTarget = await createDesktopExportTarget(dashboard);
      const width = Math.ceil(exportTarget.node.scrollWidth);
      const height = Math.ceil(exportTarget.node.scrollHeight);
      let blob: Blob | null = null;
      try {
        blob = await toBlob(exportTarget.node, {
          backgroundColor: "#f7f2fc",
          cacheBust: true,
          width,
          height,
          pixelRatio: 2,
          filter: (node) =>
            node.getAttribute?.("data-export-ignore") !== "true",
        });
      } finally {
        exportTarget.cleanup();
      }
      if (!blob) throw new Error("IMAGE_EXPORT_FAILED");

      const file = new File([blob], "chatstory.png", { type: "image/png" });
      setSharePreview({ file, url: URL.createObjectURL(blob) });
      setShareStatus("idle");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareStatus("idle");
        return;
      }
      console.error("[Dashboard] share image failed", error);
      setShareStatus("error");
    } finally {
      dashboard.style.pointerEvents = previousPointerEvents;
    }
  }

  async function sharePreviewImage() {
    if (!sharePreview) return;
    const shareData: ShareData = {
      files: [sharePreview.file],
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        setSharePreview(null);
        return;
      }

      const link = document.createElement("a");
      link.href = sharePreview.url;
      link.download = sharePreview.file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => setSharePreview(null), 0);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("[Dashboard] share preview failed", error);
    }
  }

  return (
    <>
    <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 overflow-x-hidden px-3 py-5 sm:px-6 sm:py-8">
      <div className="mb-3 sm:mb-4">
        <DashboardTabs
          dashboards={dashboards}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <div className="mt-3 border-t border-card-border sm:mt-4" />
        <div className="mt-3 sm:mt-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-card-border bg-white px-3 py-1.5 text-sm font-medium text-muted transition hover:border-accent sm:px-3.5 sm:text-base">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(event) => setAnonymous(event.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-5 w-9 shrink-0 rounded-full bg-[#eadcf6] transition peer-checked:bg-accent-deep peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4 sm:h-6 sm:w-11 sm:after:size-5 sm:peer-checked:after:translate-x-5"
              />
              {t("dashboardAnonymous")}
            </label>
            <button
              type="button"
              data-export-ignore="true"
              disabled={shareStatus === "working"}
              onClick={createSharePreview}
              className="rounded-full border border-card-border bg-white px-3 py-1.5 text-sm font-medium text-muted transition hover:border-accent hover:text-accent-deep disabled:pointer-events-none disabled:opacity-50 sm:px-3.5 sm:text-base"
            >
              {shareStatus === "working"
                ? t("dashboardSharing")
                : shareStatus === "error"
                  ? t("dashboardShareError")
                  : t("dashboardShare")}
            </button>
            <button
              type="button"
              disabled={!canDelete}
              onClick={() => setConfirmDelete(true)}
              className="rounded-full border border-card-border bg-white px-3 py-1.5 text-sm font-medium text-muted hover:border-rose-300 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-40 sm:px-3.5 sm:text-base"
            >
              {t("dashboardDelete")}
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && canDelete && activeBoard ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dashboard-title"
            className="w-full max-w-sm rounded-2xl border border-card-border bg-white p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-dashboard-title"
              className="font-serif text-lg font-bold text-accent-deep"
            >
              {t("dashboardDeleteTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t("dashboardDeleteBody", {
                name: dashboardLabel(activeBoard, t),
              })}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-full px-4 py-2 text-sm text-muted hover:bg-accent/10"
              >
                {t("dashboardDeleteCancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeDashboard(activeBoard.id);
                  setConfirmDelete(false);
                }}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
              >
                {t("dashboardDeleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {sharePreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"
          onClick={() => setSharePreview(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-preview-title"
            className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-card-border bg-white p-4 shadow-xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="share-preview-title"
              className="font-serif text-lg font-bold text-accent-deep"
            >
              {t("dashboardSharePreviewTitle")}
            </h2>
            <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-xl bg-background p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sharePreview.url}
                alt={t("dashboardSharePreviewTitle")}
                className="mx-auto max-h-[70vh] max-w-full object-contain"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSharePreview(null)}
                className="rounded-full px-4 py-2 text-sm text-muted hover:bg-accent/10"
              >
                {t("dashboardDeleteCancel")}
              </button>
              <button
                type="button"
                onClick={sharePreviewImage}
                className="rounded-full bg-accent-deep px-4 py-2 text-sm font-medium text-white hover:bg-accent-dim"
              >
                {t("dashboardShareConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={dashboardRef} className="relative min-w-0">
      <div
        data-export-visible="true"
        aria-hidden="true"
        className="pointer-events-none absolute right-16 top-[16px] z-10 flex items-center gap-4 opacity-0"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-accent text-white shadow-sm">
          <BrandMark size={34} />
        </span>
        <span className="text-5xl font-bold tracking-tight text-accent-deep">
          ChatStory
        </span>
      </div>
      <h1
        data-export-title="true"
        className="min-w-0 font-serif text-3xl font-bold text-accent-deep sm:text-4xl"
      >
        {t("dashboardTitle", { name: partnerName })}
      </h1>

      <section className="mt-5 grid gap-2.5 sm:mt-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,5fr)] lg:items-stretch lg:gap-3">
        <div className="h-full min-w-0">
          <StatCard stat={featured} featured />
        </div>
        <div className="grid grid-cols-2 grid-rows-3 grid-flow-col gap-2.5 lg:grid-flow-row lg:grid-cols-3 lg:grid-rows-2 lg:gap-3">
          {rest.map((stat) => (
            <StatCard key={stat.key} stat={stat} />
          ))}
        </div>
      </section>

      <section className="mt-3 grid min-w-0 gap-3 sm:mt-4 lg:grid-cols-[minmax(0,11fr)_minmax(0,14fr)] lg:gap-4">
        <article className="flex min-h-72 min-w-0 flex-col rounded-2xl border border-card-border bg-card px-2.5 py-[20px] sm:min-h-80 sm:p-5">
          <WhoMorePie
            title={t("chartWhoMore")}
            people={people}
            labels={{
              messages: t("personTexts"),
              stickers: t("personStickers"),
              photos: t("personPhotos"),
              videos: t("personVideos"),
            }}
            format={(value) => formatNumber(value, numberLocale)}
          />
        </article>
        <article className="min-w-0 overflow-visible rounded-2xl border border-card-border bg-card p-3 sm:p-5">
          <TimelineChart
            monthly={data.monthly}
            daily={data.daily}
            locale={locale}
          />
        </article>
      </section>

      <section className="mt-3 sm:mt-4">
        <article className="rounded-2xl border border-card-border bg-card px-4 py-6 sm:p-5">
          <Heatmap
            title={t("chartBusyDays")}
            daily={data.daily}
            locale={locale}
            prevLabel={t("prevYear")}
            nextLabel={t("nextYear")}
            onJumpDay={jumpToChatDay}
          />
        </article>
      </section>

      <section className="mt-3 grid items-stretch gap-3 sm:mt-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-4">
        <article className="rounded-2xl border border-card-border bg-card p-4 sm:p-5">
          <HourBars hourly={data.hourly} />
        </article>
        <InitiativeCompare
          people={people}
          format={(value) => formatNumber(value, numberLocale)}
        />
      </section>

      <section
        data-word-cloud-section=""
        className="mt-3 grid items-stretch gap-3 sm:mt-4 lg:grid-cols-2 lg:gap-4"
      >
        <article className="relative overflow-hidden rounded-2xl border border-card-border bg-card px-2.5 pb-1.5 pt-2.5 sm:px-3 sm:pb-2 sm:pt-3">
          <Header
            title={t("chartWordCloudNamed", {
              name: people[0]?.name ?? t("participantA"),
            })}
            className="pr-[5.5rem] sm:pr-24"
          />
          <div className="-mx-2.5 sm:-mx-3">
            <WordCloud
              key={`${deferredId}:a`}
              cacheKey={`${deferredId}:a`}
              words={people[0]?.words ?? []}
              messages={analysis ? (displayBoard?.messages ?? []) : []}
              senderName={data.senders[0]?.name ?? null}
              autoload={!analysis}
            />
          </div>
        </article>
        <article className="relative overflow-hidden rounded-2xl border border-card-border bg-card px-2.5 pb-1.5 pt-2.5 sm:px-3 sm:pb-2 sm:pt-3">
          <Header
            title={t("chartWordCloudNamed", {
              name: people[1]?.name ?? t("participantB"),
            })}
            className="pr-[5.5rem] sm:pr-24"
          />
          <div className="-mx-2.5 sm:-mx-3">
            <WordCloud
              key={`${deferredId}:b`}
              cacheKey={`${deferredId}:b`}
              words={people[1]?.words ?? []}
              messages={analysis ? (displayBoard?.messages ?? []) : []}
              senderName={data.senders[1]?.name ?? null}
              autoload={!analysis}
            />
          </div>
        </article>
      </section>
      </div>
    </main>
    <ChatSidePanel
      open={chatOpen}
      messages={activeBoard?.messages ?? []}
      usernameA={activeBoard?.usernameA ?? people[0]?.name ?? t("participantA")}
      usernameB={activeBoard?.usernameB ?? people[1]?.name ?? t("participantB")}
      anonymous={anonymous}
      focusDate={chatFocusDate}
      focusNonce={chatFocusNonce}
      onClose={() => {
        setChatOpen(false);
        setChatFocusDate(null);
      }}
    />
    </>
  );
}
