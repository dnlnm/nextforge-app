import { createTableHook } from "@tanstack/react-table";
import { DataTableFilterList } from "./data-table-filter-list";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableSortList } from "./data-table-sort-list";
import { features } from "./features";

export const {
  useAppTable,
  useTableContext,
  createAppColumnHelper,
} = createTableHook({
  features,
  defaultColumn: {
    size: 120,
    minSize: 60,
    maxSize: 800,
    filterFn: "includesString",
  },
  getRowId: (row: { id: string }) => row.id,
  enableRowSelection: true,
  tableComponents: {
    FilterList: DataTableFilterList,
    SortList: DataTableSortList,
    Pagination: DataTablePagination,
  },
  cellComponents: {},
  headerComponents: {},
});

export type { ExtendedColumnFilter, ColumnMeta, JoinOperator, FilterOperator } from "./types";
export { getFilterOperators, mapOperatorForServer, mapOperatorForUi, toFilterValueArray } from "./lib/data-table";
export { Faceted, FacetedChipList, type FacetedOption } from "./fluid-faceted";