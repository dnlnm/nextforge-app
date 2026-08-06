import { ensureLocalUser } from "@repo/auth/organizations";
import { database } from "@repo/database";
import { GraduationCapIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "../components/page-header";
import { WorkspaceCard } from "../components/workspace-card";
import { EmptyState, WorkspaceGrid } from "../components/workspace-grid";

export const metadata: Metadata = {
  title: "Teacher Centres - TLAS.MY",
  description: "Centres where you teach",
};

const TeacherWorkspacesPage = async () => {
  const user = await ensureLocalUser();

  if (!user) {
    redirect("/sign-in");
  }

  const memberships = await database.organizationMembership.findMany({
    where: {
      userId: user.id,
      role: "TEACHER",
      status: "ACTIVE",
      organization: { status: "ACTIVE" },
    },
    orderBy: { createdAt: "asc" },
    select: {
      organization: {
        select: {
          id: true,
          imageUrl: true,
          name: true,
          slug: true,
          _count: {
            select: {
              students: { where: { archivedAt: null } },
              classes: { where: { archivedAt: null } },
            },
          },
        },
      },
    },
  });

  const centres = memberships.map(({ organization }) => ({
    id: organization.id,
    imageUrl: organization.imageUrl,
    name: organization.name,
    role: "TEACHER" as const,
    slug: organization.slug,
    stats: {
      students: organization._count.students,
      classes: organization._count.classes,
    },
  }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <WorkspacePageHeader
        count={centres.length}
        description="The tuition centres where you teach"
        icon={<GraduationCapIcon className="size-8" />}
        title="Teacher Centres"
      />
      {centres.length === 0 ? (
        <EmptyState
          description="You're not teaching at any centres yet. Ask a centre admin or owner to invite you."
          title="No teacher centres"
        />
      ) : (
        <WorkspaceGrid>
          {centres.map((centre) => (
            <WorkspaceCard
              imageUrl={centre.imageUrl}
              key={centre.id}
              name={centre.name}
              role={centre.role}
              slug={centre.slug}
              stats={centre.stats}
            />
          ))}
        </WorkspaceGrid>
      )}
    </div>
  );
};

export default TeacherWorkspacesPage;
