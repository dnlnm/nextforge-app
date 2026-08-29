import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge doesn't know about the custom `--text-*` font-size scale
 * defined in globals.css — it only recognizes Tailwind's own default scale
 * (xs/sm/base/lg/...) as the `font-size` group. Without this, a custom
 * size like `text-meta` gets misclassified as a `text-color` utility (they
 * share the `text-` prefix) and silently dropped whenever a class list also
 * sets a real text color.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "title",
        "lede",
        "body",
        "control",
        "caption",
        "minor",
        "label",
        "2xs",
        "meta",
        "micro",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);