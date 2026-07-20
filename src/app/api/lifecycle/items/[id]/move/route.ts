import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { moveLifecycleItem } from "@/modules/lifecycle/server/queries";
import { lifecycleMoveSchema } from "@/shared/domain/schemas";
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
    flow: "lifecycle.item.move",
    route: `/api/lifecycle/items/${id}/move`,
    endpoint: "/api/lifecycle/items/[id]/move",
    workflow: "lifecycle",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Move a lifecycle card into a new stage inside the active tenant.",
    inputSummary: payload,
  };

  try {
    const before = await prisma.lifecycleItem.findFirst({
      where: { tenantId: session.tenant.id, id },
      select: { stageId: true, status: true, riskFlag: true },
    });

    return await observeRouteRequest(request, { ...meta, stateBefore: before }, async () => {
      const parsed = lifecycleMoveSchema.parse(payload);
      await moveLifecycleItem({
        tenantId: session.tenant.id,
        itemId: id,
        stageId: parsed.stageId,
      });
      return NextResponse.json({ ok: true });
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
