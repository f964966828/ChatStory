import { SiteLogo } from "@/components/SiteLogo";
import { hostnameOf } from "@/lib/https-links";
import { siteBrandOf, siteLabelOf } from "@/lib/site-brand";

export function LinkPreview({ href }: { href: string }) {
  const brand = siteBrandOf(href);
  const label = siteLabelOf(href);
  const host = hostnameOf(href) || href;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-card-border bg-white px-3 py-2 text-left text-foreground shadow-sm"
    >
      {brand ? (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-stone-50">
          <SiteLogo brand={brand} size={18} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-5">{label}</p>
        <p className="mt-0.5 break-all text-xs leading-4 text-muted">{href}</p>
        {brand ? (
          <p className="mt-1 truncate text-[11px] text-muted">{host}</p>
        ) : null}
      </span>
    </a>
  );
}
