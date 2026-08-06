import { requireTenant } from "@repo/auth/authorization";
import { getMainDomain } from "@repo/auth/domain";
import { redirect } from "next/navigation";

const BillingPage = async () => {
  const tenant = await requireTenant();

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  redirect(
    `${protocol}://${getMainDomain()}/centres/${tenant.organizationId}/billing`
  );
};

export default BillingPage;
