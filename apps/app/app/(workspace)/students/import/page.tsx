import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { formatShortDate } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CardShell } from "@repo/design-system/components/ui/card-shell";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  ArrowUpRightIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  InboxIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "../../components/header";
import { ImportStatusChop, importStatusLabel } from "./import-status";
import { ImportStepper } from "./import-stepper";
import { StudentImportUpload } from "./student-import-upload";

const columnsPreview = [
  "Student Name *",
  "Gender *",
  "Academic Level *",
  "Guardian Name *",
  "Guardian Phone *",
] as const;

const StudentImportPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  // ponytail: retention sweep only runs when an ADMIN opens this page; move to
  // a scheduled job if cleanup latency ever matters.
  await database.studentImport
    .deleteMany({
      where: {
        organizationId: tenant.organizationId,
        status: { in: ["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"] },
        createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    })
    .catch(() => undefined);
  const history = await database.studentImport.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const ready = history.filter((h) => h.status === "READY").length;
  const totalRows = history.reduce((a, b) => a + b.totalRows, 0);

  return (
    <>
      <Header
        page="Import Students"
        pages={[appName, { href: "/students", label: "Students" }]}
      />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4 [scrollbar-gutter:stable]">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-semibold text-2xl tracking-tight">
            Import Students
          </h1>
          <p className="text-muted-foreground text-sm">
            Download the workbook pre-filled with your centre&apos;s levels,
            fill it, then upload for validation. Nothing is saved until you
            confirm.
          </p>
          {history.length > 0 && (
            <p className="text-muted-foreground text-xs">
              {history.length} batches · {totalRows.toLocaleString()} rows
              {ready > 0 ? ` · ${ready} needs review` : ""}
            </p>
          )}
        </div>

        <ImportStepper current={1} />

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <CardShell>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-md border bg-muted">
                  <FileSpreadsheetIcon className="size-4" />
                </span>
                Download template
              </CardTitle>
              <CardDescription>
                Headers match your Academic Levels with Excel dropdowns. Required
                columns marked *.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-[32px_1fr] text-xs">
                  <div className="bg-muted py-1.5 text-center font-medium text-muted-foreground">
                    #
                  </div>
                  <div className="bg-muted py-1.5 text-center font-medium text-muted-foreground">
                    Columns · 19 total · 5 required shown
                  </div>
                  {columnsPreview.map((c, i) => (
                    <div
                      key={c}
                      className="contents *:border-t *:px-2.5 *:py-2"
                    >
                      <div className="bg-muted/40 text-center tabular-nums text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div className="text-sm">{c}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  render={<a download href="/students/template" />}
                  variant={history.length === 0 ? "default" : "outline"}
                >
                  <DownloadIcon className="size-4" />
                  Download Template
                </Button>
                <span className="text-muted-foreground text-xs">
                  Pre-filled · dropdowns · 19 columns
                </span>
              </div>
              <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-muted-foreground text-xs leading-5">
                Tip: paste from your existing sheet — keep the header row.
                Don&apos;t rename headers.
              </p>
            </CardContent>
          </CardShell>

          <div className="grid gap-3">
            <div>
              <h2 className="font-semibold">Upload workbook</h2>
              <p className="text-muted-foreground text-sm">
                Uploading validates every row. You&apos;ll fix highlighted cells
                in review — nothing is imported until you confirm.
              </p>
            </div>
            <StudentImportUpload />
          </div>
        </div>

        <CardShell>
          <CardHeader>
            <CardTitle>Import history</CardTitle>
            <CardDescription>
              Recent batches for this tuition centre · 30-day retention
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {history.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                    <TableHead className="w-0">
                      <span className="sr-only">Action</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => {
                    const needsFix = item.invalidRows + item.skippedRows;
                    const isReady = item.status === "READY";
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                          {formatShortDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="max-w-[22ch]">
                          <Link
                            className="inline-flex max-w-full items-center gap-1.5 truncate font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            href={`/students/import/${item.id}`}
                          >
                            <span className="truncate">{item.filename}</span>
                            <ArrowUpRightIcon className="size-3 shrink-0 opacity-40" />
                          </Link>
                          <span className="block truncate text-muted-foreground text-xs">
                            {importStatusLabel(item.status)} ·{" "}
                            {item.totalRows.toLocaleString()} rows
                          </span>
                        </TableCell>
                        <TableCell>
                          <ImportStatusChop status={item.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.totalRows.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {item.status === "COMPLETED" ||
                          item.status === "COMPLETED_WITH_ERRORS" ? (
                            <span>
                              <span className="text-success-foreground">
                                {item.createdRows.toLocaleString()} created
                              </span>
                              {needsFix > 0 && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {needsFix} skipped
                                </span>
                              )}
                            </span>
                          ) : isReady ? (
                            <span
                              className={
                                needsFix
                                  ? "text-warning-foreground"
                                  : "text-success-foreground"
                              }
                            >
                              {needsFix
                                ? `${needsFix} need fix`
                                : "Ready to import"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            render={
                              <Link href={`/students/import/${item.id}`} />
                            }
                            size="sm"
                            variant={isReady ? "default" : "ghost"}
                          >
                            {isReady ? "Review" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <Empty className="py-10">
                <EmptyMedia variant="icon">
                  <InboxIcon className="size-5" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No imports yet</EmptyTitle>
                  <EmptyDescription>
                    Download the template and upload your first workbook. Your
                    centre&apos;s Academic Levels are already baked in.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button render={<a download href="/students/template" />}>
                    <DownloadIcon className="size-4" />
                    Download Template
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </CardShell>
      </main>
    </>
  );
};

export default StudentImportPage;
