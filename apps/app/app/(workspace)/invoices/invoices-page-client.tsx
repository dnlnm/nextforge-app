"use client";

import { useState } from "react";
import type { Invoice } from "./columns";
import { InvoiceDetailSheet } from "./invoice-detail-sheet";
import { InvoicesTable } from "./invoices-table";

interface FilterOption {
  label: string;
  value: string;
}

interface InvoicesPageClientProps {
  currency: string;
  filterOptions: { months: FilterOption[] };
  initialData: Invoice[];
  initialTotalCount: number;
  statusCounts: Record<string, number>;
}

export function InvoicesPageClient({
  currency,
  filterOptions,
  initialData,
  initialTotalCount,
  statusCounts,
}: InvoicesPageClientProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <>
      <InvoicesTable
        currency={currency}
        filterOptions={{ months: filterOptions.months }}
        initialData={initialData}
        initialTotalCount={initialTotalCount}
        onSelectInvoice={(invoice) => setSelectedInvoice(invoice)}
        statusCounts={statusCounts}
      />
      <InvoiceDetailSheet
        currency={currency}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </>
  );
}
