import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { updateCustomer } from "@/modules/customer-graph/server/queries";
import { customerUpdateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";
import { prisma } from "@/shared/server/prisma";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await resolveAppSession();
  const { id } = await context.params;
  const formData = await request.formData();
  const payload = {
    name: formData.get("name"),
    segment: formData.get("segment"),
    lifecycleStage: formData.get("lifecycleStage"),
    notes: formData.get("notes"),
    tags: formData.get("tags"),
  };
  const meta = {
    flow: "customer.update",
    route: `/api/customers/${id}`,
    endpoint: "/api/customers/[id]",
    workflow: "customer-graph",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Update a tenant-scoped customer record.",
    inputSummary: payload,
  };

  try {
    const before =
      id.startsWith("contact_")
        ? await prisma.contact.findFirst({
            where: { tenantId: session.tenant.id, id },
            select: { displayName: true, segment: true, lifecycleStage: true, tags: true },
          })
        : await prisma.organization.findFirst({
            where: { tenantId: session.tenant.id, id },
            select: { name: true, segment: true, lifecycleStage: true, tags: true },
          });

    return await observeRouteRequest(request, { ...meta, stateBefore: before }, async () => {
      const parsed = customerUpdateSchema.parse(payload);
      await updateCustomer(session.tenant.id, id, parsed);
      return NextResponse.redirect(new URL(`/app/customers/${id}`, request.url));
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
