import "./styles.css";
import { AnalyticsProvider } from "@repo/analytics/provider";
import { AuthProvider } from "@repo/auth/provider";
import { DesignSystemProvider } from "@repo/design-system";
import { fonts } from "@repo/design-system/lib/fonts";
import { Toolbar } from "@repo/feature-flags/components/toolbar";
import type { Metadata } from "next";
import type { ReactNode } from "react";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

export const metadata: Metadata = {
  title: "TLAS.MY",
  description: "Bilingual tuition centre administration for Malaysia.",
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html className={fonts} lang="en" suppressHydrationWarning>
    <body>
      <AnalyticsProvider>
        <DesignSystemProvider>
          <AuthProvider>{children}</AuthProvider>
        </DesignSystemProvider>
      </AnalyticsProvider>
      <Toolbar />
    </body>
  </html>
);

export default RootLayout;
