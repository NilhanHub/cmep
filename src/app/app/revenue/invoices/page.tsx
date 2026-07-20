import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { InvoicesPage } from "@/modules/revenue/components/invoices-page";
import { getRevenueData } from "@/modules/revenue/server/queries";

export default async function InvoicesRoute() {
  const session = await resolveAppSession();
  const data = await getRevenueData(session.tenant.id);
  return <InvoicesPage data={data} />;
}
