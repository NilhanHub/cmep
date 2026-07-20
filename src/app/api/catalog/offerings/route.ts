import { NextResponse } from "next/server";

import { createOffering } from "@/modules/catalog/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { offeringCreateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await resolveAppSession();
  const formData = await request.formData();
  const payload = Object.fromEntries(formData.entries());
  const meta = {
    flow: "catalog.offering.create",
    route: "/api/catalog/offerings",
    endpoint: "/api/catalog/offerings",
    workflow: "catalog",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Create a tenant-scoped offering with an optional starter variant and price.",
    inputSummary: payload,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      const parsed = offeringCreateSchema.parse(payload);
      const offering = await createOffering({
        tenantId: session.tenant.id,
        type: parsed.type,
        name: parsed.name,
        code: parsed.code,
        family: parsed.family,
        category: parsed.category,
        summary: parsed.summary,
        description: parsed.description,
        unitLabel: parsed.unitLabel,
        variantCode: parsed.variantCode ?? undefined,
        variantName: parsed.variantName ?? undefined,
        variantLabel: parsed.variantLabel ?? undefined,
        priceName: parsed.priceName ?? undefined,
        priceAmountCents: parsed.priceAmountCents ?? undefined,
        billingModel: parsed.billingModel,
        interval: parsed.interval,
      });

      return NextResponse.redirect(new URL(`/app/catalog/${offering.id}`, request.url));
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
