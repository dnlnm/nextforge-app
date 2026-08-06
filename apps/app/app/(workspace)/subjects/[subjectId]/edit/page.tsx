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
import { Textarea } from "@repo/design-system/components/ui/textarea";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { updateSubject } from "../../actions";

interface SubjectEditPageProperties {
  readonly params: Promise<{ subjectId: string }>;
}

const SubjectEditPage = async ({ params }: SubjectEditPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { subjectId } = await params;
  const subject = await database.subject.findFirst({
    where: { id: subjectId, organizationId: tenant.organizationId },
  });

  if (!subject) {
    notFound();
  }

  return (
    <>
      <Header page="Edit Subject" pages={["Subjects", subject.name]} />
      <main className="p-4 pt-0">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit subject</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateSubject} className="grid gap-4">
              <input name="subjectId" type="hidden" value={subject.id} />
              <div className="grid gap-2">
                <Label htmlFor="name">Subject name</Label>
                <Input
                  defaultValue={subject.name}
                  id="name"
                  name="name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  defaultValue={subject.code}
                  id="code"
                  maxLength={4}
                  name="code"
                  required
                />
                <p className="text-muted-foreground text-xs">
                  Max 4 alphanumeric characters. Used to build class codes.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  defaultValue={subject.description ?? ""}
                  id="description"
                  name="description"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save changes</Button>
                <Button asChild variant="outline">
                  <Link href={`/subjects/${subject.id}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default SubjectEditPage;
