const HTTPS_URL_RE = /https:\/\/[^\s<>"'）】」』]+/gi;
const TRAILING_PUNCT_RE = /[.,;:!?、。，；：！？)\]}>]+$/u;

export function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeHttpsUrl(raw: string) {
  const href = raw.replace(TRAILING_PUNCT_RE, "");
  return isHttpsUrl(href) ? href : null;
}

export function firstHttpsUrl(text: string) {
  const re = new RegExp(HTTPS_URL_RE.source, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const href = normalizeHttpsUrl(match[0]);
    if (href) return href;
  }
  return null;
}

export function isUrlOnlyMessage(text: string) {
  const href = firstHttpsUrl(text);
  return href != null && text.trim() === href;
}

export function hostnameOf(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function splitHttpsText(text: string) {
  const parts: { type: "text" | "link"; value: string }[] = [];
  const re = new RegExp(HTTPS_URL_RE.source, "gi");
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const raw = match[0];
    const href = normalizeHttpsUrl(raw);
    const trailing = href ? raw.slice(href.length) : "";
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    if (href) {
      parts.push({ type: "link", value: href });
      if (trailing) parts.push({ type: "text", value: trailing });
    } else {
      parts.push({ type: "text", value: raw });
    }
    last = match.index + raw.length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts;
}
