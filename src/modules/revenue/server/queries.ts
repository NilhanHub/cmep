import { AutomationTriggerType, InvoiceStatus, QuoteStatus } from "@prisma/client";

import { runAutomationsForEvent } from "@/modules/automation/server/engine";
import { prisma } from "@/shared/server/prisma";

export async function getRevenueData(tenantId: string) {
  const [quotes, invoices, recurring, offeringPrices, contacts, organizations] = await Promise.all([
    prisma.quote.findMany({
      where: { tenantId },
      include: {
        contact: true,
        organization: true,
        lineItems: { include: { offering: true, offeringVariant: true, offeringPrice: true } },
      },
      orderBy: { issueDate: "desc" },
    }),
    prisma.invoice.findMany({
      where: { tenantId },
      include: {
        contact: true,
        organization: true,
        lineItems: { include: { offering: true, offeringVariant: true, offeringPrice: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.recurringAgreement.findMany({
      where: { tenantId },
      include: { contact: true, organization: true, offering: true, offeringVariant: true, offeringPrice: true },
      orderBy: { nextBillingDate: "asc" },
    }),
    prisma.offeringPrice.findMany({
      where: { tenantId, active: true },
      include: { offering: true, variant: true },
      orderBy: [{ offering: { family: "asc" } }, { offering: { name: "asc" } }, { isDefault: "desc" }, { version: "desc" }],
    }),
    prisma.contact.findMany({
      where: { tenantId, archivedAt: null },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.organization.findMany({
      where: { tenantId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { quotes, invoices, recurring, offeringPrices, contacts, organizations };
}

export async function getQuoteDetail(tenantId: string, id: string) {
  return prisma.quote.findFirstOrThrow({
    where: { tenantId, id },
    include: {
      contact: true,
      organization: true,
      lineItems: { include: { offering: true, offeringVariant: true, offeringPrice: true } },
    },
  });
}

export async function getInvoiceDetail(tenantId: string, id: string) {
  return prisma.invoice.findFirstOrThrow({
    where: { tenantId, id },
    include: {
      contact: true,
      organization: true,
      lineItems: { include: { offering: true, offeringVariant: true, offeringPrice: true } },
    },
  });
}

async function ensureRevenueCustomerLink(input: {
  tenantId: string;
  contactId?: string;
  organizationId?: string;
  offeringId?: string;
  variantId?: string | null;
  priceId?: string;
  status: "QUOTED" | "PURCHASED";
  sourceType: "QUOTE" | "INVOICE";
  sourceId: string;
}) {
  if (!input.offeringId || (!input.contactId && !input.organizationId)) {
    return null;
  }

  const existing = await prisma.customerOfferingLink.findFirst({
    where: {
      tenantId: input.tenantId,
      contactId: input.contactId,
      organizationId: input.organizationId,
      offeringId: input.offeringId,
      variantId: input.variantId ?? null,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return prisma.customerOfferingLink.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        priceId: input.priceId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        lastActivityAt: new Date(),
        activatedAt: input.status === "PURCHASED" ? existing.activatedAt ?? new Date() : existing.activatedAt,
      },
    });
  }

  return prisma.customerOfferingLink.create({
    data: {
      id: `cust_offer_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      contactId: input.contactId,
      organizationId: input.organizationId,
      offeringId: input.offeringId,
      variantId: input.variantId ?? undefined,
      priceId: input.priceId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      status: input.status,
      activatedAt: input.status === "PURCHASED" ? new Date() : null,
      lastActivityAt: new Date(),
    },
  });
}

export async function createQuote(input: {
  tenantId: string;
  reference: string;
  notes: string;
  contactId?: string;
  organizationId?: string;
  offeringPriceId?: string;
  quantity?: number;
  isAdHoc?: boolean;
  adHocDescription?: string;
  adHocUnitPriceCents?: number;
}) {
  const price = input.offeringPriceId
    ? await prisma.offeringPrice.findFirstOrThrow({
        where: { tenantId: input.tenantId, id: input.offeringPriceId, active: true },
        include: { offering: true, variant: true },
      })
    : null;
  const quantity = Math.max(1, input.quantity ?? 1);
  const lineUnitPrice = price?.amountCents ?? input.adHocUnitPriceCents ?? 0;
  const subtotalCents = lineUnitPrice * quantity;
  const taxCents = Math.round(subtotalCents * 0.08);
  const quoteId = `quote_${crypto.randomUUID()}`;
  const customerOfferingLink = await ensureRevenueCustomerLink({
    tenantId: input.tenantId,
    contactId: input.contactId,
    organizationId: input.organizationId,
    offeringId: price?.offeringId,
    variantId: price?.variantId,
    priceId: price?.id,
    status: "QUOTED",
    sourceType: "QUOTE",
    sourceId: quoteId,
  });

  const quote = await prisma.quote.create({
    data: {
      id: quoteId,
      tenantId: input.tenantId,
      contactId: input.contactId,
      organizationId: input.organizationId,
      reference: input.reference,
      status: QuoteStatus.DRAFT,
      issueDate: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subtotalCents,
      taxCents,
      discountCents: 0,
      totalCents: subtotalCents + taxCents,
      notes: input.notes,
      lineItems: {
        create: [
          {
            id: `quote_line_${crypto.randomUUID()}`,
            offeringId: price?.offeringId,
            offeringVariantId: price?.variantId,
            offeringPriceId: price?.id,
            customerOfferingLinkId: customerOfferingLink?.id,
            description: price?.offering.name ?? input.adHocDescription ?? "Custom line item",
            quantity,
            unitPriceCents: lineUnitPrice,
            isAdHoc: input.isAdHoc ?? !price,
            adHocReason: input.isAdHoc ? "Manual off-catalog line item" : null,
            sortOrder: 0,
          },
        ],
      },
    },
    include: { lineItems: true },
  });

  return quote;
}

export async function decideQuote(input: {
  tenantId: string;
  quoteId: string;
  decision: "APPROVED" | "REJECTED";
}) {
  const quote = await prisma.quote.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.quoteId },
    include: { lineItems: true },
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: input.decision },
  });

  await prisma.customerOfferingLink.updateMany({
    where: { tenantId: input.tenantId, sourceId: quote.id, sourceType: "QUOTE" },
    data: {
      status: input.decision === "APPROVED" ? "ACTIVE" : "BLOCKED",
      lastActivityAt: new Date(),
    },
  });

  if (input.decision === "APPROVED") {
    const hasOfferingLines = quote.lineItems.some((item) => Boolean(item.offeringPriceId));
    await runAutomationsForEvent(
      {
        tenantId: input.tenantId,
        triggerType: hasOfferingLines ? AutomationTriggerType.QUOTE_APPROVED_FOR_OFFERING : AutomationTriggerType.QUOTE_APPROVED,
        sourceType: "Quote",
        sourceId: quote.id,
        contactId: quote.contactId,
        organizationId: quote.organizationId,
        metadata: {
          reference: quote.reference,
          offeringPriceIds: quote.lineItems.map((item) => item.offeringPriceId).filter(Boolean),
        },
      },
      "apply",
    );
  }
}

export async function markInvoicePaid(input: { tenantId: string; invoiceId: string }) {
  const invoice = await prisma.invoice.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.invoiceId },
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: InvoiceStatus.PAID,
      balanceCents: 0,
    },
  });

  await prisma.customerOfferingLink.updateMany({
    where: { tenantId: input.tenantId, sourceId: invoice.id, sourceType: "INVOICE" },
    data: {
      status: "ACTIVE",
      lastActivityAt: new Date(),
      activatedAt: new Date(),
    },
  });

  await prisma.activity.create({
    data: {
      id: `activity_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      contactId: invoice.contactId ?? undefined,
      organizationId: invoice.organizationId ?? undefined,
      invoiceId: invoice.id,
      kind: "INVOICE",
      title: `${invoice.reference} marked paid`,
      detail: "Manual payment recorded locally.",
      actorLabel: "System",
      metadata: { reference: invoice.reference },
    },
  });
}

export async function createInvoice(input: {
  tenantId: string;
  reference: string;
  notes: string;
  contactId?: string;
  organizationId?: string;
  offeringPriceId?: string;
  quantity?: number;
  isAdHoc?: boolean;
  adHocDescription?: string;
  adHocUnitPriceCents?: number;
}) {
  const price = input.offeringPriceId
    ? await prisma.offeringPrice.findFirstOrThrow({
        where: { tenantId: input.tenantId, id: input.offeringPriceId, active: true },
        include: { offering: true, variant: true },
      })
    : null;
  const quantity = Math.max(1, input.quantity ?? 1);
  const lineUnitPrice = price?.amountCents ?? input.adHocUnitPriceCents ?? 0;
  const subtotalCents = lineUnitPrice * quantity;
  const taxCents = Math.round(subtotalCents * 0.08);
  const invoiceId = `invoice_${crypto.randomUUID()}`;
  const customerOfferingLink = await ensureRevenueCustomerLink({
    tenantId: input.tenantId,
    contactId: input.contactId,
    organizationId: input.organizationId,
    offeringId: price?.offeringId,
    variantId: price?.variantId,
    priceId: price?.id,
    status: "PURCHASED",
    sourceType: "INVOICE",
    sourceId: invoiceId,
  });

  return prisma.invoice.create({
    data: {
      id: invoiceId,
      tenantId: input.tenantId,
      contactId: input.contactId,
      organizationId: input.organizationId,
      reference: input.reference,
      status: InvoiceStatus.SENT,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      subtotalCents,
      taxCents,
      discountCents: 0,
      totalCents: subtotalCents + taxCents,
      balanceCents: subtotalCents + taxCents,
      notes: input.notes,
      lineItems: {
        create: [
          {
            id: `invoice_line_${crypto.randomUUID()}`,
            offeringId: price?.offeringId,
            offeringVariantId: price?.variantId,
            offeringPriceId: price?.id,
            customerOfferingLinkId: customerOfferingLink?.id,
            description: price?.offering.name ?? input.adHocDescription ?? "Custom invoice line",
            quantity,
            unitPriceCents: lineUnitPrice,
            isAdHoc: input.isAdHoc ?? !price,
            adHocReason: input.isAdHoc ? "Manual off-catalog invoice item" : null,
            sortOrder: 0,
          },
        ],
      },
    },
    include: { lineItems: true },
  });
}
