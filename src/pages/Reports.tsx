import { useState } from "react";
import { FileDown } from "lucide-react";
import Page from "../components/Page";
import { exportSession } from "../services/exporters";
import { elapsedSecondsSince, formatDateTime, formatElapsed } from "../lib/time";
import { useAppStore } from "../store/appStore";
import type { ExportFormat } from "../types";

export default function Reports() {
  const store = useAppStore();
  const [message, setMessage] = useState("");

  async function exportLatest(sessionId: string, format: ExportFormat) {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return;

    setMessage("");
    try {
      const result = await exportSession({
        session: {
          ...session,
          durationSeconds: session.status === "active" ? elapsedSecondsSince(session.startedAt) : session.durationSeconds
        },
        notes: store.notes.filter((note) => note.sessionId === sessionId),
        timestamps: store.timestamps.filter((event) => event.sessionId === sessionId),
        photos: store.photos.filter((photo) => photo.sessionId === sessionId)
      }, format);
      setMessage(`Export ready: ${result.filename}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    }
  }

  return (
    <Page title="Reports" subtitle="Create shareable PDF, DOCX, TXT, and CSV reports from saved field sessions.">
      {message && <p className={`mb-4 rounded-2xl px-4 py-3 text-sm font-bold ${message.startsWith("Export ready") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"}`}>{message}</p>}
      <div className="grid gap-3">
        {store.sessions.map((session) => (
          <article key={session.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{session.title}</p>
                <p className="text-sm font-semibold text-slate-500">
                  {formatDateTime(session.startedAt)} · {formatElapsed(session.status === "active" ? elapsedSecondsSince(session.startedAt) : session.durationSeconds)}
                </p>
              </div>
              <FileDown className="text-blue-600" />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {(["pdf", "docx", "txt", "csv"] as const).map((format) => (
                <button key={format} onClick={() => exportLatest(session.id, format)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold uppercase dark:bg-white/10">
                  {format}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Page>
  );
}
