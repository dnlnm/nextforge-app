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
        // fluid type-scale roles (additive; trovecn names kept above)
        "subtitle",
      ],
    },
    classGroups: {
      // fluid surface ladder: bg-surface-N are background colors, but
      // tailwind-merge can't know custom names — without this,
      // cn("bg-surface-3", "bg-surface-5") would keep both instead of the latter.
      "bg-color": [
        "bg-surface-1",
        "bg-surface-2",
        "bg-surface-3",
        "bg-surface-4",
        "bg-surface-5",
        "bg-surface-6",
        "bg-surface-7",
        "bg-surface-8",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);