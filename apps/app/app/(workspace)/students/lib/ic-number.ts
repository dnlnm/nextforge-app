import type { Gender } from "@repo/schemas/enums";

/**
 * Malaysian IC / MyKid helpers shared by the Add Student form (live
 * auto-fill) and the create action (server-side re-derivation).
 *
 * IC layout: YYMMDD-SS-####  — 12 digits. The last digit encodes gender
 * (odd = male, even = female).
 */

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const twelveDigitsRegex = /^\d{12}$/;

export const normalizeIcNumber = (value: string): string =>
  digitsOnly(value).slice(0, 12);

export const isValidIcNumber = (value: string): boolean =>
  twelveDigitsRegex.test(normalizeIcNumber(value));

/** `YYMMDD` → `yyyy-MM-dd` calendar date, or null when implausible. */
export const deriveDateOfBirthFromIc = (ic: string): string | null => {
  const digits = normalizeIcNumber(ic);

  if (digits.length < 6) {
    return null;
  }

  const yy = Number.parseInt(digits.slice(0, 2), 10);
  const month = Number.parseInt(digits.slice(2, 4), 10);
  const day = Number.parseInt(digits.slice(4, 6), 10);

  if (month < 1 || month > 12 || day < 1 || day > 31 || Number.isNaN(yy)) {
    return null;
  }

  // Two-digit year pivot: anyone with yy above the current two-digit year was
  // born in the previous century.
  const century = yy > new Date().getFullYear() % 100 ? "19" : "20";
  const year = `${century}${String(yy).padStart(2, "0")}`;
  const monthPart = String(month).padStart(2, "0");
  const dayPart = String(day).padStart(2, "0");
  const iso = `${year}-${monthPart}-${dayPart}`;

  return Number.isNaN(Date.parse(iso)) ? null : iso;
};

export const deriveGenderFromIc = (ic: string): Gender | null => {
  const digits = normalizeIcNumber(ic);

  if (digits.length !== 12) {
    return null;
  }

  const lastDigit = Number.parseInt(digits.at(-1) ?? "", 10);

  if (Number.isNaN(lastDigit)) {
    return null;
  }

  return lastDigit % 2 === 1 ? "MALE" : "FEMALE";
};
