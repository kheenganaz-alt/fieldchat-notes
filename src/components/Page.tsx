import type { PropsWithChildren, ReactNode } from "react";
import { motion } from "framer-motion";
import SyncBadge from "./SyncBadge";

export default function Page({ title, subtitle, action, children }: PropsWithChildren<{ title: string; subtitle?: string; action?: ReactNode }>) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto min-h-screen w-full max-w-7xl px-4 safe-top sm:px-6 lg:px-8">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 lg:hidden"><SyncBadge /></div>
          <h1 className="text-2xl font-extrabold tracking-normal text-slate-950 dark:text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </motion.section>
  );
}
