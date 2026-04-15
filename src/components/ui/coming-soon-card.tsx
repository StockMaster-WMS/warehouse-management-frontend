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
    <div className="rounded-lg border border-dashed border-border bg-muted/55 p-6">
      <div className="ui-icon-tile mb-4 h-12 w-12 bg-card shadow-sm">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="ui-label text-sm text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{description}</p>
    </div>
  );
}
