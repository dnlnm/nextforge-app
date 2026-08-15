import { database } from "@repo/database";
import { DEFAULT_CURRENCY } from "@repo/money";
import { cache } from "react";

export const getOrganizationCurrency = cache(
  async (organizationId: string): Promise<string> => {
    const settings = await database.organizationSettings.findUnique({
      where: { organizationId },
      select: { currency: true },
    });

    return settings?.currency ?? DEFAULT_CURRENCY;
  }
);
