"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createOrganization } from "../actions";

export const OrganizationOnboarding = () => {
  const [name, setName] = useState("");
  const router = useRouter();

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createOrganization(name);
    router.push("/");
    router.refresh();
  };

  return (
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
  );
};
