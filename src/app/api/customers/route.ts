import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { createCustomer } from "@/modules/customer-graph/server/queries";
import { customerCreateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";
import { prisma } from "@/shared/server/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await resolveAppSession();
  const formData = await request.formData();
  const payload = {
    kind: formData.get("kind"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    segment: formData.get("segment"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  };
  const meta = {
    flow: "customer.create",
    route: "/api/customers",
    endpoint: "/api/customers",
    workflow: "customer-graph",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Create a tenant-scoped customer record.",
    inputSummary: payload,
  };

  try {
    const beforeCounts = await Promise.all([
      prisma.contact.count({ where: { tenantId: session.tenant.id } }),
      prisma.organization.count({ where: { tenantId: session.tenant.id } }),
    ]);

    return await observeRouteRequest(
      request,
      {
        ...meta,
        stateBefore: { contactCount: beforeCounts[0], organizationCount: beforeCounts[1] },
      },
      async () => {
        const parsed = customerCreateSchema.parse(payload);
        const created = await createCustomer(session.tenant.id, session.user.id, parsed);
        return NextResponse.redirect(new URL(`/app/customers/${created.id}`, request.url));
      },
    );
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
