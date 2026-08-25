import type { FilterOperator } from "../types";

/**
 * Normalize a filter value into an array for `{ id, value }` wire contracts
 * (select/multi-select filters). Scalars become single-element arrays.
 */
export function toFilterValueArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value !== undefined && value !== "") {
    return [String(value)];
  }
  return [];
}

/**
 * Operator options surfaced in the filter UI, grouped by column variant.
 * The table is server-driven (manualFiltering), so these only shape the UI and
 * the wire contract — the actual matching happens in each table's server
 * action. Unsupported combinations degrade gracefully (the server ignores
 * rules it can't apply).
 */
export function getFilterOperators(
  type: string
): Array<{ label: string; value: FilterOperator }> {
  switch (type) {
    case "select":
    case "multi-select":
      return [
        { label: "is", value: "equals" },
        { label: "is not", value: "notEquals" },
        { label: "is empty", value: "isEmpty" },
        { label: "is not empty", value: "isNotEmpty" },
      ];
    default:
      return [
        { label: "contains", value: "includesString" },
        { label: "does not contain", value: "notIncludesString" },
        { label: "is", value: "equalsString" },
        { label: "is not", value: "notEqualsString" },
        { label: "is empty", value: "isEmpty" },
        { label: "is not empty", value: "isNotEmpty" },
      ];
  }
}

/**
 * Map a UI filter operator to the server-side operator vocabulary used by the
 * students table's `foldFilterRules` (niko-style names). Other tables that only
 * accept `{ id, value }` strips the operator entirely and keeps the value.
 */
export function mapOperatorForServer(operator: FilterOperator): string {
  switch (operator) {
    case "includesString":
      return "ilike";
    case "notIncludesString":
      return "not.ilike";
    case "equalsString":
      return "eq";
    case "notEqualsString":
      return "neq";
    case "equals":
      return "in";
    case "notEquals":
      return "not.in";
    case "isEmpty":
      return "empty";
    case "isNotEmpty":
      return "not.empty";
    default:
      return "ilike";
  }
}

/** Reverse of `mapOperatorForServer` — server operator name back to a UI operator. */
export function mapOperatorForUi(operator: string): FilterOperator {
  switch (operator) {
    case "ilike":
      return "includesString";
    case "not.ilike":
      return "notIncludesString";
    case "eq":
      return "equalsString";
    case "neq":
      return "notEqualsString";
    case "in":
      return "equals";
    case "not.in":
      return "notEquals";
    case "empty":
      return "isEmpty";
    case "not.empty":
      return "isNotEmpty";
    default:
      return "includesString";
  }
}