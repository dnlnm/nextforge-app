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
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Header } from "../components/header";
import { archiveSubject, createSubject } from "./actions";

const SubjectsPage = async () => {
  const tenant = await requireTenant();
  const subjects = await database.subject.findMany({
    where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    orderBy: [{ academicLevel: "asc" }, { name: "asc" }],
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
                <Label htmlFor="academicLevel">Academic level</Label>
                <Input
                  id="academicLevel"
                  name="academicLevel"
                  placeholder="Form 3"
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
        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>{subjects.length} active subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">
                      {subject.name}
                    </TableCell>
                    <TableCell>{subject.academicLevel ?? "-"}</TableCell>
                    <TableCell>{subject.description ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <form action={archiveSubject}>
                        <input
                          name="subjectId"
                          type="hidden"
                          value={subject.id}
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

export default SubjectsPage;
