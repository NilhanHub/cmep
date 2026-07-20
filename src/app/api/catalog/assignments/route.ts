import { NextResponse } from "next/server";

import { createCatalogAssignment } from "@/modules/catalog/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { catalogAssignmentCreateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await resolveAppSession();
  const payload = Object.fromEntries((await request.formData()).entries());
  const meta = {
    flow: "catalog.assignment.create",
    route: "/api/catalog/assignments",
    endpoint: "/api/catalog/assignments",
    workflow: "catalog",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Assign a catalog to a tenant-specific customer or segment.",
    inputSummary: payload,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      const parsed = catalogAssignmentCreateSchema.parse(payload);
      await createCatalogAssignment({
        tenantId: session.tenant.id,
        catalogId: parsed.catalogId,
        contactId: parsed.contactId ?? undefined,
        organizationId: parsed.organizationId ?? undefined,
        segment: parsed.segment ?? undefined,
        portalVisible: parsed.portalVisible,
      });

      return NextResponse.redirect(new URL("/app/catalog", request.url));
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
