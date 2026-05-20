import { FileDown } from "lucide-react";
import Page from "../components/Page";
import { exportSession } from "../services/exporters";
import { formatDateTime, formatElapsed } from "../lib/time";
import { useAppStore } from "../store/appStore";

export default function Reports() {
  const store = useAppStore();

  async function exportLatest(sessionId: string, format: "pdf" | "docx" | "txt" | "csv") {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return;
    await exportSession({
      session,
      notes: store.notes.filter((note) => note.sessionId === sessionId),
      timestamps: store.timestamps.filter((event) => event.sessionId === sessionId),
      photos: store.photos.filter((photo) => photo.sessionId === sessionId)
    }, format);
  }

  return (
    <Page title="Reports" subtitle="Export complete sessions only when there is real content to share.">
      <div className="grid gap-3">
        {store.sessions.map((session) => (
          <article key={session.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{session.title}</p>
                <p className="text-sm font-semibold text-slate-500">{formatDateTime(session.startedAt)} · {formatElapsed(session.durationSeconds)}</p>
              </div>
              <FileDown className="text-blue-600" />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {(["pdf", "docx", "txt", "csv"] as const).map((format) => <button key={format} onClick={() => exportLatest(session.id, format)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold uppercase dark:bg-white/10">{format}</button>)}
            </div>
          </article>
        ))}
      </div>
    </Page>
  );
}
