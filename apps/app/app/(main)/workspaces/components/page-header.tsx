import type { ReactNode } from "react";

interface WorkspacePageHeaderProperties {
  readonly count: number;
  readonly description: string;
  readonly icon: ReactNode;
  readonly title: string;
}

export const WorkspacePageHeader = ({
  count,
  description,
  icon,
  title,
}: WorkspacePageHeaderProperties) => {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="font-semibold text-3xl tracking-tight">{title}</h1>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <p className="text-muted-foreground text-sm">
        {count} centre{count === 1 ? "" : "s"}
      </p>
    </div>
  );
};
