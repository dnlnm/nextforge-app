export const DEFAULT_CURRENCY = "MYR";
export const DEFAULT_LOCALE = "en-MY";

export const SUPPORTED_CURRENCIES = ["MYR", "SGD", "USD"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const isSupportedCurrency = (
  value: string
): value is SupportedCurrency =>
  (SUPPORTED_CURRENCIES as readonly string[]).includes(value);

export interface FormatMoneyOptions {
  readonly currency?: string;
  readonly locale?: string;
  readonly maximumFractionDigits?: number;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

const getFormatter = (
  locale: string,
  currency: string,
  maximumFractionDigits: number | undefined
): Intl.NumberFormat => {
  const key = `${locale}|${currency}|${maximumFractionDigits ?? "default"}`;
  let formatter = formatterCache.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      currency,
      style: "currency",
      ...(maximumFractionDigits === undefined ? {} : { maximumFractionDigits }),
    });
    formatterCache.set(key, formatter);
  }

  return formatter;
};

const formatCurrency = (
  amount: number,
  {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    maximumFractionDigits,
  }: FormatMoneyOptions = {}
): string =>
  getFormatter(locale, currency, maximumFractionDigits).format(amount);

/**
 * Formats an amount stored in integer sen as a localized currency string,
 * e.g. `formatMoney(15000)` -> `"RM 150.00"`.
 */
export const formatMoney = (
  amountSen: number,
  options?: FormatMoneyOptions
): string => formatCurrency(amountSen / 100, options);

/**
 * Formats an amount stored in integer sen as a localized currency string
 * rounded to whole units, e.g. `formatMoneyWhole(150000)` -> `"RM 1,500"`.
 */
export const formatMoneyWhole = (
  amountSen: number,
  options?: FormatMoneyOptions
): string => formatMoney(amountSen, { maximumFractionDigits: 0, ...options });

/**
 * Formats a major-unit value (e.g. a chart axis already in ringgit) as a
 * localized currency string, rounding to whole units by default, e.g.
 * `formatMoneyValue(1234)` -> `"RM 1,234"`.
 */
export const formatMoneyValue = (
  value: number,
  options?: FormatMoneyOptions
): string => formatCurrency(value, { maximumFractionDigits: 0, ...options });

/**
 * Formats an amount stored in integer sen as a bare two-decimal string for
 * machine-readable exports, e.g. `formatMoneyCsv(15000)` -> `"150.00"`.
 */
export const formatMoneyCsv = (amountSen: number): string =>
  (amountSen / 100).toFixed(2);

/**
 * Formats an amount stored in integer sen as a compact `RM` string for
 * receipts and invoices, e.g. `formatMoneyRm(9900)` -> `"RM99.00"`.
 */
export const formatMoneyRm = (amountSen: number): string =>
  `RM${(amountSen / 100).toFixed(2)}`;
