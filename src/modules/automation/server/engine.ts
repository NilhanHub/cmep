import {
  AutomationRunStatus,
  type AutomationRule,
  type AutomationTriggerType,
  type Prisma,
} from "@prisma/client";
import { addDays } from "date-fns";

import { appendJsonLine } from "@/shared/observability/writer";
import { incrementMetricCounter, observeServerFlow } from "@/shared/observability/server";
import { prisma } from "@/shared/server/prisma";

type AutomationEvent = {
  tenantId: string;
  triggerType: AutomationTriggerType;
  sourceType: "Conversation" | "LifecycleItem" | "Booking" | "Quote" | "Invoice" | "CustomerOfferingLink";
  sourceId: string;
  contactId?: string | null;
  organizationId?: string | null;
  ownerUserId?: string | null;
  metadata?: Record<string, unknown>;
};

type AutomationMode = "simulate" | "apply";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asActions(value: Prisma.JsonValue): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.map((item) => asRecord(item)) : [];
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function asTags(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function matchesRule(rule: AutomationRule, event: AutomationEvent) {
  const conditions = asRecord(rule.conditions);
  const metadata = event.metadata ?? {};

  if (conditions.tenantId && conditions.tenantId !== event.tenantId) return false;
  if (conditions.templateId && conditions.templateId !== metadata.templateId) return false;
  if (conditions.toStageId && conditions.toStageId !== metadata.toStageId) return false;
  if (conditions.bookingTypeId && conditions.bookingTypeId !== metadata.bookingTypeId) return false;
  if (conditions.status && conditions.status !== metadata.status) return false;
  if (conditions.ownerUserId && conditions.ownerUserId !== event.ownerUserId) return false;
  if (conditions.offeringId && conditions.offeringId !== metadata.offeringId) return false;
  if (conditions.variantId && conditions.variantId !== metadata.offeringVariantId) return false;
  if (conditions.catalogId && conditions.catalogId !== metadata.catalogId) return false;
  if (conditions.customerOfferingStatus && conditions.customerOfferingStatus !== metadata.customerOfferingStatus) return false;
  if (conditions.offeringFamily && conditions.offeringFamily !== metadata.offeringFamily) return false;
  if (conditions.offeringCategory && conditions.offeringCategory !== metadata.offeringCategory) return false;

  if (typeof conditions.minAmountCents === "number") {
    const amount = Number(metadata.amountCents ?? 0);
    if (amount < conditions.minAmountCents) return false;
  }

  if (typeof conditions.referencePrefix === "string") {
    const reference = String(metadata.reference ?? "");
    if (!reference.startsWith(conditions.referencePrefix)) return false;
  }

  if (Array.isArray(conditions.tagIncludes)) {
    const tags = asTags(metadata.tags);
    const expected = conditions.tagIncludes.map(String);
    if (!expected.some((tag) => tags.includes(tag))) return false;
  }

  return true;
}

async function createTaskAction(
  event: AutomationEvent,
  action: Record<string, unknown>,
  mode: AutomationMode,
) {
  if (mode === "simulate") return "createTask";

  await prisma.task.create({
    data: {
      id: `task_auto_${crypto.randomUUID()}`,
      tenantId: event.tenantId,
      contactId: event.contactId ?? undefined,
      organizationId: event.organizationId ?? undefined,
      conversationId: event.sourceType === "Conversation" ? event.sourceId : undefined,
      lifecycleItemId: event.sourceType === "LifecycleItem" ? event.sourceId : undefined,
      bookingId: event.sourceType === "Booking" ? event.sourceId : undefined,
      quoteId: event.sourceType === "Quote" ? event.sourceId : undefined,
      invoiceId: event.sourceType === "Invoice" ? event.sourceId : undefined,
      ownerUserId: String(action.userId ?? event.ownerUserId ?? event.metadata?.assignedUserId ?? ""),
      title: String(action.title ?? "Follow up"),
      description: String(action.body ?? "Automation-created follow up"),
      dueDate: addDays(new Date(), Number(action.offsetDays ?? 0)),
      status: "TODO",
      priority: "MEDIUM",
    },
  });

  return "createTask";
}

async function addNoteAction(event: AutomationEvent, action: Record<string, unknown>, mode: AutomationMode) {
  if (mode === "simulate") return "addNote";

  await prisma.note.create({
    data: {
      id: `note_auto_${crypto.randomUUID()}`,
      tenantId: event.tenantId,
      contactId: event.contactId ?? undefined,
      organizationId: event.organizationId ?? undefined,
      conversationId: event.sourceType === "Conversation" ? event.sourceId : undefined,
      lifecycleItemId: event.sourceType === "LifecycleItem" ? event.sourceId : undefined,
      authorUserId: String(event.ownerUserId ?? action.userId ?? "system"),
      body: String(action.body ?? "Automation note"),
      pinned: false,
    },
  });

  return "addNote";
}

async function notifyAction(event: AutomationEvent, action: Record<string, unknown>, mode: AutomationMode) {
  if (mode === "simulate") return "notify";

  await prisma.notification.create({
    data: {
      id: `notification_auto_${crypto.randomUUID()}`,
      tenantId: event.tenantId,
      userId: String(action.userId ?? event.ownerUserId ?? ""),
      kind: "AUTOMATION",
      title: String(action.title ?? "Automation"),
      body: String(action.body ?? `Automation triggered for ${event.sourceType}.`),
    },
  });

  return "notify";
}

async function applyTagAction(event: AutomationEvent, action: Record<string, unknown>, mode: AutomationMode) {
  const tag = String(action.tag ?? "").trim();
  if (!tag) return "applyTag";
  if (mode === "simulate") return "applyTag";

  if (event.sourceType === "Conversation") {
    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: event.sourceId } });
    const tags = Array.from(new Set([...asTags(conversation.tags), tag]));
    await prisma.conversation.update({ where: { id: event.sourceId }, data: { tags } });
  }

  if (event.sourceType === "LifecycleItem") {
    const item = await prisma.lifecycleItem.findUniqueOrThrow({ where: { id: event.sourceId } });
    const tags = Array.from(new Set([...asTags(item.tags), tag]));
    await prisma.lifecycleItem.update({ where: { id: event.sourceId }, data: { tags } });
  }

  return "applyTag";
}

