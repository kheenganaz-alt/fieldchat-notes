import { FormEvent, type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, type LucideIcon } from "lucide-react";
import { useAppStore } from "../store/appStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((store) => store.login);
  const [email, setEmail] = useState("field.user@example.com");
  const [password, setPassword] = useState("fieldchat-demo");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Private field notes, ready offline." icon={MessageCircle}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white shadow-soft dark:bg-white dark:text-slate-950">Sign in</button>
      </form>
      <p className="mt-5 text-center text-sm font-semibold text-slate-500">New workspace? <Link className="text-blue-600" to="/signup">Create account</Link></p>
    </AuthFrame>
  );
}

export function AuthFrame({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),radial-gradient(circle_at_bottom_right,#ede9fe,transparent_32%),#f8fafc] px-4 safe-top safe-bottom dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-white/60 bg-white/86 p-6 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/86">
        <div className="mb-7 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-soft">
            <Icon size={27} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white">{title}</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}

export function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-600 dark:text-slate-300">{label}</span>
      <input value={value} type={type} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
    </label>
  );
}
