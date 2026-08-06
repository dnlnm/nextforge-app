import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { notFound } from "next/navigation";
import { csvResponse } from "../csv";

interface ExportRouteProperties {
  readonly params: Promise<unknown>;
}

const formatMoney = (amountSen: number) => (amountSen / 100).toFixed(2);

const exportStudents = async (organizationId: string) => {
  const students = await database.student.findMany({
    where: { organizationId, archivedAt: null },
    orderBy: { fullName: "asc" },
    include: {
      guardians: {
        where: { isPrimary: true },
        include: { guardian: true },
        take: 1,
      },
      level: true,
    },
  });

  return csvResponse("students.csv", [
    [
      "Student Name",
      "Preferred Name",
      "School",
      "Academic Level",
      "Status",
      "Guardian Name",
      "Guardian Phone",
      "Guardian Email",
    ],
    ...students.map((student) => {
      const guardian = student.guardians.at(0)?.guardian;

      return [
        student.fullName,
        student.preferredName,
        student.schoolName,
        student.level?.name ?? "",
        student.status,
        guardian?.fullName,
        guardian?.phone,
        guardian?.email,
      ];
    }),
  ]);
};

const exportEnrolments = async (organizationId: string) => {
  const enrolments = await database.enrollment.findMany({
    where: { organizationId, status: "ACTIVE" },
    orderBy: [{ class: { name: "asc" } }, { student: { fullName: "asc" } }],
    include: {
      class: { include: { subject: true, teacher: true } },
      student: true,
    },
  });

  return csvResponse("class-enrolments.csv", [
    [
      "Class",
      "Subject",
      "Teacher",
      "Student",
      "Monthly Fee",
      "Custom Fee",
      "Status",
    ],
    ...enrolments.map((enrolment) => [
      enrolment.class.name,
      enrolment.class.subject.name,
      enrolment.class.teacher?.fullName,
      enrolment.student.fullName,
      formatMoney(enrolment.class.monthlyFeeSen),
      enrolment.customFeeSen === null
        ? ""
        : formatMoney(enrolment.customFeeSen),
      enrolment.status,
    ]),
  ]);
};

const exportInvoices = async (organizationId: string) => {
  const invoices = await database.invoice.findMany({
    where: { organizationId },
    orderBy: [{ billingMonth: "desc" }, { invoiceNumber: "asc" }],
    include: { student: true },
  });

  return csvResponse("invoices.csv", [
    [
      "Invoice Number",
      "Billing Month",
      "Student",
      "Status",
      "Issue Date",
      "Due Date",
      "Total",
      "Paid",
      "Outstanding",
    ],
    ...invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.billingMonth,
      invoice.student.fullName,
      invoice.status,
      invoice.issueDate,
      invoice.dueDate,
      formatMoney(invoice.totalSen),
      formatMoney(invoice.amountPaidSen),
      formatMoney(invoice.totalSen - invoice.amountPaidSen),
    ]),
  ]);
};

const exportPayments = async (organizationId: string) => {
  const payments = await database.payment.findMany({
    where: { organizationId },
    orderBy: { paidAt: "desc" },
    include: { allocations: { include: { invoice: true } }, student: true },
  });

  return csvResponse("payments.csv", [
    [
      "Receipt Number",
      "Student",
      "Paid At",
      "Method",
      "Amount",
      "Reference",
      "Invoices",
      "Status",
    ],
    ...payments.map((payment) => [
      payment.receiptNumber,
      payment.student.fullName,
      payment.paidAt,
      payment.method,
      formatMoney(payment.amountSen),
      payment.reference,
      payment.allocations
        .map((allocation) => allocation.invoice.invoiceNumber)
        .join("; "),
      payment.status,
    ]),
  ]);
};

const exportAttendance = async (organizationId: string) => {
  const attendance = await database.attendanceRecord.findMany({
    where: { organizationId },
    orderBy: { markedAt: "desc" },
    include: {
      session: { include: { class: true } },
      student: true,
    },
  });

  return csvResponse("attendance.csv", [
    ["Date", "Class", "Student", "Status", "Marked At"],
    ...attendance.map((record) => [
      record.session.sessionDate,
      record.session.class.name,
      record.student.fullName,
      record.status,
      record.markedAt,
    ]),
  ]);
};

export const GET = async (
  _request: Request,
  { params }: ExportRouteProperties
) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { kind } = (await params) as { kind: string };

  switch (kind) {
    case "students":
      return exportStudents(tenant.organizationId);
    case "enrolments":
      return exportEnrolments(tenant.organizationId);
    case "invoices":
      return exportInvoices(tenant.organizationId);
    case "payments":
      return exportPayments(tenant.organizationId);
    case "attendance":
      return exportAttendance(tenant.organizationId);
    default:
      notFound();
  }
};
