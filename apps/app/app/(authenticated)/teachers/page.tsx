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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { Header } from "../components/header";
import { archiveTeacher, createTeacher } from "./actions";

const TeachersPage = async () => {
  const tenant = await requireTenant();
  const teachers = await database.teacherProfile.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { fullName: "asc" },
  });

  return (
    <>
      <Header page="Teachers" pages={["TLAS.MY"]} />
      <main className="grid gap-4 p-4 pt-0 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add teacher</CardTitle>
            <CardDescription>
              Create the profile used for future class assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTeacher} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Teacher name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <Button type="submit">Save teacher</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Teacher profiles</CardTitle>
            <CardDescription>{teachers.length} active teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      {teacher.fullName}
                    </TableCell>
                    <TableCell>{teacher.phone ?? "-"}</TableCell>
                    <TableCell>{teacher.email ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <form action={archiveTeacher}>
                        <input
                          name="teacherId"
                          type="hidden"
                          value={teacher.id}
                        />
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

export default TeachersPage;
