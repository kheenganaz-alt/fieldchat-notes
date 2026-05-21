import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock3, MessageSquareText, Search, Timer, type LucideIcon } from "lucide-react";
import Page from "../components/Page";
import { elapsedSecondsSince, formatDateTime, formatElapsed } from "../lib/time";
import { exportSession } from "../services/exporters";
import { useAppStore } from "../store/appStore";
import type { ExportFormat, FieldSession } from "../types";

export default function Sessions() {
  const navigate = useNavigate();
  const store = useAppStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return store.sessions.filter((session) => {
      const matchesText = !needle || session.title.toLowerCase().includes(needle);
      const matchesStatus = status === "all" || session.status === status;
      return matchesText && matchesStatus;
    });
  }, [query, status, store.sessions]);

  async function exportOne(session: FieldSession, format: ExportFormat) {
    setMessage("");
    try {
      const result = await exportSession({
        session: withLiveDuration(session),
        notes: store.notes.filter((note) => note.sessionId === session.id),
        timestamps: store.timestamps.filter((event) => event.sessionId === session.id),
        photos: store.photos.filter((photo) => photo.sessionId === session.id)
      }, format);
      setMessage(`Export ready: ${result.filename}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    }
  }

  return (
    <Page title="Saved Sessions" subtitle="All saved shops, inspections, surveys, and field visits stay here for reopening or export.">
      <section className="glass mb-4 rounded-2xl p-3">
        <label className="flex items-center gap-3 rounded-2xl bg-slate-100 px-3 py-2 dark:bg-white/10">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved sessions" className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {["all", "active", "completed", "paused"].map((item) => (
            <button key={item} onClick={() => setStatus(item)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-extrabold capitalize ${status === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{item}</button>
          ))}
        </div>
      </section>

      {message && <p className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{message}</p>}

      <div className="grid gap-3">
        {filtered.map((session) => {
          const notes = store.notes.filter((note) => note.sessionId === session.id).length;
          const stamps = store.timestamps.filter((event) => event.sessionId === session.id).length;
          const live = withLiveDuration(session);
          return (
            <article key={session.id} className="glass rounded-2xl p-4">
              <button onClick={() => navigate(`/session/${session.id}`)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold">{session.title}</p>
                    <p className="text-sm font-semibold text-slate-500">{formatDateTime(session.startedAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold capitalize ${session.status === "completed" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"}`}>{session.status}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <MiniStat icon={Timer} label="Duration" value={formatElapsed(live.durationSeconds)} />
                  <MiniStat icon={Clock3} label="Marks" value={stamps} />
                  <MiniStat icon={MessageSquareText} label="Notes" value={notes} />
                </div>
              </button>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button onClick={() => navigate(`/session/${session.id}`)} className="flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                  <MessageSquareText size={18} />
                  Open
                </button>
                <div className="flex gap-1 overflow-x-auto">
                  {(["pdf", "docx", "txt", "csv"] as const).map((format) => (
                    <button key={format} onClick={() => exportOne(session, format)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold uppercase dark:bg-white/10">
                      {format}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!filtered.length && (
        <div className="glass rounded-2xl p-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 text-blue-600" size={34} />
          <p className="text-lg font-extrabold">No saved sessions found</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Start a quick session and it will appear here instantly.</p>
        </div>
      )}
    </Page>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3 dark:bg-white/10">
      <Icon className="mx-auto mb-1 text-blue-600" size={17} />
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="truncate text-sm font-extrabold">{value}</p>
    </div>
  );
}

function withLiveDuration(session: FieldSession) {
  return {
    ...session,
    durationSeconds: session.status === "active" ? elapsedSecondsSince(session.startedAt) : session.durationSeconds
  };
}
