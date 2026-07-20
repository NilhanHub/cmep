import { CustomerDetailView } from "@/modules/customer-graph/components/customer-detail";
import { getCustomerDetail } from "@/modules/customer-graph/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { observeServerFlow } from "@/shared/observability/server";

export const runtime = "nodejs";

export default async function CustomerDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveAppSession();
  const detail = await observeServerFlow(
    {
      flow: "customer.view",
      route: `/app/customers/${id}`,
      screen: "/app/customers/[id]",
      workflow: "customer-graph",
      tenantId: session.tenant.id,
      userId: session.user.id,
      expectedResult: "Load a tenant-scoped customer detail page.",
      inputSummary: { customerId: id },
    },
    () => getCustomerDetail(session.tenant.id, id),
  );

  return <CustomerDetailView detail={detail} />;
}
