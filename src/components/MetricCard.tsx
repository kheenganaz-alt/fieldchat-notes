import type { LucideIcon } from "lucide-react";

export default function MetricCard({ label, value, icon: Icon, tone = "blue" }: { label: string; value: string | number; icon: LucideIcon; tone?: "blue" | "violet" | "mint" | "amber" }) {
  const colors = {
    blue: "from-orange-500 to-red-500",
    violet: "from-orange-500 to-amber-500",
    mint: "from-emerald-600 to-teal-500",
    amber: "from-amber-500 to-orange-500"
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${colors[tone]} text-white shadow-soft`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
