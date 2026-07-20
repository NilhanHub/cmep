import { InboxPage } from "@/modules/inbox/components/inbox-page";
import { getInboxData } from "@/modules/inbox/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { observeServerFlow } from "@/shared/observability/server";

export const runtime = "nodejs";

export default async function InboxRoute({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { conversation } = await searchParams;
  const session = await resolveAppSession();
  const data = await observeServerFlow(
    {
      flow: "inbox.thread.load",
      route: conversation ? `/app/inbox?conversation=${conversation}` : "/app/inbox",
      screen: "/app/inbox",
      workflow: "inbox",
      tenantId: session.tenant.id,
      userId: session.user.id,
      expectedResult: "Load the inbox and selected thread for the active tenant.",
      inputSummary: { conversationId: conversation ?? null },
    },
    () => getInboxData(session.tenant.id, conversation),
  );

  return <InboxPage data={data} />;
}
