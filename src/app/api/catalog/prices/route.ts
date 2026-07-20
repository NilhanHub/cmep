import { NextResponse } from "next/server";

import { createOfferingPrice } from "@/modules/catalog/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { offeringPriceCreateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await resolveAppSession();
  const payload = Object.fromEntries((await request.formData()).entries());
  const meta = {
    flow: "catalog.price.create",
    route: "/api/catalog/prices",
    endpoint: "/api/catalog/prices",
    workflow: "catalog",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Create a new offering price version.",
    inputSummary: payload,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      const parsed = offeringPriceCreateSchema.parse(payload);
      await createOfferingPrice({
        tenantId: session.tenant.id,
        offeringId: parsed.offeringId,
        variantId: parsed.variantId ?? undefined,
        name: parsed.name,
        amountCents: parsed.amountCents,
        billingModel: parsed.billingModel,
        interval: parsed.interval,
        intervalCount: parsed.intervalCount ?? undefined,
      });

      return NextResponse.redirect(new URL(`/app/catalog/${parsed.offeringId}`, request.url));
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
