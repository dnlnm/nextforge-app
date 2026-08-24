import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./styles.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" suppressHydrationWarning className={inter.variable}>
    <body className="flex min-h-screen flex-col">
      <RootProvider search={{ enabled: false }}>
        {children}
      </RootProvider>
    </body>
  </html>
);

export default RootLayout;
