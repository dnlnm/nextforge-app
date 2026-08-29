import localFont from "next/font/local";
import { Geist } from "next/font/google";

/** Geist variable font, as used by the trovecn theme. */
export const fontSans = Geist({
  display: "swap",
  variable: "--font-sans",
  subsets: ["latin"],
});

/** Same variable font as `fontSans`; aliased in the theme via `--font-heading: var(--font-sans)`. */
export const fontHeading = fontSans;

/** KLIO.MY wordmark font (Chillax Semibold), used via the `--font-brand` token. */
export const fontBrand = localFont({
  display: "swap",
  src: "./Chillax-Semibold.woff2",
  variable: "--font-brand",
  weight: "600",
});

export const fonts = `${fontSans.variable} ${fontBrand.variable} antialiased`;