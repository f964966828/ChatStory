export const EXPORT_IDLE_EVENT = "chatstory:export-idle";
export const EXPORT_WHITE = "#fefefe";
export const EXPORT_WHITE_FILL = `linear-gradient(${EXPORT_WHITE}, ${EXPORT_WHITE})`;

export function isFineMousePointer(
  event: { pointerType: string },
  lastTouchAt: number,
) {
  if (event.pointerType !== "mouse") return false;
  if (performance.now() - lastTouchAt < 800) return false;
  return window.matchMedia("(hover: hover)").matches;
}
