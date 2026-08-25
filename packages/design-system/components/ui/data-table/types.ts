import type { BuiltInFilterFn, ColumnFilter, TableFeatures } from "@tanstack/table-core";

export type TableFilterFeatures<TFeatures extends TableFeatures> = Pick<
  TFeatures,
  "columnFilteringFeature" | "columnFacetingFeature"
>;

export type FilterOperator =
  | BuiltInFilterFn
  | "notIncludesString"
  | "notEqualsString"
  | "notEquals"
  | "isEmpty"
  | "isNotEmpty";

export type JoinOperator = "and" | "or";

export interface ExtendedColumnFilter extends ColumnFilter {
  filterId?: string;
  operator?: FilterOperator;
  joinOperator?: JoinOperator;
  variant?: string;
}

export interface ColumnMeta {
  label?: string;
  variant?: "text" | "select" | "multi-select";
  options?: Array<{ label: string; value: string }>;
}