import { ensureLocalUser } from "@repo/auth/organizations";
import { database } from "@repo/database";
import { BriefcaseIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspacePageHeader } from "../components/page-header";
import { WorkspaceCard } from "../components/workspace-card";
import { EmptyState, WorkspaceGrid } from "../components/workspace-grid";

export const metadata: Metadata = {
  title: "Admin Centres - TLAS.MY",
  description: "Centres where you have admin access",
};

const AdminWorkspacesPage = async () => {
  const user = await ensureLocalUser();

  if (!user) {
    redirect("/sign-in");
  }

  const memberships = await database.organizationMembership.findMany({
    where: {
      userId: user.id,
      role: "ADMIN",
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
    role: "ADMIN" as const,
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
        description="The tuition centres where you have admin access"
        icon={<BriefcaseIcon className="size-8" />}
        title="Admin Centres"
      />
      {centres.length === 0 ? (
        <EmptyState
          description="You don't have admin access to any centres yet. Ask a centre owner to invite you as an admin."
          title="No admin centres"
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

export default AdminWorkspacesPage;
