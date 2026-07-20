import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { QuotesPage } from "@/modules/revenue/components/quotes-page";
import { getRevenueData } from "@/modules/revenue/server/queries";

export default async function QuotesRoute() {
  const session = await resolveAppSession();
  const data = await getRevenueData(session.tenant.id);
  return <QuotesPage data={data} />;
}
