import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { AuthFrame, Field } from "./Login";

export default function Signup() {
  const navigate = useNavigate();
  const register = useAppStore((store) => store.register);
  const [displayName, setDisplayName] = useState("Field Operator");
  const [email, setEmail] = useState("field.user@example.com");
  const [password, setPassword] = useState("fieldchat-demo");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await register(email, password, displayName);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    }
  }

  return (
    <AuthFrame title="Create workspace" subtitle="User-scoped data from the first record." icon={ShieldCheck}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Display name" value={displayName} onChange={setDisplayName} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white shadow-soft dark:bg-white dark:text-slate-950">Create account</button>
      </form>
      <p className="mt-5 text-center text-sm font-semibold text-slate-500">Already registered? <Link className="text-blue-600" to="/login">Sign in</Link></p>
    </AuthFrame>
  );
}
