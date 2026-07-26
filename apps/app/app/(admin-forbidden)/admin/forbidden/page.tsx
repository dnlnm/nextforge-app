import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import Link from "next/link";

const AdminForbiddenPage = () => (
  <main className="flex min-h-dvh items-center justify-center p-6">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Founder access required</CardTitle>
        <CardDescription>
          This dashboard is restricted to TLAS.MY platform administrators.
          Centre owners and admins cannot access it by default.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/">Return to centre dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  </main>
);

export default AdminForbiddenPage;
