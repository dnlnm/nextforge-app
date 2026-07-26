import { env } from "@/env";
import "./styles.css";
import { AnalyticsProvider } from "@repo/analytics/provider";
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

const getWebUrl = () => {
  try {
    return new URL(env.NEXT_PUBLIC_WEB_URL).toString();
  } catch {
    return "http://localhost:3001";
  }
};

const webUrl = getWebUrl();

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html className={fonts} lang="en" suppressHydrationWarning>
    <body>
      <AnalyticsProvider>
        <DesignSystemProvider
          helpUrl={env.NEXT_PUBLIC_DOCS_URL}
          privacyUrl={new URL("/legal/privacy", webUrl).toString()}
          termsUrl={new URL("/legal/terms", webUrl).toString()}
        >
          {children}
        </DesignSystemProvider>
      </AnalyticsProvider>
      <Toolbar />
    </body>
  </html>
);

export default RootLayout;
