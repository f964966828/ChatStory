import { relayoutWordCloudBox } from "@/components/dashboard/WordCloud";
import {
  EXPORT_WHITE,
  EXPORT_WHITE_FILL,
} from "@/components/dashboard/export-idle";

function paintExportWhite(element: HTMLElement) {
  element.style.setProperty("background-color", EXPORT_WHITE, "important");
  element.style.setProperty("background-image", EXPORT_WHITE_FILL, "important");
}

function resetExportJumpCards(root: HTMLElement) {
  for (const element of root.querySelectorAll<HTMLElement>("[data-chat-jump]")) {
    if (element.hasAttribute("data-heatmap-day")) continue;
    element.removeAttribute("role");
    element.removeAttribute("tabindex");
    element.className = [...element.classList]
      .filter(
        (name) =>
          !name.startsWith("hover:") &&
          !name.startsWith("active:") &&
          !name.startsWith("scale-") &&
          name !== "cursor-pointer" &&
          name !== "select-none",
      )
      .join(" ");
    element.style.transform = "none";
    element.style.scale = "1";
    element.style.boxShadow = "none";
    element.style.backgroundColor = "#ffffff";
    element.style.borderColor = "#e9dcf8";
    element.style.borderWidth = "1px";
    element.style.borderStyle = "solid";
  }
}

function resetExportWhoMore(root: HTMLElement) {
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-who-more-slice]",
  )) {
    element.style.transform = "none";
    element.style.opacity = "1";
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-who-more-col]",
  )) {
    element.style.backgroundColor = "";
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-who-more-legend]",
  )) {
    element.style.overflow = "visible";
    element.style.textOverflow = "clip";
    element.style.whiteSpace = "nowrap";
    element.style.maxWidth = "none";
  }
}

function resetExportInitiative(root: HTMLElement) {
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-initiative-card]",
  )) {
    element.classList.remove(
      "-translate-y-0.5",
      "border-accent",
      "shadow-[0_6px_18px_-10px_rgb(124,92,191,0.55)]",
    );
    element.classList.add("border-card-border", "shadow-sm");
    element.style.setProperty("transform", "none", "important");
    element.style.setProperty("translate", "none", "important");
    element.style.setProperty("border-color", "#e9dcf8", "important");
    element.style.setProperty("box-shadow", "none", "important");
    element.style.setProperty("background-color", "#ffffff", "important");
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-initiative-loser]",
  )) {
    element.classList.remove("text-foreground", "text-black");
    element.classList.add("text-muted");
    element.style.setProperty("color", "#8b7aa3", "important");
  }
}

function resetExportStatHover(root: HTMLElement) {
  for (const element of root.querySelectorAll<HTMLElement>("[data-stat-hover]")) {
    element.style.setProperty("border-color", "#e9dcf8", "important");
    element.style.setProperty("background-color", "#ffffff", "important");
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-stat-hover-value]",
  )) {
    element.classList.remove("text-accent-deep");
    element.style.setProperty("transform", "none", "important");
    element.style.setProperty(
      "color",
      element.hasAttribute("data-stat-featured-value") ? "#7c5cbf" : "#4a3a63",
      "important",
    );
  }
}

function resetExportWordCloud(root: HTMLElement) {
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-word-cloud-item]",
  )) {
    element.style.transform = "none";
    element.style.filter = "none";
    element.style.color = element.dataset.wordColor || "#7c5cbf";
  }
}

function relayoutExportWordClouds(root: HTMLElement) {
  const boxes = [
    ...root.querySelectorAll<HTMLElement>("[data-word-cloud-box]"),
  ];
  if (!boxes.length) return;
  const allReady = boxes.every((box) => box.dataset.wordCloudReady === "true");
  if (!allReady) {
    for (const section of root.querySelectorAll("[data-word-cloud-section]")) {
      section.remove();
    }
    return;
  }
  for (const box of boxes) {
    relayoutWordCloudBox(box, false);
  }
}

function resetExportHeatmap(root: HTMLElement) {
  for (const element of root.querySelectorAll<HTMLElement>("[data-heatmap-day]")) {
    element.style.backgroundColor = "transparent";
    element.style.border = "0";
    element.style.boxShadow = "none";
    const fill = element.firstElementChild;
    if (fill instanceof HTMLElement) {
      fill.style.transform = "none";
      fill.style.opacity = "1";
      fill.style.boxShadow = "none";
    }
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-heatmap-month]",
  )) {
    element.style.setProperty("appearance", "none", "important");
    element.style.setProperty("-webkit-appearance", "none", "important");
    element.style.setProperty("background-color", "#b794f6", "important");
    element.style.setProperty("color", "#ffffff", "important");
    element.style.setProperty("border", "0", "important");
    element.style.setProperty("border-radius", "9999px", "important");
    element.style.setProperty("box-shadow", "none", "important");
    element.style.setProperty("transform", "none", "important");
    element.style.setProperty("width", "40px", "important");
    element.style.setProperty("height", "40px", "important");
    element.style.setProperty("min-width", "40px", "important");
    element.style.setProperty("min-height", "40px", "important");
    element.style.setProperty("padding", "0", "important");
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-heatmap-stat]",
  )) {
    element.style.setProperty("appearance", "none", "important");
    element.style.setProperty("-webkit-appearance", "none", "important");
    paintExportWhite(element);
    element.style.setProperty("border", "1px solid #e9dcf8", "important");
    element.style.setProperty("border-radius", "9999px", "important");
    element.style.setProperty("box-shadow", "none", "important");
    element.style.setProperty("transform", "none", "important");
    const [label, value] = element.querySelectorAll("span");
    if (label instanceof HTMLElement) {
      label.style.setProperty("color", "#8b7aa3", "important");
    }
    if (value instanceof HTMLElement) {
      value.style.setProperty("color", "#7c5cbf", "important");
    }
  }
}

