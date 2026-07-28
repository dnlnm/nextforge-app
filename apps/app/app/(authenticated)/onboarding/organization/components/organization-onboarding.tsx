"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createOrganization,
  getOrganizations,
  switchOrganization,
} from "../actions";

export const OrganizationOnboarding = () => {
  const [name, setName] = useState("");
  const [organizations, setOrganizations] = useState<
    Awaited<ReturnType<typeof getOrganizations>>
  >([]);
  const router = useRouter();

  useEffect(() => {
    getOrganizations()
      .then(setOrganizations)
      .catch(() => undefined);
  }, []);

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createOrganization(name);
    router.push("/");
    router.refresh();
  };

  return (
    <Tabs className="w-full" defaultValue="create">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="create">Create centre</TabsTrigger>
        <TabsTrigger value="select">Select centre</TabsTrigger>
      </TabsList>
      <TabsContent className="mt-6" value="create">
        <form className="grid gap-4" onSubmit={create}>
          <Label htmlFor="organization-name">Centre name</Label>
          <Input
            id="organization-name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          <Button type="submit">Create centre</Button>
        </form>
      </TabsContent>
      <TabsContent className="mt-6" value="select">
        <div className="grid gap-2">
          {organizations.map((membership) => (
            <Button
              key={membership.id}
              onClick={() =>
                switchOrganization(membership.organization.id)
                  .then(() => {
                    router.push("/");
                    router.refresh();
                  })
                  .catch(() => undefined)
              }
              variant="outline"
            >
              {membership.organization.name}
            </Button>
          ))}
          {organizations.length ? null : (
            <p className="text-muted-foreground text-sm">No centres yet.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};
