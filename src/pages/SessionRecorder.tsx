import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Check, Mic, Plus, Send, Timer, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { quickEvents, sessionEvents, useAppStore } from "../store/appStore";
import { capturePhotoOnDemand, requestMicrophoneOnDemand, vibrateIfEnabled } from "../services/permissions";
import { exportSession } from "../services/exporters";
import { elapsedSecondsSince, formatClock, formatElapsed } from "../lib/time";

export default function SessionRecorder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const scroller = useRef<HTMLDivElement>(null);
  const tapTimer = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [exportError, setExportError] = useState("");
  const store = useAppStore();
  const savedScroll = id ? store.scroll[id] : undefined;
  const setScroll = store.setScroll;
  const session = store.sessions.find((item) => item.id === id);
  const events = id ? sessionEvents(id) : [];
  const draft = id ? store.drafts[id] ?? "" : "";

  useEffect(() => {
    if (!session) return;
    setElapsed(elapsedSecondsSince(session.startedAt));
    const interval = window.setInterval(() => setElapsed(elapsedSecondsSince(session.startedAt)), 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const node = scroller.current;
    if (!node || !id) return;
    node.scrollTop = savedScroll ?? node.scrollHeight;
    const listener = () => setScroll(id, node.scrollTop);
    node.addEventListener("scroll", listener, { passive: true });
    return () => node.removeEventListener("scroll", listener);
  }, [id, savedScroll, setScroll]);

  if (!session || !id) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center font-bold text-slate-500 dark:bg-slate-950">Session not found.</div>;
  }
  const sessionId = id;
  const activeSession = session;

  async function stamp(label = "Timestamp", method: "single" | "double" | "long" | "floating" | "chip" = "single") {
    await vibrateIfEnabled(store.settings?.vibration ?? true);
    await store.addTimestamp(sessionId, label, method);
  }

  function handleTap() {
    if (tapTimer.current) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = null;
      void stamp("Double Tap", "double");
      return;
    }
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = null;
      void stamp("Quick Mark", "single");
    }, 190);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await store.addNote(sessionId, draft);
  }

  async function photo() {
    const image = await capturePhotoOnDemand();
    if (image.dataUrl) await store.addPhoto(sessionId, image.dataUrl, "Photo Taken");
  }

  async function voice() {
    await requestMicrophoneOnDemand();
    await stamp("Voice Note Started", "chip");
  }

  async function doExport(format: "pdf" | "docx" | "txt" | "csv") {
    setExportError("");
    try {
      await exportSession({
        session: { ...activeSession, durationSeconds: elapsed },
        notes: store.notes.filter((note) => note.sessionId === sessionId),
        timestamps: store.timestamps.filter((event) => event.sessionId === sessionId),
        photos: store.photos.filter((photo) => photo.sessionId === sessionId)
      }, format);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    }
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="z-20 border-b border-white/70 bg-white/84 px-4 safe-top shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/86">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 py-3">
          <button onClick={() => navigate("/")} className="tap-target rounded-2xl bg-slate-100 px-3 text-sm font-bold dark:bg-white/10">Back</button>
          <div className="min-w-0 text-center">
            <p className="truncate text-base font-extrabold">{store.settings?.discreetMode ? "Messages" : session.title}</p>
            <p className="flex items-center justify-center gap-1 text-xs font-bold text-slate-500"><Timer size={13} />{formatElapsed(elapsed)}</p>
          </div>
          <button onClick={() => store.completeSession(id)} className="tap-target rounded-2xl bg-emerald-600 px-3 text-sm font-bold text-white"><Check size={17} /></button>
        </div>
      </header>

      <div ref={scroller} onClick={handleTap} onDoubleClick={(event) => event.preventDefault()} onContextMenu={(event) => { event.preventDefault(); void stamp("Long Press", "long"); }} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {events.map((entry) => (
            <motion.div key={`${entry.type}-${entry.at}`} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={entry.type === "note" ? "self-end" : "self-start"}>
              {entry.type === "timestamp" && (
                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-soft dark:bg-slate-900">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-300">{formatClock(entry.event.occurredAt)}  +{formatElapsed(entry.event.elapsedSeconds)}</p>
                  <p className="mt-1 font-bold">{entry.event.label ?? "Timestamp"}</p>
                </div>
              )}
              {entry.type === "note" && (
                <div className="max-w-[82vw] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-white shadow-soft sm:max-w-lg">
                  <p className="whitespace-pre-wrap text-sm font-semibold">{entry.note.body}</p>
                  <p className="mt-1 text-right text-[11px] font-bold text-blue-100">{formatClock(entry.note.createdAt)}</p>
                </div>
              )}
              {entry.type === "photo" && (
                <div className="rounded-2xl rounded-bl-md bg-white p-2 shadow-soft dark:bg-slate-900">
                  <img src={entry.photo.dataUrl} alt={entry.photo.caption ?? "Captured evidence"} className="max-h-72 w-64 rounded-xl object-cover" />
                  <p className="px-2 py-1 text-xs font-bold text-slate-500">{formatClock(entry.photo.createdAt)}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <button aria-label="Instant timestamp" onClick={() => stamp("Floating Mark", "floating")} className="fixed bottom-36 right-4 z-30 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-glass active:scale-95 lg:right-8">
        <Zap size={28} />
      </button>

      <footer className="z-20 border-t border-slate-200 bg-white/94 px-3 pt-3 backdrop-blur-xl safe-bottom dark:border-white/10 dark:bg-slate-950/94">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickEvents.map((event) => (
              <button key={event} onClick={() => stamp(event, "chip")} className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{event}</button>
            ))}
          </div>
          <form onSubmit={submit} className="flex items-end gap-2">
            <button type="button" onClick={photo} className="tap-target rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200"><Camera size={20} /></button>
            <button type="button" onClick={voice} className="tap-target rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200"><Mic size={20} /></button>
            <textarea value={draft} onChange={(event) => store.setDraft(id, event.target.value)} placeholder="Message" rows={1} className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5" />
            <button type="submit" className="tap-target rounded-2xl bg-blue-600 text-white"><Send size={19} /></button>
          </form>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex gap-1">
              {(["pdf", "docx", "txt", "csv"] as const).map((format) => <button key={format} onClick={() => doExport(format)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold uppercase dark:bg-white/10">{format}</button>)}
            </div>
            {exportError && <p className="text-right text-xs font-bold text-rose-600">{exportError}</p>}
            {!exportError && <Plus size={16} className="text-slate-400" />}
          </div>
        </div>
      </footer>
    </div>
  );
}
