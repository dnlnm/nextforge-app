import type { ThemeProviderProps } from "next-themes";
import { AnchoredToastProvider, ToastProvider } from "./components/ui/toast";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./providers/theme";
import { FluidProvider } from "./providers/fluid";

type DesignSystemProviderProperties = ThemeProviderProps;

export const DesignSystemProvider = ({
  children,
  ...properties
}: DesignSystemProviderProperties) => (
  <ThemeProvider {...properties}>
    <FluidProvider>
      <ToastProvider>
        <AnchoredToastProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AnchoredToastProvider>
      </ToastProvider>
    </FluidProvider>
  </ThemeProvider>
);
