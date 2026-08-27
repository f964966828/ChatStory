"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { persistLocale, LOCALE_STORAGE_KEY } from "@/lib/locale";
import { messages, type Locale, type MessageKey } from "@/lib/messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useLayoutEffect(() => {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const next = saved === "en" || saved === "zh" ? saved : initialLocale;
    setLocaleState(next);
    persistLocale(next);
    document.documentElement.lang = next === "zh" ? "zh-Hant" : "en";
  }, [initialLocale]);

  const value = useMemo<LocaleContextValue>(() => {
    const setLocale = (next: Locale) => {
      setLocaleState(next);
      persistLocale(next);
      document.documentElement.lang = next === "zh" ? "zh-Hant" : "en";
    };

    const t = (key: MessageKey, vars?: Record<string, string>) => {
      let text: string = messages[locale][key];
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, value);
        }
      }
      return text;
    };

    return { locale, setLocale, t };
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
