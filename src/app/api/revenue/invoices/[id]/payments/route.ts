import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { markInvoicePaid } from "@/modules/revenue/server/queries";
import { invoicePaymentSchema } from "@/shared/domain/schemas";
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
    flow: "revenue.invoice.paymentMark",
    route: `/api/revenue/invoices/${id}/payments`,
    endpoint: "/api/revenue/invoices/[id]/payments",
    workflow: "revenue",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Record a local manual invoice payment in the active tenant.",
    inputSummary: payload,
  };

  try {
    const before = await prisma.invoice.findFirst({
      where: { tenantId: session.tenant.id, id },
      select: { status: true, balanceCents: true },
    });

    return await observeRouteRequest(request, { ...meta, stateBefore: before }, async () => {
      const parsed = invoicePaymentSchema.parse(payload);

      if (parsed.markPaid) {
        await markInvoicePaid({
          tenantId: session.tenant.id,
          invoiceId: id,
        });
      }

      return NextResponse.json({ ok: true });
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
