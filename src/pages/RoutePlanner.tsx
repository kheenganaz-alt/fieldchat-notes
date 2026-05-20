import { ArrowDown, ArrowUp, ExternalLink, LocateFixed, Plus } from "lucide-react";
import Page from "../components/Page";
import { requestLocationOnDemand } from "../services/permissions";
import { useAppStore } from "../store/appStore";
import type { StopStatus } from "../types";

const statuses: StopStatus[] = ["Pending", "Arrived", "Completed", "Skipped", "Rescheduled"];

export default function RoutePlanner() {
  const { routes, stops, createRoute, updateStopStatus, moveStop } = useAppStore();
  const route = routes[0];
  const routeStops = route ? stops.filter((stop) => stop.routeId === route.id).sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const completed = routeStops.filter((stop) => stop.status === "Completed").length;

  async function locate() {
    await requestLocationOnDemand();
  }

  function openMaps() {
    const query = routeStops.map((stop) => stop.address).join("/");
    window.open(`https://www.google.com/maps/dir/${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <Page title="Route Planner" subtitle="Plan up to 20 stops, reorder manually, and launch the route when location work begins." action={<button onClick={createRoute} className="tap-target rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white"><Plus size={18} /></button>}>
      {!route ? (
        <button onClick={createRoute} className="glass flex w-full flex-col items-center justify-center gap-3 rounded-2xl p-10 text-center">
          <Plus size={32} className="text-blue-600" />
          <span className="text-lg font-extrabold">Create route</span>
        </button>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <section className="glass rounded-2xl p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold">{route.name}</h2>
                <p className="text-sm font-semibold text-slate-500">{route.estimatedMinutes} min estimated · {completed}/{routeStops.length} complete</p>
              </div>
              <button onClick={openMaps} className="tap-target rounded-2xl bg-slate-950 px-3 text-white dark:bg-white dark:text-slate-950"><ExternalLink size={18} /></button>
            </div>
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${routeStops.length ? (completed / routeStops.length) * 100 : 0}%` }} />
            </div>
            <div className="space-y-3">
              {routeStops.map((stop, index) => (
                <article key={stop.id} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-extrabold">{index + 1}. {stop.name}</p>
                      <p className="text-sm font-semibold text-slate-500">{stop.address}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveStop(stop.id, -1)} className="tap-target rounded-xl bg-slate-100 dark:bg-white/10"><ArrowUp size={17} /></button>
                      <button onClick={() => moveStop(stop.id, 1)} className="tap-target rounded-xl bg-slate-100 dark:bg-white/10"><ArrowDown size={17} /></button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {statuses.map((status) => (
                      <button key={status} onClick={() => updateStopStatus(stop.id, status)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${stop.status === status ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{status}</button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="glass rounded-2xl p-4">
            <div className="flex h-80 flex-col justify-between overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#dbeafe,#f0fdf4_48%,#ede9fe)] p-4 dark:bg-[linear-gradient(135deg,#172554,#064e3b_48%,#312e81)]">
              <button onClick={locate} className="ml-auto grid h-11 w-11 place-items-center rounded-2xl bg-white/90 text-blue-700 shadow-soft dark:bg-slate-950/80 dark:text-blue-200"><LocateFixed size={19} /></button>
              <div className="space-y-3">
                {routeStops.slice(0, 5).map((stop, index) => <div key={stop.id} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-extrabold text-blue-700 shadow-soft">{index + 1}</span><span className="h-1 flex-1 rounded-full bg-white/75" /></div>)}
              </div>
            </div>
          </section>
        </div>
      )}
    </Page>
  );
}
