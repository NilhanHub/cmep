import { afterAll, describe, expect, it } from "vitest";

import {
  createCatalogAssignment,
  createOffering,
  createOfferingPrice,
  createOfferingVariant,
  getCatalogHomeData,
} from "@/modules/catalog/server/queries";
import { prisma } from "@/shared/server/prisma";

describe("offering spine", () => {
  it("creates an offering with a starter variant, price, and default catalog item", async () => {
    const offering = await createOffering({
      tenantId: "tenant_signal",
      type: "SERVICE",
      code: "SIG-QA-CATALOG",
      name: "QA Catalog Service",
      family: "QA Services",
      category: "Verification",
      summary: "Seeded from unit test.",
      description: "Used to prove offering creation invariants.",
      unitLabel: "session",
      variantCode: "CORE",
      variantName: "Core package",
      variantLabel: "Core package",
      priceName: "Core price",
      priceAmountCents: 125000,
      billingModel: "ONE_TIME",
    });

    const catalogItem = await prisma.catalogItem.findFirst({
      where: { tenantId: "tenant_signal", offeringId: offering.id },
      include: { catalog: true, price: true, variant: true },
    });

    expect(offering.variants).toHaveLength(1);
    expect(offering.prices).toHaveLength(1);
    expect(catalogItem?.catalog.isDefault).toBe(true);
    expect(catalogItem?.price?.amountCents).toBe(125000);
    expect(catalogItem?.variant?.displayLabel).toBe("Core package");
  });

  it("versions prices instead of overwriting historical financial truth", async () => {
    const variant = await createOfferingVariant({
      tenantId: "tenant_signal",
      offeringId: "off_signal_demo_call",
      code: "VIP60",
      name: "VIP session",
      displayLabel: "VIP 60 min",
      optionName: "duration",
      optionValue: "60",
      serviceDurationMinutes: 60,
    });

    const first = await createOfferingPrice({
      tenantId: "tenant_signal",
      offeringId: "off_signal_demo_call",
      variantId: variant.id,
      name: "VIP introductory",
      amountCents: 18900,
      billingModel: "ONE_TIME",
    });

    const second = await createOfferingPrice({
      tenantId: "tenant_signal",
      offeringId: "off_signal_demo_call",
      variantId: variant.id,
      name: "VIP current",
      amountCents: 20900,
      billingModel: "ONE_TIME",
    });

    const prices = await prisma.offeringPrice.findMany({
      where: {
        tenantId: "tenant_signal",
        offeringId: "off_signal_demo_call",
        variantId: variant.id,
      },
      orderBy: { version: "asc" },
    });
    const catalogItem = await prisma.catalogItem.findFirstOrThrow({
      where: {
        tenantId: "tenant_signal",
        offeringId: "off_signal_demo_call",
        variantId: variant.id,
      },
    });

    expect(prices).toHaveLength(2);
    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(prices[0]?.isDefault).toBe(false);
    expect(prices[1]?.isDefault).toBe(true);
    expect(prices[0]?.amountCents).toBe(18900);
    expect(prices[1]?.amountCents).toBe(20900);
    expect(catalogItem.priceId).toBe(second.id);
  });

  it("keeps catalog data tenant scoped and supports explicit assignments", async () => {
    const before = await prisma.catalogAssignment.count({
      where: { tenantId: "tenant_signal", catalogId: "catalog_signal_peakfit", contactId: "contact_priya" },
    });

    await createCatalogAssignment({
      tenantId: "tenant_signal",
      catalogId: "catalog_signal_peakfit",
      contactId: "contact_priya",
      portalVisible: true,
      segment: "Pilot upsell",
    });

    const signal = await getCatalogHomeData("tenant_signal");
    const northstar = await getCatalogHomeData("tenant_northstar");
    const after = await prisma.catalogAssignment.count({
      where: { tenantId: "tenant_signal", catalogId: "catalog_signal_peakfit", contactId: "contact_priya" },
    });

    expect(after).toBe(before + 1);
    expect(signal.catalogs.some((catalog) => catalog.id === "catalog_signal_peakfit")).toBe(true);
    expect(northstar.catalogs.some((catalog) => catalog.id === "catalog_signal_peakfit")).toBe(false);
    expect(signal.offerings.some((offering) => offering.id === "off_signal_trail_pack")).toBe(true);
    expect(northstar.offerings.some((offering) => offering.id === "off_signal_trail_pack")).toBe(false);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
