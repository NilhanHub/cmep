import { AutomationTriggerType, MessageAuthorType } from "@prisma/client";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import { runAutomationsForEvent } from "@/modules/automation/server/engine";
import { getConversationAssist } from "@/modules/ai/server/provider";
import { prisma } from "@/shared/server/prisma";

export async function getInboxData(tenantId: string, selectedId?: string) {
  const conversations = await prisma.conversation.findMany({
    where: { tenantId },
    orderBy: [{ unreadCount: "desc" }, { lastMessageAt: "desc" }],
    include: {
      contact: true,
      organization: true,
      messages: {
        orderBy: { sentAt: "asc" },
        include: {
          attachments: {
            include: { fileAsset: true },
          },
        },
      },
    },
  });

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0] ?? null;

  const cannedReplies = await prisma.cannedReply.findMany({
    where: { tenantId },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  const aiAssist = selected
    ? getConversationAssist({
        conversation: selected,
        messages: selected.messages,
        contact: selected.contact,
        organization: selected.organization,
      })
    : null;

  return { conversations, selected, cannedReplies, aiAssist };
}

export async function sendConversationMessage(input: {
  tenantId: string;
  userId: string;
  conversationId: string;
  body: string;
  isInternalNote?: boolean;
  cannedReplyId?: string;
}) {
  const conversation = await prisma.conversation.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.conversationId },
  });

  let body = input.body;
  if (input.cannedReplyId) {
    const cannedReply = await prisma.cannedReply.findFirst({
      where: { tenantId: input.tenantId, id: input.cannedReplyId },
    });
    if (cannedReply) {
      body = `${cannedReply.body}\n\n${body}`.trim();
    }
  }

  await prisma.message.create({
    data: {
      id: `msg_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      conversationId: conversation.id,
      authorType: MessageAuthorType.USER,
      authorLabel: "Team",
      body,
      isInternalNote: Boolean(input.isInternalNote),
      extractedTags: [],
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      status: input.isInternalNote ? conversation.status : "PENDING",
      lastMessageAt: new Date(),
      unreadCount: 0,
    },
  });
}

export async function uploadConversationAttachment(input: {
  tenantId: string;
  conversationId: string;
  file: File;
  userId: string;
}) {
  const arrayBuffer = await input.file.arrayBuffer();
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const relativePath = path.join("storage", "uploads", `${Date.now()}-${safeName}`);
  const absolutePath = path.join(process.cwd(), relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(arrayBuffer));

  const fileAsset = await prisma.fileAsset.create({
    data: {
      id: `file_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      uploadedByUserId: input.userId,
      name: input.file.name,
      path: `/${relativePath.replaceAll("\\", "/")}`,
      mimeType: input.file.type || "application/octet-stream",
      sizeBytes: input.file.size,
    },
  });

  await prisma.attachment.create({
    data: {
      id: `attach_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      fileAssetId: fileAsset.id,
    },
  });
}

export async function receivePortalReply(input: {
  tenantId: string;
  conversationId: string;
  body: string;
  contactId?: string | null;
  organizationId?: string | null;
}) {
  await prisma.message.create({
    data: {
      id: `msg_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      authorType: MessageAuthorType.CLIENT,
      authorLabel: "Client",
      body: input.body,
      extractedTags: [],
    },
  });

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: {
      status: "OPEN",
      unreadCount: { increment: 1 },
      lastMessageAt: new Date(),
    },
  });

  await runAutomationsForEvent(
    {
      tenantId: input.tenantId,
      triggerType: AutomationTriggerType.MESSAGE_RECEIVED,
      sourceType: "Conversation",
      sourceId: input.conversationId,
      contactId: input.contactId,
      organizationId: input.organizationId,
      metadata: {
        tags: ["follow-up"],
      },
    },
    "apply",
  );
}
