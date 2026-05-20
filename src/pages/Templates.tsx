import { Sparkles } from "lucide-react";
import Page from "../components/Page";
import { reportTemplates } from "../data/constants";

export default function Templates() {
  return (
    <Page title="Templates" subtitle="Reusable field patterns for mystery shops, GIS surveys, inspections, and compliance work.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportTemplates.map((template) => (
          <article key={template.name} className="glass rounded-2xl p-4">
            <Sparkles className="mb-4 text-violet-600" />
            <h2 className="text-lg font-extrabold">{template.name}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{template.description}</p>
          </article>
        ))}
      </div>
    </Page>
  );
}
