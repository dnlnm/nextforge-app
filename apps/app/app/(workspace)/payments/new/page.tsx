import { requireTenantRole } from "@repo/auth/authorization";
import { formatCalendarDate, getMalaysiaToday } from "@repo/date";
import { getOrganizationCurrency } from "@/lib/currency";
import { Header } from "../../components/header";
import { RecordPaymentPage } from "./record-payment-page";

const RecordPaymentNewPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const currency = await getOrganizationCurrency(tenant.organizationId);
  const today = formatCalendarDate(getMalaysiaToday());

  return (
    <>
      <Header
        page="Record Payment"
        pages={[{ href: "/payments", label: "Payments" }]}
      />
      <main className="p-4 pt-2 sm:p-6 sm:pt-4">
        <RecordPaymentPage currency={currency} today={today} />
      </main>
    </>
  );
};

export default RecordPaymentNewPage;
