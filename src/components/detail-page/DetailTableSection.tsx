import { DetailSection } from "./DetailSection";
import { cn } from "@/lib/utils";

type DetailTableSectionProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tableClassName?: string;
};

export function DetailTableSection({
  title,
  description,
  icon,
  headerAction,
  children,
  className,
  tableClassName,
}: DetailTableSectionProps) {
  return (
    <DetailSection
      title={title}
      description={description}
      icon={icon}
      headerAction={headerAction}
      padded={false}
      className={className}
    >
      <div className={cn("overflow-x-auto", tableClassName)}>{children}</div>
    </DetailSection>
  );
}
