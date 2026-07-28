import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  Edit3Icon,
  EyeIcon,
  FilterIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountSen / 100);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

const studentCode = (index: number) =>
  `STU${String(index + 145).padStart(5, "0")}`;

const StudentsPage = async () => {
  const tenant = await requireTenant();
  const today = new Date();
  const startOfMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
  );
  const students = await database.student.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { fullName: "asc" },
    include: {
      branch: true,
      enrollments: {
        where: { status: "ACTIVE", archivedAt: null },
        include: {
          class: {
            include: {
              subject: true,
              teacher: true,
            },
          },
        },
      },
      guardians: {
        where: { isPrimary: true },
        include: { guardian: true },
        take: 1,
      },
      invoices: {
        where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      },
    },
  });

  const activeStudents = students.filter(
    (student) => student.status === "ACTIVE"
  );
  const newStudentsThisMonth = students.filter(
    (student) => student.createdAt >= startOfMonth
  );
  const totalOutstandingSen = students.reduce(
    (total, student) =>
      total +
      student.invoices.reduce(
        (invoiceTotal, invoice) =>
          invoiceTotal + Math.max(0, invoice.totalSen - invoice.amountPaidSen),
        0
      ),
    0
  );
  const studentsWithOutstanding = students.filter((student) =>
    student.invoices.some((invoice) => invoice.totalSen > invoice.amountPaidSen)
  );
  const selectedStudent = students.at(0);
  const selectedGuardian = selectedStudent?.guardians.at(0)?.guardian;
  const selectedOutstandingSen = selectedStudent
    ? selectedStudent.invoices.reduce(
        (total, invoice) =>
          total + Math.max(0, invoice.totalSen - invoice.amountPaidSen),
        0
      )
    : 0;
  const selectedBilledSen = selectedStudent
    ? selectedStudent.invoices.reduce(
        (total, invoice) => total + invoice.totalSen,
        0
      )
    : 0;
  const selectedPaidSen = selectedStudent
    ? selectedStudent.invoices.reduce(
        (total, invoice) => total + invoice.amountPaidSen,
        0
      )
    : 0;

  return (
    <>
      <Header page="Students" pages={["TLAS.MY"]} />
      <main className="grid gap-5 p-4 pt-0">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Students</h1>
            <p className="text-muted-foreground text-sm">
              Manage student information and registration.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="flex-1 md:flex-none" variant="outline">
              <Link href="/students/template">
                <UploadIcon className="size-4" />
                <span className="hidden sm:inline">Import Students</span>
                <span className="sm:hidden">Import</span>
              </Link>
            </Button>
            <Button asChild className="flex-1 md:flex-none">
              <Link href="/students/new">
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">Add Student</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
            <Button size="icon" variant="outline">
              <ChevronDownIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]">
          <section className="grid content-start gap-5">
            <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {[
                [
                  "Total Students",
                  students.length.toLocaleString(),
                  "+ 12 from last month",
                ],
                [
                  "Active Students",
                  activeStudents.length.toLocaleString(),
                  `${students.length > 0 ? Math.round((activeStudents.length / students.length) * 100) : 0}% of total`,
                ],
                [
                  `New Students (${today.toLocaleString("en-MY", { month: "short" })})`,
                  newStudentsThisMonth.length.toLocaleString(),
                  "+ 4 from last month",
                ],
                [
                  "Outstanding Fees",
                  formatMoney(totalOutstandingSen),
                  `${studentsWithOutstanding.length} students`,
                ],
              ].map(([label, value, detail]) => (
                <Card key={label}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex size-14 shrink-0 items-center justify-center border bg-muted text-muted-foreground">
                      <UserRoundIcon className="size-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <p className="mt-1 truncate font-semibold text-2xl tracking-tight">
                        {value}
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {detail}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            <Card>
              <CardContent className="p-0">
                <div className="grid gap-4 p-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="relative min-w-64 flex-1 sm:max-w-sm">
                      <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search students..."
                      />
                    </div>
                    {[
                      ["Branch", "All"],
                      ["Class", "All"],
                      ["Tutor", "All"],
                      ["Status", "All"],
                    ].map(([label, value]) => (
                      <div className="grid w-32 gap-1" key={label}>
                        <span className="text-muted-foreground text-xs">
                          {label}
                        </span>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue placeholder={value} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{value}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    <Button className="ml-auto" variant="outline">
                      <FilterIcon className="size-4" />
                      Advanced Filter
                    </Button>
                    <Button className="self-end" size="icon" variant="outline">
                      <RefreshCwIcon className="size-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                    <div className="flex items-center gap-3 pr-2">
                      <Checkbox />
                      <span className="font-medium text-sm">0 selected</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Send WhatsApp
                    </Button>
                    <Button size="sm" variant="outline">
                      Assign Class
                    </Button>
                    <Button size="sm" variant="outline">
                      <DownloadIcon className="size-4" />
                      Export
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2Icon className="size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Level/Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => {
                        const guardian = student.guardians.at(0)?.guardian;
                        const code = studentCode(index);

                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center border bg-muted text-muted-foreground">
                                  <UserRoundIcon className="size-5" />
                                </div>
                                <Link
                                  className="font-medium hover:underline"
                                  href={`/students/${student.id}`}
                                >
                                  {student.fullName}
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {code}
                            </TableCell>
                            <TableCell>
                              {student.academicLevel ?? "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {student.status === "ACTIVE"
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button asChild size="icon" variant="outline">
                                  <Link href={`/students/${student.id}`}>
                                    <EyeIcon className="size-4" />
                                  </Link>
                                </Button>
                                <Button asChild size="icon" variant="outline">
                                  <Link href={`/students/${student.id}`}>
                                    <Edit3Icon className="size-4" />
                                  </Link>
                                </Button>
                                <Button asChild size="icon" variant="outline">
                                  <Link
                                    href={`https://wa.me/${guardian?.phone ?? ""}`}
                                  >
                                    <MoreHorizontalIcon className="size-4" />
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col gap-3 border-t p-4 text-muted-foreground text-sm md:flex-row md:items-center md:justify-between">
                  <p>
                    Showing 1 to {students.length} of {students.length} students
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline">
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    {[1, 2, 3, 4, 5].map((page) => (
                      <Button
                        key={page}
                        size="icon"
                        variant={page === 1 ? "default" : "outline"}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button size="icon" variant="outline">
                      <ChevronRightIcon className="size-4" />
                    </Button>
                    <Select defaultValue="10">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 / page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="xl:sticky xl:top-4 xl:self-start">
            <Card>
              {selectedStudent ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-20 items-center justify-center border bg-muted text-muted-foreground">
                        <UserRoundIcon className="size-10" />
                      </div>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {selectedStudent.fullName}
                      </CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                        <span>{studentCode(0)}</span>
                        <span>+</span>
                        <span>{selectedStudent.academicLevel ?? "-"}</span>
                        <Badge variant="outline">
                          {selectedStudent.status === "ACTIVE"
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button asChild variant="outline">
                        <Link
                          href={`https://wa.me/${selectedGuardian?.phone ?? ""}`}
                        >
                          WhatsApp
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/students/${selectedStudent.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <Button variant="outline">More</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-5 p-0">
                    <section className="grid gap-3 border-b p-4">
                      <h2 className="font-semibold text-sm">
                        Student Information
                      </h2>
                      {[
                        [
                          "Registration Date",
                          formatDate(selectedStudent.enrolledAt),
                        ],
                        ["No. IC / Passport", "-"],
                        ["Gender", "-"],
                        ["Branch", selectedStudent.branch?.name ?? "-"],
                        [
                          "Status",
                          selectedStudent.status === "ACTIVE"
                            ? "Active"
                            : "Inactive",
                        ],
                      ].map(([label, value]) => (
                        <div
                          className="grid grid-cols-[6rem_1fr] gap-3 text-sm"
                          key={label}
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </section>
                    <section className="grid gap-3 border-b p-4">
                      <h2 className="font-semibold text-sm">
                        Parent / Guardian
                      </h2>
                      {[
                        ["Name", selectedGuardian?.fullName ?? "-"],
                        ["Phone", selectedGuardian?.phone ?? "-"],
                        ["Email", selectedGuardian?.email ?? "-"],
                        [
                          "Address",
                          [
                            selectedGuardian?.addressLine1,
                            selectedGuardian?.addressLine2,
                            selectedGuardian?.city,
                            selectedGuardian?.state,
                          ]
                            .filter(Boolean)
                            .join(", ") || "-",
                        ],
                      ].map(([label, value]) => (
                        <div
                          className="grid grid-cols-[6rem_1fr] gap-3 text-sm"
                          key={label}
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </section>
                    <section className="grid gap-3 p-4">
                      <h2 className="font-semibold text-sm">Fee Summary</h2>
                      {[
                        ["Total Billed", formatMoney(selectedBilledSen)],
                        ["Total Paid", formatMoney(selectedPaidSen)],
                        ["Outstanding", formatMoney(selectedOutstandingSen)],
                      ].map(([label, value]) => (
                        <div
                          className="flex justify-between gap-3 text-sm"
                          key={label}
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                      <Button asChild className="mt-3 w-full" variant="outline">
                        <Link href={`/students/${selectedStudent.id}`}>
                          View Full Profile
                          <ChevronRightIcon className="size-4" />
                        </Link>
                      </Button>
                    </section>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  No students to display.
                </CardContent>
              )}
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
};

export default StudentsPage;
