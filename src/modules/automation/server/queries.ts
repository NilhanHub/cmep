import { prisma } from "@/shared/server/prisma";

export async function getAutomationStudioData(tenantId: string) {
  const [rules, runs, lifecycleItems, conversations, bookings, quotes, invoices, customerOfferingLinks] = await Promise.all([
    prisma.automationRule.findMany({
      where: { tenantId },
      orderBy: [{ enabled: "desc" }, { name: "asc" }],
    }),
    prisma.automationRun.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 16,
    }),
    prisma.lifecycleItem.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { lastMessageAt: "desc" },
      take: 6,
    }),
    prisma.booking.findMany({
      where: { tenantId },
      include: { offering: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.quote.findMany({
      where: { tenantId },
      include: { lineItems: { include: { offering: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.invoice.findMany({
      where: { tenantId },
      include: { lineItems: { include: { offering: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.customerOfferingLink.findMany({
      where: { tenantId },
      include: { offering: true, contact: true, organization: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  return {
    rules,
    runs,
    sources: {
      lifecycleItems,
      conversations,
      bookings,
      quotes,
      invoices,
      customerOfferingLinks,
    },
  };
}
