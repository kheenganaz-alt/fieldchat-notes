import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { BarChart3, FileText, Home, Map, MessageSquareText, Search, Settings, Sparkles } from "lucide-react";
import SyncBadge from "./SyncBadge";
import { useAppStore } from "../store/appStore";

const items = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/sessions", label: "Sessions", icon: MessageSquareText },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/search", label: "Search", icon: Search },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/routes", label: "Map", icon: Map },
  { to: "/templates", label: "Templates", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings }
];

export default function AppShell() {
  const navigate = useNavigate();
  const { settings, startQuickSession } = useAppStore();
  const appName = settings?.discreetMode ? "Messages" : "FieldChat Notes";

  async function quickStart() {
    const session = await startQuickSession();
    navigate(`/session/${session.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200/80 bg-white/80 px-4 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-soft">
            <MessageSquareText size={22} />
          </div>
          <div>
            <p className="text-base font-bold">{appName}</p>
            <SyncBadge />
          </div>
        </div>
        <button onClick={quickStart} className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-soft">
          <MessageSquareText size={18} />
          Start Quick Session
        </button>
        <nav className="space-y-1">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}>
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-h-screen pb-24 lg:pl-72 lg:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/92 px-2 pt-2 backdrop-blur-xl safe-bottom dark:border-white/10 dark:bg-slate-950/92 lg:hidden">
        {items.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold ${isActive ? "text-orange-600 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}>
            <item.icon size={20} />
            <span className="max-w-full truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
