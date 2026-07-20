import { PrismaClient } from "@prisma/client";

import { sanitizeIdentifier, sanitizePortalAccess, stableHash } from "@/shared/observability/sanitize";

const prisma = new PrismaClient();

type TenantStateSummary = {
  tenantId: string;
  tenantKey: string | null;
  tenantName: string;
  counts: Record<string, number>;
  latestRecords: Record<string, Array<{ id: string | null; updatedAt: string }>>;
  memberships: Array<{ user: string | null; role: string }>;
  portalAccesses: Array<{ access: string | null; label: string }>;
};

function stripVolatileLatestRecords(latest: TenantStateSummary["latestRecords"]) {
  return Object.fromEntries(
    Object.entries(latest).map(([entity, rows]) => [
      entity,
      rows.map((row) => ({
        id: row.id,
      })),
    ]),
  );
}

async function countTables(tenantId: string) {
  const [
    contacts,
    organizations,
    conversations,
    messages,
    offerings,
    offeringVariants,
    offeringPrices,
    catalogs,
    catalogItems,
    catalogAssignments,
    routeBindings,
    customerOfferingLinks,
    lifecycleItems,
    tasks,
    bookings,
    quotes,
    invoices,
    recurringAgreements,
    automationRules,
    automationRuns,
    notifications,
    files,
  ] = await Promise.all([
    prisma.contact.count({ where: { tenantId } }),
    prisma.organization.count({ where: { tenantId } }),
    prisma.conversation.count({ where: { tenantId } }),
    prisma.message.count({ where: { tenantId } }),
    prisma.offering.count({ where: { tenantId } }),
    prisma.offeringVariant.count({ where: { tenantId } }),
    prisma.offeringPrice.count({ where: { tenantId } }),
    prisma.catalog.count({ where: { tenantId } }),
    prisma.catalogItem.count({ where: { tenantId } }),
    prisma.catalogAssignment.count({ where: { tenantId } }),
    prisma.offeringRouteBinding.count({ where: { tenantId } }),
    prisma.customerOfferingLink.count({ where: { tenantId } }),
    prisma.lifecycleItem.count({ where: { tenantId } }),
    prisma.task.count({ where: { tenantId } }),
    prisma.booking.count({ where: { tenantId } }),
    prisma.quote.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.recurringAgreement.count({ where: { tenantId } }),
    prisma.automationRule.count({ where: { tenantId } }),
    prisma.automationRun.count({ where: { tenantId } }),
    prisma.notification.count({ where: { tenantId } }),
    prisma.fileAsset.count({ where: { tenantId } }),
  ]);

  return {
    contacts,
    organizations,
    conversations,
    messages,
    offerings,
    offeringVariants,
    offeringPrices,
    catalogs,
    catalogItems,
    catalogAssignments,
    routeBindings,
    customerOfferingLinks,
    lifecycleItems,
    tasks,
    bookings,
    quotes,
    invoices,
    recurringAgreements,
    automationRules,
    automationRuns,
    notifications,
    files,
  };
}

async function latestRecords(tenantId: string) {
  const [contacts, offerings, catalogs, customerOfferingLinks, conversations, lifecycleItems, bookings, quotes, invoices] =
    await Promise.all([
    prisma.contact.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, updatedAt: true } }),
    prisma.offering.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, updatedAt: true } }),
    prisma.catalog.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, updatedAt: true } }),
    prisma.customerOfferingLink.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, updatedAt: true },
    }),
    prisma.conversation.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, updatedAt: true } }),
    prisma.lifecycleItem.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, updatedAt: true } }),
    prisma.booking.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, updatedAt: true } }),
    prisma.quote.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, updatedAt: true } }),
    prisma.invoice.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, updatedAt: true } }),
  ]);

  const mapRows = (rows: Array<{ id: string; updatedAt: Date }>) =>
    rows.map((row) => ({
      id: sanitizeIdentifier(row.id, "record"),
      updatedAt: row.updatedAt.toISOString(),
    }));

  return {
    contacts: mapRows(contacts),
    offerings: mapRows(offerings),
    catalogs: mapRows(catalogs),
    customerOfferingLinks: mapRows(customerOfferingLinks),
    conversations: mapRows(conversations),
    lifecycleItems: mapRows(lifecycleItems),
    bookings: mapRows(bookings),
    quotes: mapRows(quotes),
    invoices: mapRows(invoices),
  };
}

export async function collectStateSummary(label: string) {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      memberships: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
      portalAccesses: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const tenantSummaries: TenantStateSummary[] = [];

  for (const tenant of tenants) {
    tenantSummaries.push({
      tenantId: tenant.id,
      tenantKey: sanitizeIdentifier(tenant.id, "tenant"),
      tenantName: tenant.name,
      counts: await countTables(tenant.id),
      latestRecords: await latestRecords(tenant.id),
      memberships: tenant.memberships.map((membership) => ({
        user: sanitizeIdentifier(membership.userId, "user"),
        role: membership.role,
      })),
      portalAccesses: tenant.portalAccesses.map((access) => ({
        access: sanitizePortalAccess(access.accessKey),
        label: access.label,
      })),
    });
  }

  const seedIdentifiers = tenantSummaries.map((tenant) => ({
    tenant: tenant.tenantKey,
    memberships: tenant.memberships,
    portalAccesses: tenant.portalAccesses,
  }));

  const canonical = {
    tenants: tenantSummaries.map((tenant) => ({
      tenantId: tenant.tenantId,
      tenantKey: tenant.tenantKey,
      tenantName: tenant.tenantName,
      counts: tenant.counts,
      latestRecords: stripVolatileLatestRecords(tenant.latestRecords),
      memberships: tenant.memberships,
      portalAccesses: tenant.portalAccesses,
    })),
    seedIdentifiers,
  };

  const normalized = {
    label,
    generatedAt: new Date().toISOString(),
    tenants: tenantSummaries,
    seedIdentifiers,
  };

  return {
    ...normalized,
    fingerprint: stableHash(JSON.stringify(canonical)),
  };
}

export async function disconnectStateClient() {
  await prisma.$disconnect();
}
