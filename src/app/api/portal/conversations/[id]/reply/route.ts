import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { receivePortalReply } from "@/modules/inbox/server/queries";
import { assertPortalConversationAccess } from "@/modules/portal/server/queries";
import { portalCookieName } from "@/shared/domain/constants";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const payload = (await request.json()) as { body: string };
  const cookieStore = await cookies();
  const accessKey = cookieStore.get(portalCookieName)?.value;
  const meta = {
    flow: "portal.reply.send",
    route: `/api/portal/conversations/${id}/reply`,
    endpoint: "/api/portal/conversations/[id]/reply",
    workflow: "portal",
    portalAccessKey: accessKey ?? null,
    expectedResult: "Send a reply inside the currently scoped client portal conversation.",
    inputSummary: payload,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      const { currentAccess } = await assertPortalConversationAccess(accessKey, id);

      await receivePortalReply({
        tenantId: currentAccess.tenantId,
        conversationId: id,
        body: payload.body,
        contactId: currentAccess.contactId,
        organizationId: currentAccess.organizationId,
      });

      return NextResponse.json({ ok: true });
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
