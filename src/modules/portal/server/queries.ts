import { portalCookieName } from "@/shared/domain/constants";
import { AccessDeniedError } from "@/shared/observability/errors";
import { prisma } from "@/shared/server/prisma";
import { cookies } from "next/headers";

function buildPortalScope(access: {
  tenantId: string;
  contactId?: string | null;
  organizationId?: string | null;
}) {
  if (!access.contactId && !access.organizationId) {
    throw new AccessDeniedError("Portal access is missing an entity scope.");
  }

  const scopeParts: Array<{ contactId: string } | { organizationId: string }> = [
    access.contactId ? { contactId: access.contactId } : null,
    access.organizationId ? { organizationId: access.organizationId } : null,
  ].filter((value): value is { contactId: string } | { organizationId: string } => Boolean(value));

  if (scopeParts.length === 1) {
    return {
      tenantId: access.tenantId,
      ...scopeParts[0],
    };
  }

  return {
    tenantId: access.tenantId,
    OR: scopeParts,
  };
}

export async function resolvePortalAccess(accessKey?: string | null) {
  let activeKey = accessKey ?? null;

  if (!activeKey) {
    const cookieStore = await cookies();
    activeKey = cookieStore.get(portalCookieName)?.value ?? null;
  }

  const accesses = await prisma.portalAccess.findMany({
    where: { active: true },
    include: { tenant: true, contact: true, organization: true },
    orderBy: { createdAt: "asc" },
  });

  const currentAccess = activeKey
    ? accesses.find((access) => access.accessKey === activeKey) ?? null
    : accesses[0] ?? null;

  return { accesses, currentAccess };
}

export async function getPortalWorkspace(accessKey?: string | null) {
  const { accesses, currentAccess } = await resolvePortalAccess(accessKey);

  if (!currentAccess) {
    return { accesses, currentAccess: null };
  }

  const scopedWhere = buildPortalScope(currentAccess);

  const [conversations, bookings, quotes, invoices, files, lifecycleItems, catalogAssignments, customerOfferingLinks] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        portalVisible: true,
        ...scopedWhere,
      },
      include: { messages: { orderBy: { sentAt: "asc" }, include: { attachments: { include: { fileAsset: true } } } } },
      orderBy: { lastMessageAt: "desc" },
    }),
    prisma.booking.findMany({
      where: scopedWhere,
      include: { bookingType: true, offering: true, offeringVariant: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.quote.findMany({
      where: {
        portalVisible: true,
        ...scopedWhere,
      },
      include: { lineItems: { include: { offering: true, offeringVariant: true, offeringPrice: true } } },
      orderBy: { issueDate: "desc" },
    }),
    prisma.invoice.findMany({
      where: {
        portalVisible: true,
        ...scopedWhere,
      },
      include: { lineItems: { include: { offering: true, offeringVariant: true, offeringPrice: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.fileAsset.findMany({
      where: scopedWhere,
      orderBy: { createdAt: "desc" },
    }),
    prisma.lifecycleItem.findMany({
      where: scopedWhere,
      include: { stage: true, template: true, offering: true, offeringVariant: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.catalogAssignment.findMany({
      where: {
        tenantId: currentAccess.tenantId,
        active: true,
        portalVisible: true,
        OR: [
          currentAccess.contactId ? { contactId: currentAccess.contactId } : undefined,
          currentAccess.organizationId ? { organizationId: currentAccess.organizationId } : undefined,
        ].filter(Boolean) as Array<{ contactId: string } | { organizationId: string }>,
      },
      include: {
        catalog: {
          include: {
            items: {
              where: { active: true, requestable: true },
              include: { offering: true, variant: true, price: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customerOfferingLink.findMany({
      where: scopedWhere,
      include: {
        offering: true,
        variant: true,
        price: true,
        catalog: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  return {
    accesses,
    currentAccess,
    conversations,
    bookings,
    quotes,
    invoices,
    files,
    lifecycleItems,
    catalogAssignments,
    customerOfferingLinks,
  };
}

export async function assertPortalConversationAccess(accessKey: string | null | undefined, conversationId: string) {
  const { currentAccess } = await resolvePortalAccess(accessKey);

  if (!currentAccess) {
    throw new AccessDeniedError("No active portal access is available.");
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      portalVisible: true,
      ...buildPortalScope(currentAccess),
    },
  });

  if (!conversation) {
    throw new AccessDeniedError("Conversation is outside the current portal scope.");
  }

  return { currentAccess, conversation };
}

export async function assertPortalQuoteAccess(accessKey: string | null | undefined, quoteId: string) {
  const { currentAccess } = await resolvePortalAccess(accessKey);

  if (!currentAccess) {
    throw new AccessDeniedError("No active portal access is available.");
  }

  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      portalVisible: true,
      ...buildPortalScope(currentAccess),
    },
  });

  if (!quote) {
    throw new AccessDeniedError("Quote is outside the current portal scope.");
  }

  return { currentAccess, quote };
}
