"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { analyzeChat, type ChatAnalysis } from "@/lib/analyze";
import type {
  ChatMessage,
  ImportPlatform,
  ParsedChat,
} from "@/lib/chat-types";
import { importChatFile } from "@/lib/import-chat";
import { clearWordCloudCache } from "@/lib/word-cloud-cache";

export const DEFAULT_DASHBOARD_ID = "default";

const analysisByDashboard = new Map<string, ChatAnalysis>();

export type StoredDashboard = {
  id: string;
  kind: "default" | "import" | "merge";
  importIndex?: number;
  mergeIndex?: number;
  messages: ChatMessage[];
  usernameA: string | null;
  usernameB: string | null;
  fileName: string | null;
  platform: ImportPlatform | null;
};

export function getOrCreateAnalysis(
  board: StoredDashboard | undefined | null,
): ChatAnalysis | null {
  if (!board || board.kind === "default" || board.messages.length === 0) {
    return null;
  }
  const cached = analysisByDashboard.get(board.id);
  if (cached) return cached;
  const next = analyzeChat(board.messages);
  analysisByDashboard.set(board.id, next);
  return next;
}

type ChatContextValue = {
  dashboards: StoredDashboard[];
  activeId: string;
  setActiveId: (id: string) => void;
  fileName: string | null;
  platform: ImportPlatform | null;
  analysis: ChatAnalysis | null;
  importFile: (file: File, platform: ImportPlatform) => Promise<void>;
  addImportedChat: (
    parsed: ParsedChat,
    fileName: string,
    platform: ImportPlatform,
  ) => void;
  removeDashboard: (id: string) => void;
  mergeDashboards: (ids: string[]) => boolean;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const DEFAULT_DASHBOARD: StoredDashboard = {
  id: DEFAULT_DASHBOARD_ID,
  kind: "default",
  messages: [],
  usernameA: null,
  usernameB: null,
  fileName: null,
  platform: null,
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [dashboards, setDashboards] = useState<StoredDashboard[]>([
    DEFAULT_DASHBOARD,
  ]);
  const [activeId, setActiveId] = useState(DEFAULT_DASHBOARD_ID);
  const [nextImportIndex, setNextImportIndex] = useState(1);
  const [nextMergeIndex, setNextMergeIndex] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);

  const active =
    dashboards.find((item) => item.id === activeId) ?? dashboards[0];

  const analysis = useMemo(() => {
    if (!active || active.kind === "default" || active.messages.length === 0) {
      return null;
    }
    return analysisByDashboard.get(active.id) ?? null;
  }, [active]);

  const addImportedChat = useCallback(
    (
      parsed: ParsedChat,
      importedFileName: string,
      nextPlatform: ImportPlatform,
    ) => {
      const id = `import-${nextImportIndex}`;
      const entry: StoredDashboard = {
        id,
        kind: "import",
        importIndex: nextImportIndex,
        messages: parsed.messages,
        usernameA: parsed.usernameA,
        usernameB: parsed.usernameB,
        fileName: importedFileName,
        platform: nextPlatform,
      };
      setDashboards((current) => [
        ...current.filter((item) => item.kind !== "default"),
        entry,
      ]);
      analysisByDashboard.set(id, analyzeChat(parsed.messages));
      setNextImportIndex((current) => current + 1);
      setActiveId(id);
      setFileName(importedFileName);
    },
    [nextImportIndex],
  );

  const importFile = useCallback(
    async (file: File, nextPlatform: ImportPlatform) => {
      const parsed = await importChatFile(file, nextPlatform);
      addImportedChat(parsed, file.name, nextPlatform);
    },
    [addImportedChat],
  );

  const removeDashboard = useCallback(
    (id: string) => {
      if (dashboards.length <= 1) return;
      const next = dashboards.filter((item) => item.id !== id);
      if (next.length === 0) return;
      clearWordCloudCache(id);
      analysisByDashboard.delete(id);
      setDashboards(next);
      setActiveId((current) => (current === id ? next[0].id : current));
    },
    [dashboards],
  );

  const mergeDashboards = useCallback(
    (ids: string[]) => {
      const uniqueIds = [...new Set(ids)];
      const picked = uniqueIds
        .map((id) => dashboards.find((item) => item.id === id))
        .filter(
          (item): item is StoredDashboard =>
            !!item && item.kind !== "default",
        );
      if (picked.length < 2) return false;

      for (const board of picked) {
        clearWordCloudCache(board.id);
        analysisByDashboard.delete(board.id);
      }

      const mergeIndex = nextMergeIndex;
      const id = `merge-${mergeIndex}`;
      const platforms = picked.map((item) => item.platform);
      const samePlatform = platforms.every((item) => item === platforms[0]);
      const usernameA = picked[0].usernameA;
      const usernameB = picked[0].usernameB;
      const messages = picked
        .flatMap((board) =>
          board.messages.map((message) => {
            const isA =
              board.usernameA != null &&
              (message.senderName === board.usernameA ||
                message.senderId === board.usernameA);
            const isB =
              board.usernameB != null &&
              (message.senderName === board.usernameB ||
                message.senderId === board.usernameB);
            return {
              ...message,
              id: `${board.id}:${message.id}`,
              senderName:
                isA && usernameA
                  ? usernameA
                  : isB && usernameB
                    ? usernameB
                    : message.senderName,
            };
          }),
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      analysisByDashboard.set(id, analyzeChat(messages));
      setDashboards((current) => [
        ...current.filter((item) => !picked.some((board) => board.id === item.id)),
        {
          id,
          kind: "merge",
          mergeIndex,
          messages,
          usernameA,
          usernameB,
          fileName: null,
          platform: samePlatform ? platforms[0] : picked[0].platform,
        },
      ]);
      setNextMergeIndex((current) => current + 1);
      setActiveId(id);
      return true;
    },
    [dashboards, nextMergeIndex],
  );

  const value = useMemo(
    () => ({
      dashboards,
      activeId,
      setActiveId,
      fileName,
      platform: active?.platform ?? null,
      analysis,
      importFile,
      addImportedChat,
      removeDashboard,
      mergeDashboards,
    }),
    [
      active?.platform,
      activeId,
      analysis,
      dashboards,
      fileName,
      importFile,
      addImportedChat,
      mergeDashboards,
      removeDashboard,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
