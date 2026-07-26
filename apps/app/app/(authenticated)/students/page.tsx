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
import { archiveStudent, createStudent, importStudents } from "./actions";

const StudentsPage = async () => {
  const tenant = await requireTenant();
  const students = await database.student.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { fullName: "asc" },
    include: {
      guardians: {
        where: { isPrimary: true },
        include: { guardian: true },
        take: 1,
      },
    },
  });

  return (
    <>
      <Header page="Students" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add student</CardTitle>
            <CardDescription>
              Capture a basic student profile and primary guardian for billing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createStudent} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Student full name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferredName">Preferred name</Label>
                <Input id="preferredName" name="preferredName" />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="schoolName">School</Label>
                  <Input id="schoolName" name="schoolName" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="academicLevel">Academic level</Label>
                  <Input
                    id="academicLevel"
                    name="academicLevel"
                    placeholder="Form 3"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <h2 className="mb-3 font-medium">Primary guardian</h2>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="guardianName">Guardian name</Label>
                    <Input id="guardianName" name="guardianName" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select defaultValue="GUARDIAN" name="relationship">
                      <SelectTrigger id="relationship">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FATHER">Father</SelectItem>
                        <SelectItem value="MOTHER">Mother</SelectItem>
                        <SelectItem value="GUARDIAN">Guardian</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="guardianPhone">Phone</Label>
                      <Input id="guardianPhone" name="guardianPhone" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="guardianEmail">Email</Label>
                      <Input
                        id="guardianEmail"
                        name="guardianEmail"
                        type="email"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <Button type="submit">Save student</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Import students</CardTitle>
            <CardDescription>
              Upload CSV headers: fullName, preferredName, schoolName,
              academicLevel, guardianName, guardianPhone, guardianEmail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={importStudents} className="grid gap-4">
              <Button asChild size="sm" variant="outline">
                <Link href="/students/template">Download CSV template</Link>
              </Button>
              <Input accept=".csv,text/csv" name="csv" required type="file" />
              <Button type="submit" variant="outline">
                Import CSV
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Student roster</CardTitle>
            <CardDescription>{students.length} active students</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const guardian = student.guardians.at(0)?.guardian;

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <Link href={`/students/${student.id}`}>
                          {student.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{student.academicLevel ?? "-"}</TableCell>
                      <TableCell>{guardian?.fullName ?? "-"}</TableCell>
                      <TableCell>{guardian?.phone ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <form action={archiveStudent}>
                          <input
                            name="studentId"
                            type="hidden"
                            value={student.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            Archive
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default StudentsPage;
