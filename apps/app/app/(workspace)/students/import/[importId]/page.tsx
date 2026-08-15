import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { formatDateTime } from "@repo/date";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { ImportStepper } from "../import-stepper";
import { ImportRunner } from "./import-runner";

const terminalStatuses = new Set(["COMPLETED", "COMPLETED_WITH_ERRORS"]);
const label = (status: string) => status.toLowerCase().replaceAll("_", " ");

const ImportDetailPage = async ({
  params,
}: {
  params: Promise<{ importId: string }>;
}) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { importId } = await params;
  const studentImport = await database.studentImport.findFirst({
    where: { id: importId, organizationId: tenant.organizationId },
    include: {
      rows: {
        where: { status: { in: ["INVALID", "DUPLICATE", "FAILED"] } },
        orderBy: { rowNumber: "asc" },
        take: 100,
      },
    },
  });
  if (!studentImport) {
    notFound();
  }
  const hasErrors = studentImport.invalidRows + studentImport.skippedRows > 0;
  let currentStep = 3;
  if (studentImport.status === "PROCESSING") {
    currentStep = 4;
  } else if (terminalStatuses.has(studentImport.status)) {
    currentStep = 5;
  }
  return (
    <>
      <Header
        page="Import Details"
        pages={[
          appName,
          { href: "/students", label: "Students" },
          { href: "/students/import", label: "Import Students" },
        ]}
      />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h1 className="font-semibold text-2xl tracking-tight">
                {studentImport.filename}
              </h1>
              <Badge className="capitalize" variant="outline">
                {label(studentImport.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Created {formatDateTime(studentImport.createdAt)}
            </p>
          </div>
          <Button variant="outline" render={<Link href="/students/import" />}>
            <ArrowLeftIcon className="size-4" />
            Import History
          </Button>
        </div>
        <ImportStepper current={currentStep} />
        {studentImport.status === "FAILED" && (
          <Alert variant="error">
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>
              {studentImport.failureMessage ??
                "The import could not be processed."}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total rows", studentImport.totalRows],
            ["Valid rows", studentImport.validRows],
            ["Created", studentImport.createdRows],
            [
              "Errors / skipped",
              studentImport.invalidRows + studentImport.skippedRows,
            ],
          ].map(([title, value]) => (
            <Card key={String(title)}>
              <CardHeader className="pb-2">
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {Number(value).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              {terminalStatuses.has(studentImport.status)
                ? "Import complete"
                : "Import review"}
            </CardTitle>
            <CardDescription>
              {terminalStatuses.has(studentImport.status)
                ? "The result is recorded in import history."
                : "Review the results before creating student records."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ImportRunner
              importId={importId}
              processedRows={studentImport.processedRows}
              status={studentImport.status}
              validRows={studentImport.validRows}
            />
            {terminalStatuses.has(studentImport.status) && (
              <div className="flex flex-wrap justify-end gap-2">
                {hasErrors && (
                  <Button
                    variant="outline"
                    render={
                      <Link href={`/students/import/${importId}/errors`} />
                    }
                  >
                    <DownloadIcon className="size-4" />
                    Download Error Report
                  </Button>
                )}
                <Button render={<Link href="/students" />}>
                  Back to Students
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        {studentImport.rows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rows requiring attention</CardTitle>
              <CardDescription>
                Showing the first 100 invalid, duplicate, or failed rows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Excel row</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Problems</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentImport.rows.map((row) => {
                    const raw = row.rawData as Record<string, unknown>;
                    const errors = Array.isArray(row.errors)
                      ? row.errors.map(String)
                      : [];
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>
                          {String(raw["Student Name"] ?? "") ||
                            "Unnamed student"}
                        </TableCell>
                        <TableCell className="max-w-2xl text-destructive">
                          {errors.join("; ")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {hasErrors && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    render={
                      <Link href={`/students/import/${importId}/errors`} />
                    }
                  >
                    <DownloadIcon className="size-4" />
                    Download All Errors
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
};

export default ImportDetailPage;
