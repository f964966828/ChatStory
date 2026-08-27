"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useState } from "react";
import { useChat } from "@/components/ChatProvider";
import { ImportReview, type PendingImport } from "@/components/ImportReview";
import { Landing } from "@/components/Landing";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const Dashboard = dynamic(
  () => import("@/components/Dashboard").then((mod) => mod.Dashboard),
  { ssr: false },
);

export function HomeView() {
  const { addImportedChat } = useChat();
  const [view, setView] = useState<"landing" | "review" | "dashboard">("landing");
  const [pending, setPending] = useState<PendingImport | null>(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  function showLanding() {
    setPending(null);
    setView("landing");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader
        view={view === "review" ? "landing" : view}
        onShowLanding={showLanding}
        onShowDashboard={() => {
          setPending(null);
          setView("dashboard");
        }}
      />
      {view === "landing" ? (
        <Landing
          onPreviewDashboard={() => setView("dashboard")}
          onParsed={(next) => {
            setPending(next);
            setView("review");
          }}
        />
      ) : view === "review" && pending ? (
        <ImportReview
          pending={pending}
          onConfirm={() => {
            addImportedChat(pending.parsed, pending.fileName, pending.platform);
            setPending(null);
            setView("dashboard");
          }}
          onCancel={showLanding}
        />
      ) : (
        <Dashboard />
      )}
      <SiteFooter />
    </div>
  );
}
