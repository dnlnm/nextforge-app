import {
  Card,
  CardContent,
  CardFrame,
  CardFrameHeader,
} from "@repo/design-system/components/ui/card";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface FormSectionCardProperties {
  readonly children: ReactNode;
  readonly icon: LucideIcon;
  readonly subtitle?: string;
  readonly title: string;
}

/**
 * Icon-chip section card used across the Add Student page — mirrors the
 * reference layout (header band with icon + title/subtitle, then body).
 */
export const FormSectionCard = ({
  children,
  icon: Icon,
  subtitle,
  title,
}: FormSectionCardProperties) => (
  <CardFrame className="isolate after:pointer-events-none after:absolute after:-inset-[5px] after:-z-1 after:rounded-[calc(var(--radius-xl)+4px)] after:border after:border-border/64 dark:bg-background">
    <CardFrameHeader>
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          {subtitle ? (
            <p className="text-muted-foreground text-xs">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </CardFrameHeader>
    <Card className="min-h-0 flex-1 flex-col dark:bg-background">
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  </CardFrame>
);
