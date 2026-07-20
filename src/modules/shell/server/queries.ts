import { prisma } from "@/shared/server/prisma";

export async function getMissionControlData(tenantId: string) {
  const [tasks, conversations, lifecycleItems, bookings, quotes, invoices, notifications, customerOfferingLinks] =
    await Promise.all([
      prisma.task.findMany({
        where: { tenantId, status: { not: "DONE" } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 6,
      }),
      prisma.conversation.findMany({
        where: { tenantId, status: { in: ["OPEN", "WAITING_ON_CLIENT"] } },
        include: { contact: true, organization: true },
        orderBy: [{ priority: "desc" }, { lastMessageAt: "desc" }],
        take: 6,
      }),
      prisma.lifecycleItem.findMany({
        where: { tenantId, riskFlag: true },
        include: { stage: true, contact: true, organization: true, offering: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.booking.findMany({
        where: { tenantId, status: { in: ["SCHEDULED", "RESCHEDULED"] } },
        include: { bookingType: true, contact: true, organization: true, offering: true },
        orderBy: { startsAt: "asc" },
        take: 6,
      }),
      prisma.quote.findMany({
        where: { tenantId, status: { in: ["SENT", "DRAFT"] } },
        include: { contact: true, organization: true, lineItems: { include: { offering: true } } },
        orderBy: { expiresAt: "asc" },
        take: 6,
      }),
      prisma.invoice.findMany({
        where: { tenantId, status: { in: ["SENT", "OVERDUE"] } },
        include: { contact: true, organization: true, lineItems: { include: { offering: true } } },
        orderBy: [{ status: "desc" }, { dueDate: "asc" }],
        take: 6,
      }),
      prisma.notification.findMany({
        where: { tenantId, readAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.customerOfferingLink.findMany({
        where: { tenantId, status: { in: ["PROPOSED", "QUOTED", "BOOKED", "ACTIVE", "SUBSCRIBED", "BLOCKED"] } },
        include: { offering: true, contact: true, organization: true },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);

  return { tasks, conversations, lifecycleItems, bookings, quotes, invoices, notifications, customerOfferingLinks };
}

export async function searchTenantEntities(tenantId: string, q: string) {
  const [contacts, organizations, conversations, lifecycleItems, offerings, catalogs] = await Promise.all([
    prisma.contact.findMany({
      where: {
        tenantId,
        OR: [{ displayName: { contains: q } }, { email: { contains: q } }],
      },
      take: 5,
    }),
    prisma.organization.findMany({
      where: {
        tenantId,
        OR: [{ name: { contains: q } }, { segment: { contains: q } }],
      },
      take: 5,
    }),
    prisma.conversation.findMany({
      where: {
        tenantId,
        OR: [{ subject: { contains: q } }, { summary: { contains: q } }],
      },
      take: 5,
    }),
    prisma.lifecycleItem.findMany({
      where: {
        tenantId,
        OR: [{ title: { contains: q } }, { description: { contains: q } }],
      },
      take: 5,
    }),
    prisma.offering.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q } },
          { code: { contains: q } },
          { family: { contains: q } },
          { category: { contains: q } },
        ],
      },
      take: 5,
    }),
    prisma.catalog.findMany({
      where: {
        tenantId,
        OR: [{ name: { contains: q } }, { code: { contains: q } }],
      },
      take: 5,
    }),
  ]);

  return {
    contacts,
    organizations,
    conversations,
    lifecycleItems,
    offerings,
    catalogs,
  };
}
