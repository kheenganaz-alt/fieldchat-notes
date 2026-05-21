import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { subscribeSync } from "./services/sync";
import { useAppStore } from "./store/appStore";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SessionRecorder from "./pages/SessionRecorder";
import Sessions from "./pages/Sessions";
import RoutePlanner from "./pages/RoutePlanner";
import Insights from "./pages/Insights";
import Search from "./pages/Search";
import Reports from "./pages/Reports";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";

export default function App() {
  const location = useLocation();
  const { hydrated, hydrate, user, setSyncState } = useAppStore();

  useEffect(() => {
    void hydrate();
    const unsubscribe = subscribeSync(setSyncState);
    const resume = () => void hydrate();
    window.addEventListener("fieldchat:resume", resume);
    return () => {
      unsubscribe();
      window.removeEventListener("fieldchat:resume", resume);
    };
  }, [hydrate, setSyncState]);

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-300">Loading secure workspace...</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
        <Route element={user ? <AppShell /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/session/:id" element={<SessionRecorder />} />
          <Route path="/routes" element={<RoutePlanner />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/search" element={<Search />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
