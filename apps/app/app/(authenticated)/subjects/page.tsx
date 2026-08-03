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
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Header } from "../components/header";
import { createSubject } from "./actions";
import SubjectsList from "./subjects-list";

const SubjectsPage = async () => {
  const tenant = await requireTenant();
  const rawSubjects = await database.subject.findMany({
    where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    orderBy: [{ name: "asc" }],
    include: {
      classes: {
        where: { archivedAt: null },
        include: {
          enrollments: {
            where: { archivedAt: null, status: "ACTIVE" },
            select: { studentId: true },
          },
          teacher: { select: { id: true } },
        },
      },
    },
  });

  const subjects = rawSubjects.map((subject) => {
    const students = new Set(
      subject.classes.flatMap((cls) =>
        cls.enrollments.map((enrollment) => enrollment.studentId)
      )
    );
    const teachers = new Set(
      subject.classes
        .map((cls) => cls.teacher?.id)
        .filter((id): id is string => Boolean(id))
    );

    return {
      classes: subject.classes.length,
      description: subject.description,
      id: subject.id,
      name: subject.name,
      status: subject.status,
      students: students.size,
      teachers: teachers.size,
    };
  });

  return (
    <>
      <Header page="Subjects" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add subject</CardTitle>
            <CardDescription>
              Subjects become the basis for monthly-per-subject fees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createSubject} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Subject name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Mathematics"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <Button type="submit">Save subject</Button>
            </form>
          </CardContent>
        </Card>
        <SubjectsList subjects={subjects} />
      </main>
    </>
  );
};

export default SubjectsPage;
