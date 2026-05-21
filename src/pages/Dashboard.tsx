import { useNavigate } from "react-router-dom";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Clock, FileOutput, ListChecks, MessageSquareText, Route } from "lucide-react";
import Page from "../components/Page";
import MetricCard from "../components/MetricCard";
import { formatElapsed } from "../lib/time";
import { useAppStore } from "../store/appStore";

export default function Dashboard() {
  const navigate = useNavigate();
  const { sessions, timestamps, stops, exports, startQuickSession } = useAppStore();
  const completed = sessions.filter((session) => session.status === "completed").length;
  const routeProgress = stops.length ? Math.round((stops.filter((stop) => stop.status === "Completed").length / stops.length) * 100) : 0;
  const trend = lastSevenDays(sessions);
  const status = [
    { name: "Active", value: sessions.filter((session) => session.status === "active").length, color: "#2563eb" },
    { name: "Completed", value: completed, color: "#10b981" },
    { name: "Paused", value: sessions.filter((session) => session.status === "paused").length, color: "#f59e0b" }
  ];

  async function quickStart() {
    const session = await startQuickSession();
    navigate(`/session/${session.id}`);
  }

  return (
    <Page title="Dashboard" subtitle="Fast operational view across sessions, routes, exports, and field activity." action={<button onClick={quickStart} className="tap-target rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-soft">Start</button>}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Sessions" value={sessions.length} icon={MessageSquareText} tone="blue" />
        <MetricCard label="Completed Sessions" value={completed} icon={ListChecks} tone="mint" />
        <MetricCard label="Exports" value={exports.length} icon={FileOutput} tone="violet" />
        <MetricCard label="Route Progress" value={`${routeProgress}%`} icon={Route} tone="amber" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="glass rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Session trends</h2>
            <span className="text-xs font-bold text-slate-500">{timestamps.length} timestamps</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="sessionFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="sessions" stroke="#2563eb" fill="url(#sessionFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass rounded-2xl p-4">
          <h2 className="mb-4 text-lg font-extrabold">Status</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={status} innerRadius={52} outerRadius={82} dataKey="value" paddingAngle={4}>
                  {status.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2">
            {status.map((entry) => <div key={entry.name} className="flex items-center justify-between text-sm font-bold"><span>{entry.name}</span><span>{entry.value}</span></div>)}
          </div>
        </section>
      </div>

      <section className="mt-5 grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Saved sessions</h2>
          <button onClick={() => navigate("/sessions")} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">View all</button>
        </div>
        {sessions.slice(0, 5).map((session) => (
          <button key={session.id} onClick={() => navigate(`/session/${session.id}`)} className="glass flex items-center justify-between rounded-2xl p-4 text-left">
            <div>
              <p className="font-bold">{session.title}</p>
              <p className="text-sm font-semibold text-slate-500">{new Date(session.startedAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Clock size={17} />
              {formatElapsed(session.durationSeconds || Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000))}
            </div>
          </button>
        ))}
      </section>
    </Page>
  );
}

function lastSevenDays(sessions: { startedAt: string }[]) {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      day: date.toLocaleDateString(undefined, { weekday: "short" }),
      sessions: sessions.filter((session) => session.startedAt.startsWith(key)).length
    };
  });
}
