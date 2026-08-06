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
import { Label } from "@repo/design-system/components/ui/label";
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
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../components/header";
import { endEnrollment, updateClass, updateEnrollment } from "../actions";

interface ClassPageProperties {
  readonly params: Promise<{ classId: string }>;
}

const dayLabels = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
  ["SATURDAY", "Saturday"],
  ["SUNDAY", "Sunday"],
] as const;

const formatMoney = (amountSen: number) => (amountSen / 100).toFixed(2);

const ClassPage = async ({ params }: ClassPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { classId } = await params;
  const [learningClass, subjects, teachers, levels] = await Promise.all([
    database.learningClass.findFirst({
      where: { id: classId, organizationId: tenant.organizationId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: true },
          orderBy: { student: { fullName: "asc" } },
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
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Edit class</CardTitle>
            <CardDescription>
              Update schedule, teacher, room, and fee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateClass} className="grid gap-4">
              <input name="classId" type="hidden" value={learningClass.id} />
              <div className="grid gap-2">
                <Label htmlFor="name">Class name</Label>
                <Input
                  defaultValue={learningClass.name}
                  id="name"
                  name="name"
                  required
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="code">Class code</Label>
                  <Input
                    defaultValue={learningClass.code}
                    id="code"
                    name="code"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="academicYear">Academic year</Label>
                  <Input
                    defaultValue={learningClass.academicYear}
                    id="academicYear"
                    min="2000"
                    name="academicYear"
                    required
                    type="number"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subjectId">Subject</Label>
                <Select
                  defaultValue={learningClass.subjectId}
                  name="subjectId"
                  required
                >
                  <SelectTrigger id="subjectId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="levelId">Level</Label>
                <Select
                  defaultValue={learningClass.levelId ?? "none"}
                  name="levelId"
                >
                  <SelectTrigger id="levelId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No level</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="teacherId">Teacher</Label>
                <Select
                  defaultValue={learningClass.teacherId ?? "none"}
                  name="teacherId"
                >
                  <SelectTrigger id="teacherId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No teacher yet</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="dayOfWeek">Day</Label>
                  <Select
                    defaultValue={learningClass.dayOfWeek}
                    name="dayOfWeek"
                    required
                  >
                    <SelectTrigger id="dayOfWeek">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayLabels.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startsAt">Starts</Label>
                  <Input
                    defaultValue={learningClass.startsAt}
                    id="startsAt"
                    name="startsAt"
                    required
                    type="time"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endsAt">Ends</Label>
                  <Input
                    defaultValue={learningClass.endsAt}
                    id="endsAt"
                    name="endsAt"
                    required
                    type="time"
                  />
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="monthlyFee">Monthly fee</Label>
                  <Input
                    defaultValue={formatMoney(learningClass.monthlyFeeSen)}
                    id="monthlyFee"
                    min="0"
                    name="monthlyFee"
                    step="0.01"
                    type="number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    defaultValue={learningClass.capacity ?? ""}
                    id="capacity"
                    min="1"
                    name="capacity"
                    type="number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    defaultValue={learningClass.room ?? ""}
                    id="room"
                    name="room"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save changes</Button>
                <Button asChild variant="outline">
                  <Link href="/classes">Cancel</Link>
                </Button>
              </div>
            </form>
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
