import { NextResponse } from "next/server";

import { createOfferingVariant } from "@/modules/catalog/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { offeringVariantCreateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await resolveAppSession();
  const payload = Object.fromEntries((await request.formData()).entries());
  const meta = {
    flow: "catalog.variant.create",
    route: "/api/catalog/variants",
    endpoint: "/api/catalog/variants",
    workflow: "catalog",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Create a variant for an existing offering.",
    inputSummary: payload,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      const parsed = offeringVariantCreateSchema.parse(payload);
      await createOfferingVariant({
        tenantId: session.tenant.id,
        offeringId: parsed.offeringId,
        code: parsed.code,
        name: parsed.name,
        displayLabel: parsed.displayLabel,
        optionName: parsed.optionName ?? undefined,
        optionValue: parsed.optionValue ?? undefined,
        serviceDurationMinutes: parsed.serviceDurationMinutes ?? undefined,
      });

      return NextResponse.redirect(new URL(`/app/catalog/${parsed.offeringId}`, request.url));
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
