import { CheckCircle2, CloudOff, Loader2, Wifi, AlertCircle } from "lucide-react";
import { useAppStore } from "../store/appStore";

export default function SyncBadge() {
  const state = useAppStore((store) => store.syncState);
  const config = {
    online: { label: "Online", icon: Wifi, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300" },
    offline: { label: "Offline", icon: CloudOff, className: "text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300" },
    syncing: { label: "Syncing", icon: Loader2, className: "text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300 animate-pulse" },
    saved: { label: "Saved", icon: CheckCircle2, className: "text-slate-600 bg-slate-100 dark:bg-white/10 dark:text-slate-300" },
    error: { label: "Sync issue", icon: AlertCircle, className: "text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300" }
  }[state];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}
