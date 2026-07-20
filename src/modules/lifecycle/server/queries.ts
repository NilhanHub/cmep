import { AutomationTriggerType, LifecycleItemStatus } from "@prisma/client";

import { runAutomationsForEvent } from "@/modules/automation/server/engine";
import { prisma } from "@/shared/server/prisma";

export async function getLifecycleData(tenantId: string) {
  const [templates, contacts, organizations, offerings] = await Promise.all([
    prisma.pipelineTemplate.findMany({
      where: { tenantId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: {
            items: {
              where: { tenantId },
              orderBy: { updatedAt: "desc" },
              include: {
                contact: true,
                organization: true,
                offering: true,
                offeringVariant: true,
              },
            },
          },
        },
      },
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
    prisma.offering.findMany({
      where: { tenantId, archivedAt: null, status: "ACTIVE" },
      include: {
        variants: {
          where: { active: true },
          orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
        },
      },
      orderBy: [{ family: "asc" }, { name: "asc" }],
    }),
  ]);

  return { templates, contacts, organizations, offerings };
}

export async function moveLifecycleItem(input: {
  tenantId: string;
  itemId: string;
  stageId: string;
}) {
  const item = await prisma.lifecycleItem.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.itemId },
    include: { stage: true, template: true, customerOfferingLink: true },
  });

  const nextStage = await prisma.pipelineStage.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.stageId },
  });

  const status =
    nextStage.kind === "WON"
      ? LifecycleItemStatus.WON
      : nextStage.kind === "LOST"
        ? LifecycleItemStatus.LOST
        : nextStage.kind === "RESOLVED"
          ? LifecycleItemStatus.RESOLVED
          : LifecycleItemStatus.ACTIVE;

  const relationshipStatus =
    nextStage.kind === "WON"
      ? "ACTIVE"
      : nextStage.kind === "LOST"
        ? "LAPSED"
        : nextStage.kind === "RESOLVED"
          ? "DELIVERED"
          : nextStage.name.toLowerCase().includes("booked")
            ? "BOOKED"
            : item.customerOfferingLink?.status === "AVAILABLE"
              ? "PROPOSED"
              : null;

  await prisma.lifecycleItem.update({
    where: { id: item.id },
    data: {
      stageId: nextStage.id,
      status,
      riskFlag: nextStage.name.toLowerCase().includes("waiting"),
    },
  });

  if (item.customerOfferingLinkId && relationshipStatus) {
    await prisma.customerOfferingLink.update({
      where: { id: item.customerOfferingLinkId },
      data: {
        status: relationshipStatus,
        lastActivityAt: new Date(),
      },
    });
  }

  await prisma.activity.create({
    data: {
      id: `activity_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      contactId: item.contactId ?? undefined,
      organizationId: item.organizationId ?? undefined,
      lifecycleItemId: item.id,
      kind: "STATUS",
      title: `${item.title} moved to ${nextStage.name}`,
      detail: `Lifecycle card moved from ${item.stage.name} to ${nextStage.name}.`,
      actorLabel: "System",
      metadata: { fromStageId: item.stageId, toStageId: nextStage.id, offeringId: item.offeringId },
    },
  });

  await runAutomationsForEvent(
    {
      tenantId: input.tenantId,
      triggerType: AutomationTriggerType.STAGE_CHANGED,
      sourceType: "LifecycleItem",
      sourceId: item.id,
      contactId: item.contactId,
      organizationId: item.organizationId,
      ownerUserId: item.ownerUserId,
      metadata: {
        templateId: item.templateId,
        fromStageId: item.stageId,
        toStageId: nextStage.id,
        tags: item.tags,
        offeringId: item.offeringId,
        offeringVariantId: item.offeringVariantId,
        customerOfferingStatus: relationshipStatus ?? item.customerOfferingLink?.status,
      },
    },
    "apply",
  );
}

export async function createLifecycleItem(input: {
  tenantId: string;
  templateId: string;
  title: string;
  contactId?: string;
  organizationId?: string;
  offeringId?: string;
  offeringVariantId?: string;
  ownerUserId: string;
}) {
  const template = await prisma.pipelineTemplate.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.templateId },
    include: { stages: { orderBy: { order: "asc" } } },
  });

  const firstStage = template.stages[0];

  const customerOfferingLink =
    input.offeringId && (input.contactId || input.organizationId)
      ? await prisma.customerOfferingLink.findFirst({
          where: {
            tenantId: input.tenantId,
            contactId: input.contactId,
            organizationId: input.organizationId,
            offeringId: input.offeringId,
            variantId: input.offeringVariantId ?? null,
          },
          orderBy: { updatedAt: "desc" },
        })
      : null;

  const item = await prisma.lifecycleItem.create({
    data: {
      id: `life_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      templateId: template.id,
      stageId: firstStage.id,
      contactId: input.contactId,
      organizationId: input.organizationId,
      customerOfferingLinkId: customerOfferingLink?.id,
      offeringId: input.offeringId,
      offeringVariantId: input.offeringVariantId,
      ownerUserId: input.ownerUserId,
      title: input.title,
      description: "New lifecycle item",
      dueDate: null,
      valueCents: 0,
      tags: [],
    },
  });

  if (!customerOfferingLink && input.offeringId && (input.contactId || input.organizationId)) {
    const createdLink = await prisma.customerOfferingLink.create({
      data: {
        id: `cust_offer_${crypto.randomUUID()}`,
        tenantId: input.tenantId,
        contactId: input.contactId,
        organizationId: input.organizationId,
        offeringId: input.offeringId,
        variantId: input.offeringVariantId,
        sourceType: "MANUAL",
        sourceId: item.id,
        status: "PROPOSED",
        lastActivityAt: new Date(),
      },
    });

    await prisma.lifecycleItem.update({
      where: { id: item.id },
      data: { customerOfferingLinkId: createdLink.id },
    });
  }

  return item;
}
