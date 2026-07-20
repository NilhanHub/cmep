import { prisma } from "@/shared/server/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getCatalogHomeData(tenantId: string) {
  const [offerings, catalogs, contacts, organizations] = await Promise.all([
    prisma.offering.findMany({
      where: { tenantId, archivedAt: null },
      include: {
        variants: {
          where: { active: true },
          orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
          include: {
            prices: {
              where: { active: true },
              orderBy: [{ isDefault: "desc" }, { version: "desc" }],
            },
          },
        },
        prices: {
          where: { active: true },
          orderBy: [{ isDefault: "desc" }, { version: "desc" }],
        },
        catalogItems: {
          include: { catalog: true },
        },
        customerLinks: true,
      },
      orderBy: [{ family: "asc" }, { category: "asc" }, { name: "asc" }],
    }),
    prisma.catalog.findMany({
      where: { tenantId, active: true },
      include: {
        items: true,
        assignments: {
          include: {
            contact: true,
            organization: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
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

  return { offerings, catalogs, contacts, organizations };
}

export async function getOfferingDetail(tenantId: string, id: string) {
  const offering = await prisma.offering.findFirstOrThrow({
    where: { tenantId, id },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      variants: {
        orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
        include: {
          prices: {
            orderBy: [{ active: "desc" }, { isDefault: "desc" }, { version: "desc" }],
          },
        },
      },
      prices: {
        orderBy: [{ active: "desc" }, { isDefault: "desc" }, { version: "desc" }],
      },
      bundleItems: {
        orderBy: { sortOrder: "asc" },
        include: {
          itemOffering: true,
          itemVariant: true,
          itemPrice: true,
        },
      },
      bundledInItems: {
        include: {
          bundleOffering: true,
        },
      },
      routeBindings: {
        include: {
          catalog: true,
          pipelineTemplate: true,
          bookingType: true,
          intakeForm: true,
          automationRule: true,
        },
      },
      customerLinks: {
        orderBy: [{ updatedAt: "desc" }],
        include: {
          contact: true,
          organization: true,
          catalog: true,
          price: true,
        },
      },
      catalogItems: {
        include: {
          catalog: true,
          price: true,
          variant: true,
        },
      },
    },
  });

  const [lifecycleItems, bookings, quotes, invoices, conversations] = await Promise.all([
    prisma.lifecycleItem.findMany({
      where: { tenantId, offeringId: id },
      include: { stage: true, contact: true, organization: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { tenantId, offeringId: id },
      include: { bookingType: true, contact: true, organization: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.quote.findMany({
      where: { tenantId, lineItems: { some: { offeringId: id } } },
      include: {
        contact: true,
        organization: true,
        lineItems: { where: { offeringId: id } },
      },
      orderBy: { issueDate: "desc" },
    }),
    prisma.invoice.findMany({
      where: { tenantId, lineItems: { some: { offeringId: id } } },
      include: {
        contact: true,
        organization: true,
        lineItems: { where: { offeringId: id } },
      },
      orderBy: { dueDate: "desc" },
    }),
    prisma.conversation.findMany({
      where: {
        tenantId,
        OR: [
          { contactId: { in: offering.customerLinks.map((link) => link.contactId).filter(Boolean) as string[] } },
          { organizationId: { in: offering.customerLinks.map((link) => link.organizationId).filter(Boolean) as string[] } },
        ],
      },
      include: { contact: true, organization: true },
      orderBy: { lastMessageAt: "desc" },
      take: 8,
    }),
  ]);

  return { offering, lifecycleItems, bookings, quotes, invoices, conversations };
}

export async function createOffering(input: {
  tenantId: string;
  type: "PRODUCT" | "SERVICE" | "BUNDLE";
  name: string;
  code: string;
  family: string;
  category: string;
  summary: string;
  description: string;
  unitLabel?: string;
  variantCode?: string;
  variantName?: string;
  variantLabel?: string;
  priceName?: string;
  priceAmountCents?: number;
  billingModel?: "ONE_TIME" | "RECURRING" | "TIERED_SIMPLE" | "NEGOTIATED_OVERRIDE_SUPPORT";
  interval?: "MONTHLY" | "QUARTERLY" | "ANNUAL";
}) {
  const offeringId = `off_${crypto.randomUUID()}`;
  const baseSlug = slugify(input.name);
  const existingSlugs = await prisma.offering.count({
    where: { tenantId: input.tenantId, slug: { startsWith: baseSlug } },
  });
  const slug = existingSlugs === 0 ? baseSlug : `${baseSlug}-${existingSlugs + 1}`;

  const defaultCatalog = await prisma.catalog.findFirst({
    where: { tenantId: input.tenantId, isDefault: true, active: true },
    orderBy: { createdAt: "asc" },
  });

  const variantId = input.variantName ? `var_${crypto.randomUUID()}` : undefined;
  const priceId = input.priceAmountCents !== undefined ? `price_${crypto.randomUUID()}` : undefined;
  await prisma.$transaction(async (tx) => {
    await tx.offering.create({
      data: {
        id: offeringId,
        tenantId: input.tenantId,
        type: input.type,
        code: input.code,
        slug,
        name: input.name,
        shortLabel: input.name,
        summary: input.summary,
        description: input.description,
        family: input.family,
        category: input.category,
        tags: [],
        status: "ACTIVE",
        unitLabel: input.unitLabel,
        isPhysical: input.type === "PRODUCT" || input.type === "BUNDLE",
        isDigital: false,
        isService: input.type !== "PRODUCT",
      },
    });

    if (variantId) {
      await tx.offeringVariant.create({
        data: {
          id: variantId,
          tenantId: input.tenantId,
          offeringId,
          code: input.variantCode ?? "DEFAULT",
          name: input.variantName ?? input.name,
          displayLabel: input.variantLabel ?? input.variantName ?? input.name,
          optionValues: {},
          isDefault: true,
          active: true,
        },
      });
    }

    if (priceId) {
      await tx.offeringPrice.create({
        data: {
          id: priceId,
          tenantId: input.tenantId,
          offeringId,
          variantId,
          name: input.priceName ?? "Default price",
          currency: "USD",
          amountCents: input.priceAmountCents ?? 0,
          billingModel: input.billingModel ?? "ONE_TIME",
          interval: input.interval,
          intervalCount: input.interval ? 1 : null,
          isDefault: true,
          active: true,
          version: 1,
        },
      });
    }

    if (defaultCatalog && priceId) {
      await tx.catalogItem.create({
        data: {
          id: `catalog_item_${crypto.randomUUID()}`,
          tenantId: input.tenantId,
          catalogId: defaultCatalog.id,
          offeringId,
          variantId,
          priceId,
          featured: true,
          requestable: true,
          active: true,
        },
      });
    }
  });

  return prisma.offering.findUniqueOrThrow({
    where: { id: offeringId },
    include: {
      variants: true,
      prices: true,
    },
  });
}

export async function createOfferingVariant(input: {
  tenantId: string;
  offeringId: string;
  code: string;
  name: string;
  displayLabel: string;
  optionName?: string;
  optionValue?: string;
  serviceDurationMinutes?: number;
}) {
  await prisma.offering.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.offeringId },
    select: { id: true },
  });

  return prisma.offeringVariant.create({
    data: {
      id: `var_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      offeringId: input.offeringId,
      code: input.code,
      name: input.name,
      displayLabel: input.displayLabel,
      optionValues:
        input.optionName && input.optionValue ? { [input.optionName]: input.optionValue } : {},
      serviceDurationMinutes: input.serviceDurationMinutes,
      active: true,
    },
  });
}

export async function createOfferingPrice(input: {
  tenantId: string;
  offeringId: string;
  variantId?: string;
  name: string;
  amountCents: number;
  billingModel: "ONE_TIME" | "RECURRING" | "TIERED_SIMPLE" | "NEGOTIATED_OVERRIDE_SUPPORT";
  interval?: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  intervalCount?: number;
}) {
  await prisma.offering.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.offeringId },
    select: { id: true },
  });

  const latest = await prisma.offeringPrice.findFirst({
    where: {
      tenantId: input.tenantId,
      offeringId: input.offeringId,
      variantId: input.variantId ?? null,
    },
    orderBy: { version: "desc" },
  });

  const defaultCatalog = await prisma.catalog.findFirst({
    where: { tenantId: input.tenantId, isDefault: true, active: true },
    orderBy: { createdAt: "asc" },
  });
  const priceId = `price_${crypto.randomUUID()}`;

  await prisma.$transaction(async (tx) => {
    if (latest) {
      await tx.offeringPrice.updateMany({
        where: {
          tenantId: input.tenantId,
          offeringId: input.offeringId,
          variantId: input.variantId ?? null,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    await tx.offeringPrice.create({
      data: {
        id: priceId,
        tenantId: input.tenantId,
        offeringId: input.offeringId,
        variantId: input.variantId,
        name: input.name,
        currency: "USD",
        amountCents: input.amountCents,
        billingModel: input.billingModel,
        interval: input.interval,
        intervalCount: input.interval ? input.intervalCount ?? 1 : null,
        isDefault: true,
        active: true,
        version: (latest?.version ?? 0) + 1,
      },
    });

    if (defaultCatalog) {
      const existingCatalogItem = await tx.catalogItem.findFirst({
        where: {
          tenantId: input.tenantId,
          catalogId: defaultCatalog.id,
          offeringId: input.offeringId,
          variantId: input.variantId ?? null,
        },
      });

      if (existingCatalogItem) {
        await tx.catalogItem.update({
          where: { id: existingCatalogItem.id },
          data: { priceId, active: true },
        });
      } else {
        await tx.catalogItem.create({
          data: {
            id: `catalog_item_${crypto.randomUUID()}`,
            tenantId: input.tenantId,
            catalogId: defaultCatalog.id,
            offeringId: input.offeringId,
            variantId: input.variantId,
            priceId,
            active: true,
            requestable: true,
          },
        });
      }
    }
  });

  return prisma.offeringPrice.findUniqueOrThrow({
    where: { id: priceId },
  });
}

export async function createCatalogAssignment(input: {
  tenantId: string;
  catalogId: string;
  contactId?: string;
  organizationId?: string;
  segment?: string;
  portalVisible: boolean;
}) {
  await prisma.catalog.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.catalogId },
    select: { id: true },
  });

  return prisma.catalogAssignment.create({
    data: {
      id: `catalog_assignment_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      catalogId: input.catalogId,
      contactId: input.contactId,
      organizationId: input.organizationId,
      segment: input.segment,
      portalVisible: input.portalVisible,
      active: true,
    },
  });
}
