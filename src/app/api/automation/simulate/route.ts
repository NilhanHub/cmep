import { AutomationTriggerType } from "@prisma/client";
import { NextResponse } from "next/server";

import { runAutomationsForEvent } from "@/modules/automation/server/engine";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { prisma } from "@/shared/server/prisma";
import { automationSimulateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await resolveAppSession();
  const raw = await request.json();
  const meta = {
    flow: "automation.simulate",
    route: "/api/automation/simulate",
    endpoint: "/api/automation/simulate",
    workflow: "automation",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Simulate or apply automation rules for the selected source entity.",
    inputSummary: raw,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      const payload = automationSimulateSchema.parse(raw);

      let metadata: Record<string, unknown> = {};
      let contactId: string | undefined;
      let organizationId: string | undefined;
      let ownerUserId: string | undefined;

      if (payload.sourceType === "LifecycleItem") {
        const item = await prisma.lifecycleItem.findFirstOrThrow({
          where: { tenantId: session.tenant.id, id: payload.sourceId },
        });
        metadata = { templateId: item.templateId, toStageId: item.stageId, tags: item.tags, offeringId: item.offeringId, offeringVariantId: item.offeringVariantId, customerOfferingLinkId: item.customerOfferingLinkId };
        contactId = item.contactId ?? undefined;
        organizationId = item.organizationId ?? undefined;
        ownerUserId = item.ownerUserId;
      }

      if (payload.sourceType === "Conversation") {
        const conversation = await prisma.conversation.findFirstOrThrow({
          where: { tenantId: session.tenant.id, id: payload.sourceId },
        });
        metadata = { tags: conversation.tags };
        contactId = conversation.contactId ?? undefined;
        organizationId = conversation.organizationId ?? undefined;
      }

      if (payload.sourceType === "Booking") {
        const booking = await prisma.booking.findFirstOrThrow({
          where: { tenantId: session.tenant.id, id: payload.sourceId },
        });
        metadata = { bookingTypeId: booking.bookingTypeId, offeringId: booking.offeringId, offeringVariantId: booking.offeringVariantId, customerOfferingLinkId: booking.customerOfferingLinkId };
        contactId = booking.contactId ?? undefined;
        organizationId = booking.organizationId ?? undefined;
      }

      if (payload.sourceType === "Quote") {
        const quote = await prisma.quote.findFirstOrThrow({
          where: { tenantId: session.tenant.id, id: payload.sourceId },
          include: { lineItems: true },
        });
        metadata = { reference: quote.reference, offeringId: quote.lineItems[0]?.offeringId, offeringVariantId: quote.lineItems[0]?.offeringVariantId, customerOfferingLinkId: quote.lineItems[0]?.customerOfferingLinkId };
        contactId = quote.contactId ?? undefined;
        organizationId = quote.organizationId ?? undefined;
      }

      if (payload.sourceType === "Invoice") {
        const invoice = await prisma.invoice.findFirstOrThrow({
          where: { tenantId: session.tenant.id, id: payload.sourceId },
          include: { lineItems: true },
        });
        metadata = { amountCents: invoice.totalCents, status: invoice.status, offeringId: invoice.lineItems[0]?.offeringId, offeringVariantId: invoice.lineItems[0]?.offeringVariantId, customerOfferingLinkId: invoice.lineItems[0]?.customerOfferingLinkId };
        contactId = invoice.contactId ?? undefined;
        organizationId = invoice.organizationId ?? undefined;
      }

      if (payload.sourceType === "CustomerOfferingLink") {
        const link = await prisma.customerOfferingLink.findFirstOrThrow({
          where: { tenantId: session.tenant.id, id: payload.sourceId },
          include: { offering: true },
        });
        metadata = {
          offeringId: link.offeringId,
          offeringVariantId: link.variantId,
          catalogId: link.catalogId,
          customerOfferingStatus: link.status,
          customerOfferingLinkId: link.id,
          offeringFamily: link.offering.family,
          offeringCategory: link.offering.category,
        };
        contactId = link.contactId ?? undefined;
        organizationId = link.organizationId ?? undefined;
      }

      const results = await runAutomationsForEvent(
        {
          tenantId: session.tenant.id,
          triggerType: payload.triggerType as AutomationTriggerType,
          sourceType: payload.sourceType as "Conversation" | "LifecycleItem" | "Booking" | "Quote" | "Invoice" | "CustomerOfferingLink",
          sourceId: payload.sourceId,
          contactId,
          organizationId,
          ownerUserId,
          metadata,
        },
        payload.mode,
      );

      return NextResponse.json({ ok: true, results });
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
