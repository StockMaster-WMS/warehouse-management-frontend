import type { LucideIcon } from "lucide-react";

type ComingSoonCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function ComingSoonCard({
  icon: Icon,
  title,
  description,
}: ComingSoonCardProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
        <Icon className="h-6 w-6 text-slate-400" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        {title}
      </h3>
      <p className="mt-2 text-sm font-medium text-slate-500">{description}</p>
    </div>
  );
}
