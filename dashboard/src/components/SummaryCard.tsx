import type { ReactNode } from "react";

export default function SummaryCard({ title, value, icon, hint }: {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
          <div className="mt-2 text-2xl font-semibold text-slate-100">{value}</div>
        </div>
        {icon ? <div className="text-sky-400">{icon}</div> : null}
      </div>
      {hint ? <p className="mt-3 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
