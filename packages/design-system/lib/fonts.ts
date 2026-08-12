import localFont from "next/font/local";

/** Cal Sans 2.0 variable font, as used by coss.com (`@coss/ui/fonts`). */
export const fontSans = localFont({
  display: "swap",
  src: "./CalSansVF.woff2",
  variable: "--font-sans",
  weight: "300 700",
});

/** Same variable font as `fontSans`; aliased in the theme via `--font-heading: var(--font-sans)`. */
export const fontHeading = fontSans;

export const fonts = `${fontSans.variable} antialiased`;
