"use client";

import { useState } from "react";
import type { Payment } from "./columns";
import { PaymentDetailSheet } from "./payment-detail-sheet";
import { PaymentsTable } from "./payments-table";

interface FilterOption {
  label: string;
  value: string;
}

interface PaymentsPageClientProps {
  currency: string;
  filterOptions: { methods: FilterOption[]; statuses: FilterOption[] };
  initialData: Payment[];
  initialTotalCount: number;
  statusCounts: Record<string, number>;
}

export function PaymentsPageClient({
  currency,
  filterOptions,
  initialData,
  initialTotalCount,
  statusCounts,
}: PaymentsPageClientProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  return (
    <>
      <PaymentsTable
        currency={currency}
        filterOptions={{ methods: filterOptions.methods }}
        initialData={initialData}
        initialTotalCount={initialTotalCount}
        onSelectPayment={(payment) => setSelectedPayment(payment)}
        statusCounts={statusCounts}
      />
      <PaymentDetailSheet
        currency={currency}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />
    </>
  );
}
