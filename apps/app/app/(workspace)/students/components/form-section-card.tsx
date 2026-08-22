import {
  CardContent,
  CardHeader,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
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
  <CardShell>
    <CardHeader>
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
    </CardHeader>
    <CardContent className="grid gap-4">{children}</CardContent>
  </CardShell>
);
