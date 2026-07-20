import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { sendConversationMessage } from "@/modules/inbox/server/queries";
import { messageCreateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";
import { prisma } from "@/shared/server/prisma";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await resolveAppSession();
  const { id } = await context.params;
  const payload = await request.json();
  const meta = {
    flow: "inbox.message.send",
    route: `/api/inbox/conversations/${id}/messages`,
    endpoint: "/api/inbox/conversations/[id]/messages",
    workflow: "inbox",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Append a new message or internal note to the selected conversation.",
    inputSummary: payload,
  };

  try {
    const before = await prisma.conversation.findFirst({
      where: { tenantId: session.tenant.id, id },
      select: { unreadCount: true, status: true, messages: { select: { id: true } } },
    });

    return await observeRouteRequest(request, { ...meta, stateBefore: before }, async () => {
      const parsed = messageCreateSchema.parse(payload);
      await sendConversationMessage({
        tenantId: session.tenant.id,
        userId: session.user.id,
        conversationId: id,
        body: parsed.body,
        isInternalNote: parsed.isInternalNote,
        cannedReplyId: parsed.cannedReplyId,
      });
      return NextResponse.json({ ok: true });
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
