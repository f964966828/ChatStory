"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useState } from "react";
import { Landing } from "@/components/Landing";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const Dashboard = dynamic(
  () => import("@/components/Dashboard").then((mod) => mod.Dashboard),
  { ssr: false },
);

export function HomeView() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader
        view={view}
        onShowLanding={() => setView("landing")}
        onShowDashboard={() => setView("dashboard")}
      />
      {view === "landing" ? (
        <Landing
          onPreviewDashboard={() => setView("dashboard")}
          onImported={() => setView("dashboard")}
        />
      ) : (
        <Dashboard />
      )}
      <SiteFooter />
    </div>
  );
}
