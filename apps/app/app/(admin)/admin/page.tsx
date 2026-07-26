import { requirePlatformAdmin } from "@repo/auth/authorization";
import { database } from "@repo/database";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founder Dashboard - TLAS.MY",
};

const AdminPage = async () => {
  await requirePlatformAdmin();
  const [centres, activeCentres, users, memberships] = await Promise.all([
    database.organization.count(),
    database.organization.count({ where: { status: "ACTIVE" } }),
    database.user.count({ where: { archivedAt: null } }),
    database.organizationMembership.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="font-semibold text-2xl">Founder dashboard</h1>
        <p className="text-muted-foreground">
          Platform metadata only. Tenant operational records stay out of the
          default superadmin view.
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total centres</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold text-3xl">
            {centres}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active centres</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold text-3xl">
            {activeCentres}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold text-3xl">{users}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Memberships</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold text-3xl">
            {memberships}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdminPage;
