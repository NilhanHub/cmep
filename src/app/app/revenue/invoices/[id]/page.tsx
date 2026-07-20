import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { InvoiceDetailSheet } from "@/modules/revenue/components/revenue-detail";
import { getInvoiceDetail } from "@/modules/revenue/server/queries";

export default async function InvoiceDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveAppSession();
  const invoice = await getInvoiceDetail(session.tenant.id, id);
  return <InvoiceDetailSheet invoice={invoice} />;
}
