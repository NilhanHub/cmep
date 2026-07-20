import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { createInvoice } from "@/modules/revenue/server/queries";
import { invoiceCreateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";
import { prisma } from "@/shared/server/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await resolveAppSession();
  const formData = await request.formData();
  const payload = {
    contactId: formData.get("contactId"),
    organizationId: formData.get("organizationId"),
    notes: formData.get("notes"),
    reference: formData.get("reference"),
    offeringPriceId: formData.get("offeringPriceId"),
    quantity: formData.get("quantity"),
    isAdHoc: formData.get("isAdHoc"),
    adHocDescription: formData.get("adHocDescription"),
    adHocUnitPriceCents: formData.get("adHocUnitPriceCents"),
  };
  const meta = {
    flow: "revenue.invoice.create",
    route: "/api/revenue/invoices",
    endpoint: "/api/revenue/invoices",
    workflow: "revenue",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Create a new invoice in the active tenant.",
    inputSummary: payload,
  };

  try {
    const beforeCount = await prisma.invoice.count({ where: { tenantId: session.tenant.id } });

    return await observeRouteRequest(request, { ...meta, stateBefore: { invoiceCount: beforeCount } }, async () => {
      const parsed = invoiceCreateSchema.parse(payload);

      const invoice = await createInvoice({
        tenantId: session.tenant.id,
        reference: parsed.reference,
        notes: parsed.notes,
        contactId: parsed.contactId || undefined,
        organizationId: parsed.organizationId || undefined,
        offeringPriceId: parsed.offeringPriceId || undefined,
        quantity: parsed.quantity ?? undefined,
        isAdHoc: parsed.isAdHoc,
        adHocDescription: parsed.adHocDescription || undefined,
        adHocUnitPriceCents: parsed.adHocUnitPriceCents ?? undefined,
      });

      return NextResponse.redirect(new URL(`/app/revenue/invoices/${invoice.id}`, request.url));
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
