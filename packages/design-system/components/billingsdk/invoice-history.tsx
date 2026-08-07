"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { cn } from "@repo/design-system/lib/utils";
import { CalendarDays, Download, ReceiptText } from "lucide-react";

export interface InvoiceItem {
  amount: string;
  date: string;
  description?: string;
  id: string;
  invoiceUrl?: string;
  status: "paid" | "refunded" | "open" | "void";
}

interface InvoiceHistoryProps {
  className?: string;
  description?: string;
  invoices: InvoiceItem[];
  onDownload?: (invoiceId: string) => void;
  title?: string;
}

export function InvoiceHistory({
  className,
  title = "Invoice History",
  description = "Your past invoices and payment receipts.",
  invoices,
  onDownload,
}: InvoiceHistoryProps) {
  if (!invoices) {
    return null;
  }

  const statusBadge = (status: InvoiceItem["status"]) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="border-emerald-700/40 bg-emerald-600 text-emerald-50">
            Paid
          </Badge>
        );
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      case "open":
        return <Badge variant="outline">Open</Badge>;
      case "void":
        return <Badge variant="outline">Void</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      {(title || description) && (
        <CardHeader className="space-y-1">
          {title && (
            <CardTitle className="flex items-center gap-2 truncate font-medium text-base text-lg leading-tight sm:gap-3 sm:text-xl">
              <ReceiptText className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-muted-foreground text-sm">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableCaption className="sr-only">
            List of past invoices with dates, amounts, status and download
            actions
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && (
              <TableRow>
                <TableCell
                  className="h-24 text-center text-muted-foreground"
                  colSpan={5}
                >
                  No invoices yet
                </TableCell>
              </TableRow>
            )}
            {invoices.map((inv) => (
              <TableRow className="group" key={inv.id}>
                <TableCell className="text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {inv.date}
                  </div>
                </TableCell>
                <TableCell className="max-w-[320px]">
                  <div
                    className="truncate"
                    title={inv.description || "Invoice"}
                  >
                    {inv.description || "Invoice"}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {inv.amount}
                </TableCell>
                <TableCell className="text-right">
                  {statusBadge(inv.status)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    aria-label={`Download invoice ${inv.id}`}
                    className="h-8 text-xs"
                    onClick={() =>
                      inv.invoiceUrl
                        ? window.open(
                            inv.invoiceUrl,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        : onDownload?.(inv.id)
                    }
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
