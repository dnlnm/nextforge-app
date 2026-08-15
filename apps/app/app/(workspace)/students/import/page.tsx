import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import { formatShortDate } from "@repo/date";
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
import { DownloadIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../../components/header";
import { ImportStepper } from "./import-stepper";
import { StudentImportUpload } from "./student-import-upload";

const label = (status: string) => status.toLowerCase().replaceAll("_", " ");

const StudentImportPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const history = await database.studentImport.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return (
    <>
      <Header
        page="Import Students"
        pages={[appName, { href: "/students", label: "Students" }]}
      />
      <main className="grid gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Import Students
          </h1>
          <p className="text-muted-foreground text-sm">
            Download the Excel template, complete it, then upload it for
            validation.
          </p>
        </div>
        <ImportStepper current={1} />
        <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
          <Card>
            <CardHeader>
              <CardTitle>1. Download template</CardTitle>
              <CardDescription>
                The template includes your tuition centre's academic levels and
                Excel dropdowns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                render={<a download href="/students/template" />}
              >
                <DownloadIcon className="size-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>
          <div className="grid gap-3">
            <div>
              <h2 className="font-semibold text-lg">2. Upload workbook</h2>
              <p className="text-muted-foreground text-sm">
                Uploading validates the rows. Nothing is imported until you
                confirm.
              </p>
            </div>
            <StudentImportUpload />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Import history</CardTitle>
            <CardDescription>
              Recent student imports for this tuition centre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Skipped</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length ? (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {formatShortDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Link
                          className="font-medium hover:underline"
                          href={`/students/import/${item.id}`}
                        >
                          {item.filename}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize" variant="outline">
                          {label(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.totalRows}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.createdRows}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.skippedRows}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.invalidRows}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={7}
                    >
                      No imports yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default StudentImportPage;
