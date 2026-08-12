import type { ThemeProviderProps } from "next-themes";
import { AnchoredToastProvider, ToastProvider } from "./components/ui/toast";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./providers/theme";

type DesignSystemProviderProperties = ThemeProviderProps;

export const DesignSystemProvider = ({
  children,
  ...properties
}: DesignSystemProviderProperties) => (
  <ThemeProvider {...properties}>
    <ToastProvider>
      <AnchoredToastProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </AnchoredToastProvider>
    </ToastProvider>
  </ThemeProvider>
);
