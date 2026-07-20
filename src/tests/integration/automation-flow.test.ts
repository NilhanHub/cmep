import { afterAll, describe, expect, it } from "vitest";

import { runAutomationsForEvent } from "@/modules/automation/server/engine";
import { createBooking } from "@/modules/scheduling/server/queries";
import { prisma } from "@/shared/server/prisma";

describe("automation engine", () => {
  it("records an offering-aware simulation run without mutating the lifecycle item", async () => {
    const before = await prisma.automationRun.count({
      where: { tenantId: "tenant_signal", triggerType: "QUOTE_APPROVED_FOR_OFFERING" },
    });

    const result = await runAutomationsForEvent(
      {
        tenantId: "tenant_signal",
        triggerType: "QUOTE_APPROVED_FOR_OFFERING",
        sourceType: "Quote",
        sourceId: "quote_signal_01",
        contactId: "contact_zoe",
        organizationId: "org_peakfit",
        metadata: {
          reference: "SG-2026-101",
          offeringId: "off_signal_wholesale_rollout",
          catalogId: "catalog_signal_peakfit",
        },
      },
      "simulate",
    );

    const after = await prisma.automationRun.count({
      where: { tenantId: "tenant_signal", triggerType: "QUOTE_APPROVED_FOR_OFFERING" },
    });
    const latest = await prisma.automationRun.findFirst({
      where: { tenantId: "tenant_signal", triggerType: "QUOTE_APPROVED_FOR_OFFERING" },
      orderBy: { createdAt: "desc" },
    });

    expect(result.evaluatedRuleCount).toBeGreaterThan(0);
    expect(after).toBe(before + 1);
    expect(latest?.status).toBe("SIMULATED");
    expect(latest?.summary).toMatch(/Would apply/);
  });

  it("creates follow-up work when a demo booking is created", async () => {
    const beforeTasks = await prisma.task.count({ where: { tenantId: "tenant_signal" } });

    await createBooking({
      tenantId: "tenant_signal",
      bookingTypeId: "booking_signal_demo",
      startsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "Integration test booking",
      contactId: "contact_zoe",
    });

    const afterTasks = await prisma.task.count({ where: { tenantId: "tenant_signal" } });
    expect(afterTasks).toBeGreaterThan(beforeTasks);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
