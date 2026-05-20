import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Page from "../components/Page";
import { quickEvents, useAppStore } from "../store/appStore";

export default function Insights() {
  const { timestamps, sessions } = useAppStore();
  const eventCounts = quickEvents.map((label) => ({ label, count: timestamps.filter((event) => event.label === label).length })).filter((item) => item.count > 0);
  const averageDuration = sessions.length ? Math.round(sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / sessions.length / 60) : 0;

  return (
    <Page title="Insights" subtitle="Patterns across service moments, audit flow, and route activity.">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="glass rounded-2xl p-4">
          <h2 className="mb-4 text-lg font-extrabold">Event frequency</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventCounts}>
                <XAxis dataKey="label" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass rounded-2xl p-4">
          <h2 className="text-lg font-extrabold">Session statistics</h2>
          <dl className="mt-4 space-y-4">
            <Stat label="Average duration" value={`${averageDuration} min`} />
            <Stat label="Total timestamps" value={timestamps.length} />
            <Stat label="Active sessions" value={sessions.filter((session) => session.status === "active").length} />
            <Stat label="Completed sessions" value={sessions.filter((session) => session.status === "completed").length} />
          </dl>
        </section>
      </div>
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-white/10"><dt className="font-bold text-slate-500">{label}</dt><dd className="text-xl font-extrabold">{value}</dd></div>;
}
