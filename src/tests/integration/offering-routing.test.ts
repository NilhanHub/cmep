import { afterAll, describe, expect, it } from "vitest";

import { createLifecycleItem } from "@/modules/lifecycle/server/queries";
import { getPortalWorkspace } from "@/modules/portal/server/queries";
import { createQuote, createInvoice } from "@/modules/revenue/server/queries";
import { createBooking } from "@/modules/scheduling/server/queries";
import { prisma } from "@/shared/server/prisma";

describe("offering-routed workflows", () => {
  it("creates quotes from offering prices and links them to customer offering state", async () => {
    const quote = await createQuote({
      tenantId: "tenant_signal",
      reference: "SIG-QA-QUOTE",
      notes: "Catalog-backed quote from integration test.",
      contactId: "contact_zoe",
      organizationId: "org_peakfit",
      offeringPriceId: "price_signal_wholesale_rollout",
      quantity: 2,
    });

    const line = await prisma.quoteLineItem.findFirstOrThrow({
      where: { quoteId: quote.id },
      include: { offering: true, offeringPrice: true },
    });
    const link = await prisma.customerOfferingLink.findFirstOrThrow({
      where: { tenantId: "tenant_signal", sourceType: "QUOTE", sourceId: quote.id },
    });

    expect(line.offering?.id).toBe("off_signal_wholesale_rollout");
    expect(line.offeringPrice?.id).toBe("price_signal_wholesale_rollout");
    expect(line.isAdHoc).toBe(false);
    expect(link.status).toBe("QUOTED");
  });

  it("creates service bookings from offering-backed booking types and updates the relationship link", async () => {
    const booking = await createBooking({
      tenantId: "tenant_signal",
      bookingTypeId: "booking_signal_demo",
      offeringId: "off_signal_demo_call",
      offeringVariantId: "var_signal_demo_call_remote",
      startsAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "Integration booking through offering spine.",
      contactId: "contact_zoe",
      organizationId: "org_peakfit",
    });

    const stored = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: { customerOfferingLink: true },
    });

    expect(stored.offeringId).toBe("off_signal_demo_call");
    expect(stored.offeringVariantId).toBe("var_signal_demo_call_remote");
    expect(stored.customerOfferingLink?.status).toBe("BOOKED");
  });

  it("creates lifecycle work from an offering and records a customer offering link", async () => {
    const item = await createLifecycleItem({
      tenantId: "tenant_signal",
      templateId: "template_signal_sales",
      title: "QA offering-linked lifecycle item",
      contactId: "contact_zoe",
      organizationId: "org_peakfit",
      offeringId: "off_signal_floor_set_bundle",
      offeringVariantId: "var_signal_floor_set_peakfit",
      ownerUserId: "user_harper",
    });

    const stored = await prisma.lifecycleItem.findUniqueOrThrow({
      where: { id: item.id },
      include: { customerOfferingLink: true },
    });

    expect(stored.offeringId).toBe("off_signal_floor_set_bundle");
    expect(stored.customerOfferingLink?.status).toBe("PROPOSED");
  });

  it("scopes portal catalog visibility to the assigned client catalog", async () => {
    const workspace = await getPortalWorkspace("signal-zoe");
    const catalogNames = workspace.catalogAssignments?.map((assignment) => assignment.catalog.name) ?? [];
    const visibleOfferingNames = workspace.catalogAssignments?.flatMap((assignment) =>
      assignment.catalog.items.map((item) => item.offering.name),
    ) ?? [];

    expect(catalogNames).toContain("Peakfit Expansion Catalog");
    expect(visibleOfferingNames).toContain("Spring Floor Set Bundle");
    expect(visibleOfferingNames).not.toContain("Retreat Launch Package");
  });

  it("flags ad hoc invoice items as explicit exceptions", async () => {
    const invoice = await createInvoice({
      tenantId: "tenant_signal",
      reference: "SIG-QA-ADHOC",
      notes: "Manual exception invoice.",
      contactId: "contact_noah",
      organizationId: "org_horizon",
      isAdHoc: true,
      adHocDescription: "Manual field repair surcharge",
      adHocUnitPriceCents: 9500,
      quantity: 1,
    });

    const line = await prisma.invoiceLineItem.findFirstOrThrow({
      where: { invoiceId: invoice.id },
    });

    expect(line.isAdHoc).toBe(true);
    expect(line.offeringPriceId).toBeNull();
    expect(line.adHocReason).toContain("Manual off-catalog");
  });

  it("keeps the seed backfill linked to offering, variant, and price records", async () => {
    const quoteLine = await prisma.quoteLineItem.findUniqueOrThrow({
      where: { id: "quote_line_sg_1" },
    });
    const invoiceLine = await prisma.invoiceLineItem.findUniqueOrThrow({
      where: { id: "invoice_line_sg_1" },
    });
    const recurring = await prisma.recurringAgreement.findUniqueOrThrow({
      where: { id: "recurring_signal" },
    });

    expect(quoteLine.offeringId).toBe("off_signal_wholesale_rollout");
    expect(quoteLine.offeringPriceId).toBe("price_signal_wholesale_rollout");
    expect(invoiceLine.offeringId).toBe("off_signal_expedited_replacements");
    expect(invoiceLine.offeringPriceId).toBe("price_signal_expedited_replacements");
    expect(recurring.offeringId).toBe("off_signal_field_merch_support");
    expect(recurring.offeringPriceId).toBe("price_signal_field_support_qtr");
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
