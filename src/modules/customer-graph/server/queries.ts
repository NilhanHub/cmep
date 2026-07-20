import { prisma } from "@/shared/server/prisma";
import { ResourceNotFoundError } from "@/shared/observability/errors";

export async function getCustomersPageData(tenantId: string, query?: string) {
  const whereSearch = query
    ? {
        OR: [
          { displayName: { contains: query } },
          { email: { contains: query } },
          { segment: { contains: query } },
        ],
      }
    : {};

  const [contacts, organizations] = await Promise.all([
    prisma.contact.findMany({
      where: {
        tenantId,
        archivedAt: null,
        ...whereSearch,
      },
      orderBy: { updatedAt: "desc" },
      include: { organization: true },
    }),
    prisma.organization.findMany({
      where: {
        tenantId,
        archivedAt: null,
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { industry: { contains: query } },
                { segment: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: { contacts: true },
    }),
  ]);

  return { contacts, organizations };
}

export async function getCustomerDetail(tenantId: string, id: string) {
  if (id.startsWith("contact_")) {
    const contact = await prisma.contact.findFirstOrThrow({
      where: { tenantId, id },
      include: {
        organization: true,
        conversations: { orderBy: { lastMessageAt: "desc" } },
        lifecycleItems: { include: { stage: true, template: true, offering: true, offeringVariant: true } },
        tasks: { orderBy: { dueDate: "asc" } },
        bookings: { include: { bookingType: true, offering: true, offeringVariant: true }, orderBy: { startsAt: "asc" } },
        quotes: { include: { lineItems: true }, orderBy: { issueDate: "desc" } },
        invoices: { include: { lineItems: true }, orderBy: { dueDate: "desc" } },
        files: { orderBy: { createdAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { occurredAt: "desc" } },
        portalAccesses: true,
        recurringAgreements: true,
        customerOfferingLinks: {
          include: {
            offering: true,
            variant: true,
            price: true,
            catalog: true,
          },
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        },
      },
    });

    return { kind: "contact" as const, entity: contact };
  }

  const organization = await prisma.organization.findFirstOrThrow({
    where: { tenantId, id },
    include: {
      contacts: true,
      conversations: { orderBy: { lastMessageAt: "desc" } },
      lifecycleItems: { include: { stage: true, template: true, offering: true, offeringVariant: true } },
      tasks: { orderBy: { dueDate: "asc" } },
      bookings: { include: { bookingType: true, offering: true, offeringVariant: true }, orderBy: { startsAt: "asc" } },
      quotes: { include: { lineItems: true }, orderBy: { issueDate: "desc" } },
      invoices: { include: { lineItems: true }, orderBy: { dueDate: "desc" } },
      files: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { occurredAt: "desc" } },
      portalAccesses: true,
      recurringAgreements: true,
      customerOfferingLinks: {
        include: {
          offering: true,
          variant: true,
          price: true,
          catalog: true,
        },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      },
    },
  });

  return { kind: "organization" as const, entity: organization };
}

export async function createCustomer(tenantId: string, ownerUserId: string, input: {
  kind: "contact" | "organization";
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  segment: string;
  status: "ACTIVE" | "PROSPECT" | "AT_RISK" | "ARCHIVED";
  notes: string;
}) {
  if (input.kind === "organization") {
    const organization = await prisma.organization.create({
      data: {
        id: `org_${crypto.randomUUID()}`,
        tenantId,
        name: input.name,
        industry: "General",
        status: input.status,
        segment: input.segment,
        lifecycleStage: "lead",
        ownerUserId,
        summary: input.notes,
        tags: [],
        customFields: {},
      },
    });

    return { id: organization.id };
  }

  const organization =
    input.company && input.company.trim()
      ? await prisma.organization.findFirst({
          where: { tenantId, name: input.company.trim() },
        })
      : null;

  const [firstName, ...rest] = input.name.trim().split(" ");

  const contact = await prisma.contact.create({
    data: {
      id: `contact_${crypto.randomUUID()}`,
      tenantId,
      organizationId: organization?.id,
      firstName,
      lastName: rest.join(" ") || "Customer",
      displayName: input.name.trim(),
      email: input.email || `contact-${crypto.randomUUID()}@local.test`,
      phone: input.phone || "",
      title: "New contact",
      city: "",
      status: input.status,
      segment: input.segment,
      lifecycleStage: "lead",
      ownerUserId,
      summary: input.notes,
      tags: [],
      customFields: {},
    },
  });

  return { id: contact.id };
}

export async function updateCustomer(tenantId: string, id: string, input: {
  name: string;
  segment: string;
  lifecycleStage: string;
  notes: string;
  tags?: string;
}) {
  const tags = input.tags
    ? input.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  if (id.startsWith("contact_")) {
    const [firstName, ...rest] = input.name.trim().split(" ");
    const result = await prisma.contact.updateMany({
      where: { tenantId, id },
      data: {
        firstName,
        lastName: rest.join(" ") || "Customer",
        displayName: input.name,
        segment: input.segment,
        lifecycleStage: input.lifecycleStage,
        summary: input.notes,
        tags,
      },
    });

    if (result.count === 0) {
      throw new ResourceNotFoundError("Customer was not found in the active tenant.");
    }
    return;
  }

  const result = await prisma.organization.updateMany({
    where: { tenantId, id },
    data: {
      name: input.name,
      segment: input.segment,
      lifecycleStage: input.lifecycleStage,
      summary: input.notes,
      tags,
    },
  });

  if (result.count === 0) {
    throw new ResourceNotFoundError("Organization was not found in the active tenant.");
  }
}
