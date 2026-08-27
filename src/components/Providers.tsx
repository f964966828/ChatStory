"use client";

import { ChatProvider } from "@/components/ChatProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import type { Locale } from "@/lib/messages";
import type { ReactNode } from "react";

export function Providers({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <ChatProvider>{children}</ChatProvider>
    </LocaleProvider>
  );
}
