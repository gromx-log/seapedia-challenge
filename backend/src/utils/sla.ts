export const SLA_WINDOWS = {
  INSTANT: 1 * 24 * 60 * 60 * 1000,   // 1 day in ms
  NEXT_DAY: 2 * 24 * 60 * 60 * 1000,  // 2 days in ms
  REGULAR: 4 * 24 * 60 * 60 * 1000,   // 4 days in ms
};

export function getSlaDuration(method: string): number {
  const normalized = method.toUpperCase();
  if (normalized === "INSTANT") return SLA_WINDOWS.INSTANT;
  if (normalized === "NEXT_DAY") return SLA_WINDOWS.NEXT_DAY;
  if (normalized === "REGULAR") return SLA_WINDOWS.REGULAR;
  return SLA_WINDOWS.REGULAR; // Default fallback
}
