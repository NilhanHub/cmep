import { NextResponse } from "next/server";
import { prisma } from "@/shared/server/prisma";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { createLifecycleItem } from "@/modules/lifecycle/server/queries";
import { lifecycleCreateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await resolveAppSession();
  const payload = await request.json();
  const meta = {
    flow: "lifecycle.item.create",
    route: "/api/lifecycle/items",
    endpoint: "/api/lifecycle/items",
    workflow: "lifecycle",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Create a tenant-scoped lifecycle card in the selected template.",
    inputSummary: payload,
  };

  try {
    const beforeCount = await prisma.lifecycleItem.count({
      where: { tenantId: session.tenant.id, templateId: payload.templateId },
    });

    return await observeRouteRequest(request, { ...meta, stateBefore: { itemCount: beforeCount } }, async () => {
      const parsed = lifecycleCreateSchema.parse(payload);
      const item = await createLifecycleItem({
        tenantId: session.tenant.id,
        templateId: parsed.templateId,
        title: parsed.title,
        contactId: parsed.contactId ?? undefined,
        organizationId: parsed.organizationId ?? undefined,
        offeringId: parsed.offeringId ?? undefined,
        offeringVariantId: parsed.offeringVariantId ?? undefined,
        ownerUserId: session.user.id,
      });
      return NextResponse.json({ id: item.id });
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
