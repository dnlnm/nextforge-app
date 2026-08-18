import type { TenantRole } from "@repo/auth/shared";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "@/lib/session-provider";
import { supabase } from "@/lib/supabase";
import { setAccessToken, trpc } from "@/lib/trpc";

export interface OrganizationMembership {
  id: string;
  organization: {
    id: string;
    imageUrl: string | null;
    name: string;
    slug: string;
  };
  role: TenantRole;
}

interface OrganizationContextValue {
  activeMembership: OrganizationMembership | null;
  isLoading: boolean;
  isSwitching: boolean;
  memberships: OrganizationMembership[];
  role: TenantRole | null;
  switchOrganization: (organizationId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(
  undefined
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id ?? null;
  const [queryUserId, setQueryUserId] = useState(userId);
  const isUserTransition = queryUserId !== userId;

  useEffect(() => {
    if (queryUserId !== userId) {
      queryClient.clear();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs the query scope when the signed-in user changes.
      setQueryUserId(userId);
    }
  }, [queryClient, queryUserId, userId]);

  const membershipsQuery = trpc.organizations.memberships.useQuery(undefined, {
    enabled: Boolean(session) && !isUserTransition,
  });
  const validateSwitch = trpc.organizations.validateSwitch.useMutation();
  const activeOrganizationId = session?.user.user_metadata
    ?.activeOrganizationId as string | undefined;
  const memberships = (
    isUserTransition ? [] : (membershipsQuery.data ?? [])
  ) as OrganizationMembership[];
  const activeMembership =
    memberships.find(
      (membership) => membership.organization.id === activeOrganizationId
    ) ?? null;

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      await validateSwitch.mutateAsync({ organizationId });

      const { error } = await supabase.auth.updateUser({
        data: { activeOrganizationId: organizationId },
      });

      if (error) {
        throw error;
      }

      const { data, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError || !data.session) {
        throw refreshError ?? new Error("Could not refresh your session.");
      }

      setAccessToken(data.session.access_token);
      await queryClient.invalidateQueries();
    },
    [queryClient, validateSwitch]
  );

  return (
    <OrganizationContext.Provider
      value={{
        activeMembership,
        isLoading: isUserTransition || membershipsQuery.isLoading,
        isSwitching: validateSwitch.isPending,
        memberships,
        role: activeMembership?.role ?? null,
        switchOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider."
    );
  }

  return context;
}
