import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { QuoteDetailSheet } from "@/modules/revenue/components/revenue-detail";
import { getQuoteDetail } from "@/modules/revenue/server/queries";

export default async function QuoteDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await resolveAppSession();
  const quote = await getQuoteDetail(session.tenant.id, id);
  return <QuoteDetailSheet quote={quote} />;
}
