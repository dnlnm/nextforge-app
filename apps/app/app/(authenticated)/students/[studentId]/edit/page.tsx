import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { updateStudent } from "../../actions";

interface StudentEditPageProperties {
  readonly params: Promise<{ studentId: string }>;
}

const StudentEditPage = async ({ params }: StudentEditPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { studentId } = await params;
  const student = await database.student.findFirst({
    where: { id: studentId, organizationId: tenant.organizationId },
    include: {
      guardians: {
        where: { isPrimary: true },
        include: { guardian: true },
        take: 1,
      },
    },
  });

  if (!student) {
    notFound();
  }

  const guardian = student.guardians.at(0)?.guardian;

  if (!guardian) {
    notFound();
  }

  return (
    <>
      <Header page="Edit Student" pages={["Students", student.fullName]} />
      <main className="p-4 pt-0">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit student</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateStudent} className="grid gap-4">
              <input name="studentId" type="hidden" value={student.id} />
              <input name="guardianId" type="hidden" value={guardian.id} />
              <div className="grid gap-2">
                <Label htmlFor="fullName">Student full name</Label>
                <Input
                  defaultValue={student.fullName}
                  id="fullName"
                  name="fullName"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferredName">Preferred name</Label>
                <Input
                  defaultValue={student.preferredName ?? ""}
                  id="preferredName"
                  name="preferredName"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="schoolName">School</Label>
                  <Input
                    defaultValue={student.schoolName ?? ""}
                    id="schoolName"
                    name="schoolName"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="academicLevel">Academic level</Label>
                  <Input
                    defaultValue={student.academicLevel ?? ""}
                    id="academicLevel"
                    name="academicLevel"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <h2 className="mb-3 font-medium">Primary guardian</h2>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="guardianName">Guardian name</Label>
                    <Input
                      defaultValue={guardian.fullName}
                      id="guardianName"
                      name="guardianName"
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="guardianPhone">Phone</Label>
                      <Input
                        defaultValue={guardian.phone ?? ""}
                        id="guardianPhone"
                        name="guardianPhone"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="guardianEmail">Email</Label>
                      <Input
                        defaultValue={guardian.email ?? ""}
                        id="guardianEmail"
                        name="guardianEmail"
                        type="email"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save changes</Button>
                <Button asChild variant="outline">
                  <Link href={`/students/${student.id}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default StudentEditPage;
