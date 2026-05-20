import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import Page from "../components/Page";
import { formatDateTime } from "../lib/time";
import { useAppStore } from "../store/appStore";

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { sessions, notes, timestamps } = useAppStore();
  const results = useMemo(() => {
    const needle = query.toLowerCase();
    if (!needle) return [];
    return [
      ...sessions.filter((session) => session.title.toLowerCase().includes(needle)).map((session) => ({ id: session.id, sessionId: session.id, title: session.title, detail: formatDateTime(session.startedAt) })),
      ...notes.filter((note) => note.body.toLowerCase().includes(needle)).map((note) => ({ id: note.id, sessionId: note.sessionId, title: note.body, detail: formatDateTime(note.createdAt) })),
      ...timestamps.filter((event) => (event.label ?? "").toLowerCase().includes(needle)).map((event) => ({ id: event.id, sessionId: event.sessionId, title: event.label ?? "Timestamp", detail: formatDateTime(event.occurredAt) }))
    ];
  }, [query, sessions, notes, timestamps]);

  return (
    <Page title="Search" subtitle="Find timestamps, notes, labels, and sessions without leaving offline mode.">
      <label className="glass mb-4 flex items-center gap-3 rounded-2xl px-4 py-3">
        <SearchIcon size={20} className="text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search field records" className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none" />
      </label>
      <div className="grid gap-3">
        {results.map((result) => (
          <button key={result.id} onClick={() => navigate(`/session/${result.sessionId}`)} className="glass rounded-2xl p-4 text-left">
            <p className="line-clamp-2 font-extrabold">{result.title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{result.detail}</p>
          </button>
        ))}
      </div>
    </Page>
  );
}
