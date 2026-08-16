import { describe, expect, test } from "vitest";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  formatMoneyCsv,
  formatMoneyRm,
  formatMoneyValue,
  formatMoneyWhole,
  isSupportedCurrency,
  SUPPORTED_CURRENCIES,
} from "..";

describe("currency metadata", () => {
  test("defaults to the Malaysian ringgit", () => {
    expect(DEFAULT_CURRENCY).toBe("MYR");
  });

  test("recognises supported currency codes", () => {
    expect(SUPPORTED_CURRENCIES).toEqual(["MYR", "SGD", "USD"]);
    expect(isSupportedCurrency("MYR")).toBe(true);
    expect(isSupportedCurrency("EUR")).toBe(false);
  });
});

describe("formatMoney", () => {
  test("formats sen as a localized MYR string", () => {
    expect(formatMoney(15_000)).toBe("RM\u00A0150.00");
    expect(formatMoney(99)).toBe("RM\u00A00.99");
    expect(formatMoney(0)).toBe("RM\u00A00.00");
  });

  test("rounds to whole units when requested", () => {
    expect(formatMoney(150_000, { maximumFractionDigits: 0 })).toBe(
      "RM\u00A01,500"
    );
  });

  test("supports other locales and currencies", () => {
    expect(formatMoney(15_000, { currency: "USD", locale: "en-US" })).toBe(
      "$150.00"
    );
  });
});

describe("formatMoneyValue", () => {
  test("formats major-unit values without decimals", () => {
    expect(formatMoneyValue(1234)).toBe("RM\u00A01,234");
    expect(formatMoneyValue(0)).toBe("RM\u00A00");
  });
});

describe("formatMoneyWhole", () => {
  test("rounds sen to whole units", () => {
    expect(formatMoneyWhole(150_000)).toBe("RM\u00A01,500");
    expect(formatMoneyWhole(15_000)).toBe("RM\u00A0150");
  });
});

describe("formatMoneyCsv", () => {
  test("returns a bare two-decimal string", () => {
    expect(formatMoneyCsv(15_000)).toBe("150.00");
    expect(formatMoneyCsv(99)).toBe("0.99");
    expect(formatMoneyCsv(0)).toBe("0.00");
  });

  test("pads cents and stays exact for large sen values", () => {
    expect(formatMoneyCsv(5)).toBe("0.05");
    expect(formatMoneyCsv(1_505)).toBe("15.05");
    // A very large integer-sen value must not round to a float artifact like
    // `...0.999999` (this is the reason the split formatter avoids division).
    expect(formatMoneyCsv(9_007_199_254_740_993)).not.toContain("0.99");
  });
});

describe("formatMoneyRm", () => {
  test("returns a compact RM string", () => {
    expect(formatMoneyRm(9900)).toBe("RM99.00");
    expect(formatMoneyRm(0)).toBe("RM0.00");
    expect(formatMoneyRm(1_505)).toBe("RM15.05");
  });
});
