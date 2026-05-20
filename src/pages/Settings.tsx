import { LogOut, Moon, Smartphone, Vibrate, type LucideIcon } from "lucide-react";
import Page from "../components/Page";
import { useAppStore } from "../store/appStore";

export default function Settings() {
  const { settings, updateSettings, logout, user } = useAppStore();
  if (!settings) return null;

  return (
    <Page title="Settings" subtitle="Privacy, persistence, discreet mode, and mobile behavior.">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-2xl p-4">
          <h2 className="mb-4 text-lg font-extrabold">Account</h2>
          <p className="font-bold">{user?.displayName}</p>
          <p className="text-sm font-semibold text-slate-500">{user?.email}</p>
          <button onClick={logout} className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950"><LogOut size={18} /> Sign out</button>
        </section>
        <section className="glass rounded-2xl p-4">
          <h2 className="mb-4 text-lg font-extrabold">Mobile controls</h2>
          <Toggle icon={Moon} label="Dark mode" checked={settings.darkMode} onChange={(checked) => updateSettings({ darkMode: checked })} />
          <Toggle icon={Smartphone} label="Discreet mode" checked={settings.discreetMode} onChange={(checked) => updateSettings({ discreetMode: checked })} />
          <Toggle icon={Vibrate} label="Optional vibration" checked={settings.vibration} onChange={(checked) => updateSettings({ vibration: checked })} />
          <Toggle icon={Smartphone} label="Auto-resume unfinished session" checked={settings.autoResume} onChange={(checked) => updateSettings({ autoResume: checked })} />
        </section>
      </div>
    </Page>
  );
}

function Toggle({ label, checked, onChange, icon: Icon }: { label: string; checked: boolean; onChange: (checked: boolean) => void; icon: LucideIcon }) {
  return (
    <label className="mb-3 flex items-center justify-between gap-4 rounded-2xl bg-slate-100 p-3 dark:bg-white/10">
      <span className="flex items-center gap-3 font-bold"><Icon size={19} /> {label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-6 w-6 accent-blue-600" />
    </label>
  );
}
