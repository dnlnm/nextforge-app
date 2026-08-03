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
import { PlusIcon } from "lucide-react";
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
      code: subject.code,
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
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Subjects</h1>
            <p className="text-muted-foreground text-sm">
              Manage subjects and their monthly fees.
            </p>
          </div>
          <Button asChild className="flex-1 md:flex-none">
            <a href="#add-subject">
              <PlusIcon className="size-4" />
              Add Subject
            </a>
          </Button>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[360px_1fr]">
          <Card id="add-subject">
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
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    maxLength={4}
                    name="code"
                    placeholder="MATH"
                    required
                  />
                  <p className="text-muted-foreground text-xs">
                    Max 4 alphanumeric characters. Used to build class codes.
                  </p>
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
        </div>
      </main>
    </>
  );
};

export default SubjectsPage;
