import { GuideScreen } from "@/components/GuideScreen";
import { notFound } from "next/navigation";

const PLATFORMS = ["line", "meta", "messenger", "instagram", "threads"] as const;

type Platform = (typeof PLATFORMS)[number];

export function generateStaticParams() {
  return PLATFORMS.map((platform) => ({ platform }));
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;

  if (!PLATFORMS.includes(platform as Platform)) {
    notFound();
  }

  return <GuideScreen platform={platform as Platform} />;
}
