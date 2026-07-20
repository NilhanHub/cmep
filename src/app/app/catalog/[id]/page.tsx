import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { OfferingDetailPage } from "@/modules/catalog/components/offering-detail";
import { getOfferingDetail } from "@/modules/catalog/server/queries";
import { observeServerFlow } from "@/shared/observability/server";

export const runtime = "nodejs";

export default async function OfferingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveAppSession();
  const data = await observeServerFlow(
    {
      flow: "catalog.detail.load",
      route: `/app/catalog/${id}`,
      screen: "/app/catalog/[id]",
      workflow: "catalog",
      tenantId: session.tenant.id,
      userId: session.user.id,
      expectedResult: "Load an offering detail page with routes, pricing, and customer relationships.",
    },
    () => getOfferingDetail(session.tenant.id, id),
  );

  return <OfferingDetailPage data={data} />;
}
