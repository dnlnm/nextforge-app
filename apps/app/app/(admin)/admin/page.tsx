import { requirePlatformAdmin } from "@repo/auth/authorization";
import { database } from "@repo/database";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founder Dashboard - TLAS.MY",
};

const AdminPage = async () => {
  await requirePlatformAdmin();
  const [centres, activeCentres, users, memberships, subscriptions] =
    await Promise.all([
      database.organization.count(),
      database.organization.count({ where: { status: "ACTIVE" } }),
      database.user.count({ where: { archivedAt: null } }),
      database.organizationMembership.count({ where: { status: "ACTIVE" } }),
      database.organizationSubscription.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          organization: {
            select: {
              name: true,
              _count: {
                select: {
                  classes: { where: { status: "ACTIVE" } },
                  students: { where: { status: "ACTIVE" } },
                  teachers: { where: { archivedAt: null } },
                },
              },
            },
          },
        },
        take: 25,
      }),
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
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centre</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Stripe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">
                    {subscription.organization.name}
                  </TableCell>
                  <TableCell>{subscription.plan}</TableCell>
                  <TableCell>{subscription.status}</TableCell>
                  <TableCell>
                    {subscription.organization._count.students} students,{" "}
                    {subscription.organization._count.teachers} teachers,{" "}
                    {subscription.organization._count.classes} classes
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {subscription.stripeCustomerId ?? "No customer"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
};

export default AdminPage;