function resetExportPeakRanks(root: HTMLElement) {
  for (const element of root.querySelectorAll<HTMLElement>("[data-peak-chip]")) {
    paintExportWhite(element);
    for (const child of element.querySelectorAll<HTMLElement>("button")) {
      paintExportWhite(child);
    }
  }
  for (const element of root.querySelectorAll<HTMLElement>("[data-peak-rank]")) {
    element.style.setProperty("background-color", "#7c5cbf", "important");
    element.style.setProperty("background-image", "none", "important");
    element.style.setProperty("color", "#ffffff", "important");
  }
}

function forceExportCardBackgrounds(root: HTMLElement) {
  const cards = root.querySelectorAll<HTMLElement>(
    "[data-initiative-card], [data-stat-hover], [data-chat-jump], .bg-card, .bg-white",
  );
  for (const element of cards) {
    if (element.hasAttribute("data-heatmap-day")) continue;
    if (element.hasAttribute("data-heatmap-month")) continue;
    if (element.hasAttribute("data-peak-rank")) continue;
    paintExportWhite(element);
  }
}

export async function createDesktopExportTarget(source: HTMLDivElement) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:1280px;height:1px;border:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument;
  if (!frameDocument) {
    iframe.remove();
    throw new Error("EXPORT_FRAME_FAILED");
  }

  frameDocument.open();
  frameDocument.write("<!doctype html><html><head></head><body></body></html>");
  frameDocument.close();
  frameDocument.documentElement.lang = document.documentElement.lang;
  frameDocument.documentElement.className = document.documentElement.className;
  frameDocument.body.className = document.body.className;
  const base = frameDocument.createElement("base");
  base.href = document.baseURI;
  frameDocument.head.appendChild(base);

  const stylePromises: Promise<void>[] = [];
  for (const styleNode of document.head.querySelectorAll(
    'style, link[rel="stylesheet"]',
  )) {
    const clone = styleNode.cloneNode(true) as HTMLElement;
    if (clone.tagName === "LINK") {
      const sourceLink = styleNode as HTMLLinkElement;
      const cloneLink = clone as HTMLLinkElement;
      cloneLink.href = sourceLink.href;
      stylePromises.push(
        new Promise((resolve) => {
          cloneLink.addEventListener("load", () => resolve(), { once: true });
          cloneLink.addEventListener("error", () => resolve(), { once: true });
          setTimeout(resolve, 3000);
        }),
      );
    }
    frameDocument.head.appendChild(clone);
  }

  frameDocument.body.style.cssText =
    "margin:0;padding:0;width:1280px;box-sizing:border-box;background:#f7f2fc;";
  const clone = source.cloneNode(true) as HTMLDivElement;
  clone.dataset.exportStatic = "true";
  clone.style.width = "1280px";
  clone.style.padding = "36px 24px 24px";
  clone.style.boxSizing = "border-box";
  clone.style.backgroundColor = "#f7f2fc";
  frameDocument.body.appendChild(clone);
  for (const element of clone.querySelectorAll<HTMLElement>(
    "[data-export-visible]",
  )) {
    element.style.opacity = "1";
  }
  const exportTitle = clone.querySelector<HTMLElement>("[data-export-title]");
  if (exportTitle) exportTitle.style.paddingRight = "260px";
  for (const heading of clone.querySelectorAll<HTMLElement>("h2")) {
    heading.style.whiteSpace = "nowrap";
  }
  clone.style.boxShadow = "none";
  clone.style.textShadow = "none";
  for (const element of clone.querySelectorAll<HTMLElement>("*")) {
    element.style.boxShadow = "none";
    element.style.textShadow = "none";
  }
  for (const element of clone.querySelectorAll<HTMLElement>(
    "[data-export-chart-bar]",
  )) {
    element.style.backgroundColor = element.classList.contains("bg-accent-deep")
      ? "#7c5cbf"
      : "rgba(183, 148, 246, 0.8)";
  }
  resetExportJumpCards(clone);
  resetExportHeatmap(clone);
  resetExportWhoMore(clone);
  resetExportInitiative(clone);
  resetExportStatHover(clone);
  resetExportWordCloud(clone);

  await Promise.all(stylePromises);
  await frameDocument.fonts.ready;
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  forceExportCardBackgrounds(clone);
  resetExportPeakRanks(clone);
  relayoutExportWordClouds(clone);
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => resolve()),
  );
  iframe.style.height = `${Math.ceil(clone.scrollHeight)}px`;

  return {
    node: clone,
    cleanup: () => iframe.remove(),
  };
}
