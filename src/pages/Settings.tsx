import type { ReactNode } from "react";
import { LogOut, Camera, FileDown, Fingerprint, LockKeyhole, MapPin, MessageCircle, Mic, Moon, Palette, RefreshCw, Shield, Smartphone, Timer, User, Wifi, Zap, type LucideIcon } from "lucide-react";
import Page from "../components/Page";
import { quickEvents, useAppStore } from "../store/appStore";
import type { ExportFormat, UserSettings } from "../types";

export default function Settings() {
  const { settings, updateSettings, logout, user } = useAppStore();
  if (!settings) return null;

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => updateSettings({ [key]: value } as Partial<UserSettings>);
  const quickEventSettings = Object.fromEntries(quickEvents.map((event) => [event, settings.quickEventSettings?.[event] ?? true]));

  function toggleQuickEvent(event: string) {
    void set("quickEventSettings", {
      ...quickEventSettings,
      [event]: !quickEventSettings[event]
    });
  }

  return (
    <Page title="Settings" subtitle="Premium field controls, privacy, offline behavior, and discreet operation.">
      <div className="mx-auto max-w-lg space-y-6 pb-8">
        <section className="base-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-soft">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold">{user?.displayName ?? "Field Operator"}</p>
              <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MiniPill icon={Shield} label="Private data" />
            <MiniPill icon={Wifi} label={settings.offlineCache ? "Offline ready" : "Online only"} />
          </div>
        </section>

        <SettingSection title="Appearance">
          <SettingRow icon={Moon} label="Dark Mode">
            <Switch checked={settings.darkMode} onChange={(checked) => set("darkMode", checked)} />
          </SettingRow>
          <SettingRow icon={Palette} label="Theme" description="Base44-style primary color">
            <Segmented value={settings.themeAccent} options={[["shopit", "Shopit"], ["blue", "Blue"], ["slate", "Slate"]]} onChange={(value) => set("themeAccent", value as UserSettings["themeAccent"])} />
          </SettingRow>
        </SettingSection>

        <SettingSection title="Discreet Mode">
          <SettingRow icon={MessageCircle} label="Discreet Mode" description="App looks like a messaging app">
            <Switch checked={settings.discreetMode} onChange={(checked) => set("discreetMode", checked)} />
          </SettingRow>
          {settings.discreetMode && (
            <label className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 shrink-0 text-slate-500" />
              <div className="flex-1">
                <span className="text-sm font-medium">Fake Contact Name</span>
                <input value={settings.fakeContactName} onChange={(event) => set("fakeContactName", event.target.value)} placeholder="Mom" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-orange-500 dark:border-white/10 dark:bg-white/5" />
              </div>
            </label>
          )}
        </SettingSection>

        <SettingSection title="Recording">
          <SettingRow icon={Timer} label="Timestamp Precision">
            <Segmented value={settings.timestampPrecision} options={[["seconds", "Seconds"], ["minutes", "Minutes"]]} onChange={(value) => set("timestampPrecision", value as UserSettings["timestampPrecision"])} />
          </SettingRow>
          <SettingRow icon={Zap} label="Auto-open Timestamp">
            <Switch checked={settings.autoOpenTimestamp} onChange={(checked) => set("autoOpenTimestamp", checked)} />
          </SettingRow>
          <SettingRow icon={Mic} label="Voice Notes">
            <Switch checked={settings.voiceNotesEnabled} onChange={(checked) => set("voiceNotesEnabled", checked)} />
          </SettingRow>
          <SettingRow icon={Smartphone} label="Vibration">
            <Switch checked={settings.vibration} onChange={(checked) => set("vibration", checked)} />
          </SettingRow>
        </SettingSection>

        <SettingSection title="Quick Event Settings">
          <div className="grid grid-cols-2 gap-2">
            {quickEvents.map((event) => (
              <button key={event} onClick={() => toggleQuickEvent(event)} className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${quickEventSettings[event] ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300" : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"}`}>
                {event}
              </button>
            ))}
          </div>
        </SettingSection>

        <SettingSection title="Export">
          <SettingRow icon={FileDown} label="Default Format">
            <Segmented value={settings.defaultExportFormat} options={[["txt", "TXT"], ["csv", "CSV"], ["pdf", "PDF"]]} onChange={(value) => set("defaultExportFormat", value as ExportFormat)} />
          </SettingRow>
          <SettingRow icon={Camera} label="Include Photos">
            <Switch checked={settings.includePhotosInExports} onChange={(checked) => set("includePhotosInExports", checked)} />
          </SettingRow>
          <SettingRow icon={FileDown} label="Auto Share After Export">
            <Switch checked={settings.autoShareExports} onChange={(checked) => set("autoShareExports", checked)} />
          </SettingRow>
        </SettingSection>

        <SettingSection title="Offline">
          <SettingRow icon={Wifi} label="Offline Cache" description="Sessions, notes, routes, and timestamps">
            <Switch checked={settings.offlineCache} onChange={(checked) => set("offlineCache", checked)} />
          </SettingRow>
          <SettingRow icon={RefreshCw} label="Auto Sync">
            <Switch checked={settings.autoSync} onChange={(checked) => set("autoSync", checked)} />
          </SettingRow>
          <SettingRow icon={Smartphone} label="Auto-resume Session">
            <Switch checked={settings.autoResume} onChange={(checked) => set("autoResume", checked)} />
          </SettingRow>
        </SettingSection>

        <SettingSection title="Permissions">
          <PermissionRow icon={Camera} label="Camera" value={settings.permissionCamera} />
          <PermissionRow icon={Mic} label="Microphone" value={settings.permissionMicrophone} />
          <PermissionRow icon={MapPin} label="Location" value={settings.permissionLocation} />
        </SettingSection>

        <SettingSection title="Security">
          <SettingRow icon={LockKeyhole} label="PIN Lock">
            <Switch checked={settings.pinLock} onChange={(checked) => set("pinLock", checked)} />
          </SettingRow>
          {settings.pinLock && (
            <label className="flex items-center gap-3">
              <Fingerprint className="h-5 w-5 shrink-0 text-slate-500" />
              <div className="flex-1">
                <span className="text-sm font-medium">PIN Code</span>
                <input value={settings.pinCode ?? ""} inputMode="numeric" maxLength={6} onChange={(event) => set("pinCode", event.target.value.replace(/\D/g, ""))} placeholder="4-6 digits" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-orange-500 dark:border-white/10 dark:bg-white/5" />
              </div>
            </label>
          )}
        </SettingSection>

        <button onClick={logout} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </Page>
  );
}

function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="base-card space-y-4">
      <h3 className="base-section-title">{title}</h3>
      {children}
    </section>
  );
}

function SettingRow({ icon: Icon, label, description, children }: { icon: LucideIcon; label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button aria-pressed={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-sm transition-colors ${checked ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-700"}`}>
      <span className={`block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-white/5">
      {options.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${value === id ? "bg-white text-orange-600 shadow-sm dark:bg-slate-900 dark:text-orange-300" : "text-slate-500"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function PermissionRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">Requested only when used</p>
        </div>
      </div>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{value.replaceAll("_", " ")}</span>
    </div>
  );
}

function MiniPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
      <Icon size={14} />
      {label}
    </div>
  );
}
