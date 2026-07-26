"use client";

import { CreateOrganization, OrganizationList } from "@repo/auth/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";

export const OrganizationOnboarding = () => (
  <Tabs className="w-full" defaultValue="create">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="create">Create centre</TabsTrigger>
      <TabsTrigger value="select">Select centre</TabsTrigger>
    </TabsList>
    <TabsContent className="mt-6" value="create">
      <CreateOrganization afterCreateOrganizationUrl="/onboarding/synchronizing" />
    </TabsContent>
    <TabsContent className="mt-6" value="select">
      <OrganizationList
        afterSelectOrganizationUrl="/onboarding/synchronizing"
        hidePersonal
      />
    </TabsContent>
  </Tabs>
);
