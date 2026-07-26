import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
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
import { Header } from "../components/header";
import { archiveClass, createClass, enrollStudent } from "./actions";

const dayLabels = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
  ["SATURDAY", "Saturday"],
  ["SUNDAY", "Sunday"],
] as const;

const formatMoney = (amountSen: number) =>
  new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amountSen / 100);

const ClassesPage = async () => {
  const tenant = await requireTenant();
  const [subjects, teachers, students, classes] = await Promise.all([
    database.subject.findMany({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
      orderBy: [{ academicLevel: "asc" }, { name: "asc" }],
    }),
    database.teacherProfile.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { fullName: "asc" },
    }),
    database.student.findMany({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
      orderBy: { fullName: "asc" },
    }),
    database.learningClass.findMany({
      where: { organizationId: tenant.organizationId, status: "ACTIVE" },
      orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
      include: {
        enrollments: { where: { status: "ACTIVE" }, select: { id: true } },
        subject: true,
        teacher: true,
      },
    }),
  ]);

  return (
    <>
      <Header page="Classes" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0 xl:grid-cols-[420px_1fr]">
        <section className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Create class</CardTitle>
              <CardDescription>
                Set up one weekly tuition class with a monthly fee.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createClass} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Class name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Form 3 Maths A"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subjectId">Subject</Label>
                  <Select name="subjectId" required>
                    <SelectTrigger id="subjectId">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.academicLevel
                            ? `${subject.academicLevel} ${subject.name}`
                            : subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="teacherId">Teacher</Label>
                  <Select name="teacherId">
                    <SelectTrigger id="teacherId">
                      <SelectValue placeholder="Optional teacher" />
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
                    <Select name="dayOfWeek" required>
                      <SelectTrigger id="dayOfWeek">
                        <SelectValue placeholder="Day" />
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
                    <Input id="startsAt" name="startsAt" required type="time" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endsAt">Ends</Label>
                    <Input id="endsAt" name="endsAt" required type="time" />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="monthlyFee">Monthly fee</Label>
                    <Input
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
                      id="capacity"
                      min="1"
                      name="capacity"
                      type="number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="room">Room</Label>
                    <Input id="room" name="room" />
                  </div>
                </div>
                <Button disabled={subjects.length === 0} type="submit">
                  Save class
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Enrol student</CardTitle>
              <CardDescription>
                Add an active student to a class.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={enrollStudent} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="classId">Class</Label>
                  <Select name="classId" required>
                    <SelectTrigger id="classId">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentId">Student</Label>
                  <Select name="studentId" required>
                    <SelectTrigger id="studentId">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customFee">Custom monthly fee</Label>
                  <Input
                    id="customFee"
                    min="0"
                    name="customFee"
                    step="0.01"
                    type="number"
                  />
                </div>
                <Button
                  disabled={classes.length === 0 || students.length === 0}
                  type="submit"
                >
                  Enrol student
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Weekly classes</CardTitle>
            <CardDescription>{classes.length} active classes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <Link href={`/classes/${item.id}`}>{item.name}</Link>
                    </TableCell>
                    <TableCell>{item.subject.name}</TableCell>
                    <TableCell>{item.teacher?.fullName ?? "-"}</TableCell>
                    <TableCell>
                      {item.dayOfWeek} {item.startsAt}-{item.endsAt}
                    </TableCell>
                    <TableCell>{formatMoney(item.monthlyFeeSen)}</TableCell>
                    <TableCell>{item.enrollments.length}</TableCell>
                    <TableCell className="text-right">
                      <form action={archiveClass}>
                        <input name="classId" type="hidden" value={item.id} />
                        <Button size="sm" type="submit" variant="outline">
                          Archive
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

export default ClassesPage;
