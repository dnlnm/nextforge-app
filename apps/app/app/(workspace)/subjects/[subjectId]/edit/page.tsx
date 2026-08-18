import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database } from "@repo/database";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { EditSubjectForm } from "./edit-subject-form";

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
      <Header
        page="Edit Subject"
        pages={[
          `${appName}`,
          { href: "/subjects", label: "Subjects" },
          subject.name,
        ]}
      />
      <main className="grid gap-5 p-4 pt-4">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit subject</CardTitle>
          </CardHeader>
          <CardContent>
            <EditSubjectForm
              category={subject.category}
              code={subject.code}
              description={subject.description}
              icon={subject.icon}
              name={subject.name}
              subjectId={subject.id}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default SubjectEditPage;