async function assignOwnerAction(event: AutomationEvent, action: Record<string, unknown>, mode: AutomationMode) {
  const userId = String(action.userId ?? "").trim();
  if (!userId) return "assignOwner";
  if (mode === "simulate") return "assignOwner";

  if (event.sourceType === "Conversation") {
    await prisma.conversation.update({ where: { id: event.sourceId }, data: { assignedUserId: userId } });
  }

  if (event.sourceType === "LifecycleItem") {
    await prisma.lifecycleItem.update({ where: { id: event.sourceId }, data: { ownerUserId: userId } });
  }

  return "assignOwner";
}

async function changeStageAction(event: AutomationEvent, action: Record<string, unknown>, mode: AutomationMode) {
  const stageId = String(action.stageId ?? "").trim();
  if (!stageId) return "changeStage";
  if (mode === "simulate") return "changeStage";

  if (event.sourceType === "LifecycleItem") {
    await prisma.lifecycleItem.update({ where: { id: event.sourceId }, data: { stageId } });
    return "changeStage";
  }

  if (event.sourceType === "Quote") {
    const candidate = await prisma.lifecycleItem.findFirst({
      where: {
        tenantId: event.tenantId,
        contactId: event.contactId ?? undefined,
        organizationId: event.organizationId ?? undefined,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (candidate) {
      await prisma.lifecycleItem.update({ where: { id: candidate.id }, data: { stageId, status: "WON" } });
    }
  }

  return "changeStage";
}

async function changeCustomerOfferingStatusAction(
  event: AutomationEvent,
  action: Record<string, unknown>,
  mode: AutomationMode,
) {
  const status = String(action.status ?? "").trim();
  if (!status) return "changeCustomerOfferingStatus";
  if (mode === "simulate") return "changeCustomerOfferingStatus";

  const explicitLinkId = String(
    action.customerOfferingLinkId ??
      event.metadata?.customerOfferingLinkId ??
      "",
  ).trim();

  if (explicitLinkId) {
    await prisma.customerOfferingLink.update({
      where: { id: explicitLinkId },
      data: { status: status as never, lastActivityAt: new Date() },
    });
    return "changeCustomerOfferingStatus";
  }

  const candidate = await prisma.customerOfferingLink.findFirst({
    where: {
      tenantId: event.tenantId,
      contactId: event.contactId ?? undefined,
      organizationId: event.organizationId ?? undefined,
      offeringId: typeof event.metadata?.offeringId === "string" ? event.metadata.offeringId : undefined,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (candidate) {
    await prisma.customerOfferingLink.update({
      where: { id: candidate.id },
      data: { status: status as never, lastActivityAt: new Date() },
    });
  }

  return "changeCustomerOfferingStatus";
}

async function createFollowUpAction(
  event: AutomationEvent,
  action: Record<string, unknown>,
  mode: AutomationMode,
) {
  if (mode === "simulate") return "createFollowUp";

  await prisma.task.create({
    data: {
      id: `task_followup_${crypto.randomUUID()}`,
      tenantId: event.tenantId,
      contactId: event.contactId ?? undefined,
      organizationId: event.organizationId ?? undefined,
      ownerUserId: String(event.ownerUserId ?? action.userId ?? ""),
      title: String(action.title ?? "Follow up"),
      description: "Automation-created follow-up item.",
      dueDate: addDays(new Date(), 2),
      status: "TODO",
      priority: "MEDIUM",
    },
  });

  return "createFollowUp";
}

async function applyAction(event: AutomationEvent, action: Record<string, unknown>, mode: AutomationMode) {
  switch (action.type) {
    case "createTask":
      return createTaskAction(event, action, mode);
    case "addNote":
      return addNoteAction(event, action, mode);
    case "notify":
      return notifyAction(event, action, mode);
    case "applyTag":
      return applyTagAction(event, action, mode);
    case "assignOwner":
      return assignOwnerAction(event, action, mode);
    case "changeStage":
      return changeStageAction(event, action, mode);
    case "changeCustomerOfferingStatus":
      return changeCustomerOfferingStatusAction(event, action, mode);
    case "createFollowUp":
      return createFollowUpAction(event, action, mode);
    default:
      return "noop";
  }
}

export async function runAutomationsForEvent(event: AutomationEvent, mode: AutomationMode = "apply") {
  return observeServerFlow(
    {
      flow: "automation.evaluate",
      workflow: "automation",
      tenantId: event.tenantId,
      userId: event.ownerUserId ?? null,
      expectedResult: "Evaluate matching automation rules and record audit runs.",
      inputSummary: {
        triggerType: event.triggerType,
        sourceType: event.sourceType,
        sourceId: event.sourceId,
        mode,
        metadata: event.metadata ?? {},
      },
    },
    async () => {
      const rules = await prisma.automationRule.findMany({
        where: {
          tenantId: event.tenantId,
          triggerType: event.triggerType,
          enabled: true,
        },
      });

      const results: Array<{ ruleId: string; summary: string; status: AutomationRunStatus }> = [];
      await incrementMetricCounter("automation.ruleEvaluations", rules.length);

      for (const rule of rules) {
        if (!matchesRule(rule, event)) {
          results.push({ ruleId: rule.id, summary: "Rule conditions did not match.", status: AutomationRunStatus.SKIPPED });
          await appendJsonLine("events.jsonl", {
            timestamp: new Date().toISOString(),
            type: "automation.rule",
            tenantId: event.tenantId,
            ruleId: rule.id,
            triggerType: event.triggerType,
            sourceType: event.sourceType,
            sourceId: event.sourceId,
            status: AutomationRunStatus.SKIPPED,
            summary: "Rule conditions did not match.",
            mode,
          });
          continue;
        }

        await incrementMetricCounter("automation.ruleMatches");

        try {
          const applied = [];
          for (const action of asActions(rule.actions)) {
            applied.push(await applyAction(event, action, mode));
          }

          const status =
            mode === "simulate" ? AutomationRunStatus.SIMULATED : AutomationRunStatus.APPLIED;
          const summary = `${mode === "simulate" ? "Would apply" : "Applied"} ${applied.filter(Boolean).length} action(s).`;

          await prisma.automationRun.create({
            data: {
              id: `run_${crypto.randomUUID()}`,
              tenantId: event.tenantId,
              ruleId: rule.id,
              triggerType: event.triggerType,
              sourceType: event.sourceType,
              sourceId: event.sourceId,
              status,
              summary,
              details: toJsonValue({
                mode,
                applied,
                metadata: event.metadata ?? {},
              }),
            },
          });

          await prisma.automationRule.update({
            where: { id: rule.id },
            data: { lastRunAt: new Date() },
          });

          await appendJsonLine("events.jsonl", {
            timestamp: new Date().toISOString(),
            type: "automation.rule",
            tenantId: event.tenantId,
            ruleId: rule.id,
            triggerType: event.triggerType,
            sourceType: event.sourceType,
            sourceId: event.sourceId,
            status,
            summary,
            mode,
            applied,
          });

          results.push({ ruleId: rule.id, summary, status });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown automation error.";
          await incrementMetricCounter("automation.ruleFailures");

          await prisma.automationRun.create({
            data: {
              id: `run_${crypto.randomUUID()}`,
              tenantId: event.tenantId,
              ruleId: rule.id,
              triggerType: event.triggerType,
              sourceType: event.sourceType,
              sourceId: event.sourceId,
              status: AutomationRunStatus.FAILED,
              summary: message,
              details: toJsonValue({ mode, metadata: event.metadata ?? {} }),
            },
          });

          await appendJsonLine("events.jsonl", {
            timestamp: new Date().toISOString(),
            type: "automation.rule",
            tenantId: event.tenantId,
            ruleId: rule.id,
            triggerType: event.triggerType,
            sourceType: event.sourceType,
            sourceId: event.sourceId,
            status: AutomationRunStatus.FAILED,
            summary: message,
            mode,
          });

          results.push({ ruleId: rule.id, summary: message, status: AutomationRunStatus.FAILED });
        }
      }

      return {
        evaluatedRuleCount: rules.length,
        resultCount: results.length,
        results,
      };
    },
  );
}
