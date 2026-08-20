"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { AlertTriangleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Component, type ReactNode } from "react";

interface WidgetBoundaryProps {
  children: ReactNode;
  title: string;
}

interface WidgetBoundaryState {
  readonly failed: boolean;
}

// biome-ignore lint/style/useReactFunctionComponents: error boundaries must be class components
export class WidgetBoundary extends Component<
  WidgetBoundaryProps,
  WidgetBoundaryState
> {
  override state: WidgetBoundaryState = { failed: false };

  static getDerivedStateFromError(): WidgetBoundaryState {
    return { failed: true };
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return <WidgetError title={this.props.title} />;
    }

    return this.props.children;
  }
}

const WidgetError = ({ title }: { readonly title: string }) => {
  const router = useRouter();

  return (
    <div className="flex min-h-36 flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg border bg-background text-destructive">
        <AlertTriangleIcon className="size-5" />
      </div>
      <p className="font-medium text-sm">Unable to load {title}</p>
      <Button onClick={() => router.refresh()} size="sm" variant="outline">
        Retry
      </Button>
    </div>
  );
};
