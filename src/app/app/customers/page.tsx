import { CustomersPage } from "@/modules/customer-graph/components/customers-page";
import { getCustomersPageData } from "@/modules/customer-graph/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";

export default async function CustomersRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await resolveAppSession();
  const data = await getCustomersPageData(session.tenant.id, q);

  return <CustomersPage data={data} query={q} />;
}
