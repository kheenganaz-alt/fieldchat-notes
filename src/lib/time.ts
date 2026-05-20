import { format } from "date-fns";

export function nowIso() {
  return new Date().toISOString();
}

export function formatClock(iso: string) {
  return format(new Date(iso), "h:mm:ss a");
}

export function formatDateTime(iso: string) {
  return format(new Date(iso), "MMM d, yyyy h:mm:ss a");
}

export function elapsedSecondsSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}

export function formatElapsed(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}
