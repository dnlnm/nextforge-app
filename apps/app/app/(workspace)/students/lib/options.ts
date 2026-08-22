export const REFERRAL_SOURCES = [
  "Friend / Word of mouth",
  "Facebook",
  "Instagram",
  "Google Search",
  "Banner / Flyer",
  "Walk-in",
  "WhatsApp broadcast",
  "Other",
];

export const FEE_DUE_DAYS = Array.from({ length: 28 }, (_, index) =>
  String(index + 1)
);

const ORDINAL_SUFFIXES: Record<string, string> = {
  "1": "st",
  "2": "nd",
  "3": "rd",
};

export const ordinalSuffix = (day: string) => ORDINAL_SUFFIXES[day] ?? "th";
