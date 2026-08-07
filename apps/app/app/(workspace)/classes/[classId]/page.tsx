import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { DatePicker } from "@repo/design-system/components/ui/date-picker";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { notFound } from "next/navigation";
import { Header } from "../../components/header";
import { endEnrollment, updateEnrollment } from "../actions";
import { ClassEditForm } from "../components/class-edit-form";

interface ClassPageProperties {
  readonly params: Promise<{ classId: string }>;
}

const formatMoney = (amountSen: number) => (amountSen / 100).toFixed(2);

const ClassPage = async ({ params }: ClassPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { classId } = await params;
  const [learningClass, subjects, teachers, levels, rooms] = await Promise.all([
    database.learningClass.findFirst({
      where: { id: classId, organizationId: tenant.organizationId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: true },
          orderBy: { student: { fullName: "asc" } },
        },
        schedules: {
          orderBy: { dayOfWeek: "asc" },
          include: { room: true },
        },
      },
    }),
    database.subject.findMany({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
      orderBy: [{ name: "asc" }],
    }),
    database.teacherProfile.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { fullName: "asc" },
    }),
    database.level.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { order: "asc" },
    }),
    database.room.findMany({
      where: {
        archivedAt: null,
        organizationId: tenant.organizationId,
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!learningClass) {
    notFound();
  }

  return (
    <>
      <Header page={learningClass.name} pages={["Classes"]} />
      <main className="grid gap-4 p-4 pt-0 xl:grid-cols-[420px_1fr]">
        <div className="flex flex-wrap items-center gap-2 xl:col-span-full">
          <Badge variant="outline">{learningClass.code}</Badge>
          <Badge variant="secondary">{learningClass.academicYear}</Badge>
          <Badge variant="secondary">
            Starts {formatMoney(learningClass.monthlyFeeSen)}/mo
          </Badge>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Edit class</CardTitle>
            <CardDescription>
              Update schedule, teacher, rooms, and fee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClassEditForm
              classId={learningClass.id}
              initialSchedules={learningClass.schedules}
              initialValues={{
                academicYear: learningClass.academicYear,
                capacity: learningClass.capacity,
                code: learningClass.code,
                endsOn: learningClass.endsOn,
                levelId: learningClass.levelId,
                monthlyFeeSen: learningClass.monthlyFeeSen,
                name: learningClass.name,
                startsOn: learningClass.startsOn,
                subjectId: learningClass.subjectId,
                teacherId: learningClass.teacherId,
              }}
              levels={levels}
              rooms={rooms}
              subjects={subjects}
              teachers={teachers}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active enrolments</CardTitle>
            <CardDescription>
              Update custom fee or end an enrolment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Custom fee</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learningClass.enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.student.fullName}
                    </TableCell>
                    <TableCell>
                      <form
                        action={updateEnrollment}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input
                          name="enrollmentId"
                          type="hidden"
                          value={enrollment.id}
                        />
                        <DatePicker
                          className="!w-32"
                          defaultValue={enrollment.startsOn
                            .toISOString()
                            .slice(0, 10)}
                          name="startsOn"
                          placeholder="Start date"
                        />
                        <Input
                          className="w-28"
                          defaultValue={
                            enrollment.customFeeSen === null
                              ? ""
                              : formatMoney(enrollment.customFeeSen)
                          }
                          min="0"
                          name="customFee"
                          placeholder="Default"
                          step="0.01"
                          type="number"
                        />
                        <Button size="sm" type="submit" variant="outline">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={endEnrollment}>
                        <input
                          name="enrollmentId"
                          type="hidden"
                          value={enrollment.id}
                        />
                        <Button size="sm" type="submit" variant="outline">
                          End
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default ClassPage;
