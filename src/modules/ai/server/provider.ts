import type { Contact, Conversation, Message, Organization } from "@prisma/client";

type ConversationInput = {
  conversation: Conversation;
  messages: Message[];
  contact?: Contact | null;
  organization?: Organization | null;
};

export type ConversationAiAssist = {
  summary: string;
  nextBestAction: string;
  replyDraft: string;
  extractedTags: string[];
  intent: string;
  riskLabel: "low" | "medium" | "high";
};

function scoreRisk(text: string) {
  const lowered = text.toLowerCase();
  const highSignals = ["urgent", "overdue", "problem", "replacement", "delay", "invoice"];
  const mediumSignals = ["timeline", "approval", "waiting", "follow up"];

  if (highSignals.some((signal) => lowered.includes(signal))) {
    return "high" as const;
  }

  if (mediumSignals.some((signal) => lowered.includes(signal))) {
    return "medium" as const;
  }

  return "low" as const;
}

function inferIntent(text: string) {
  const lowered = text.toLowerCase();

  if (lowered.includes("invoice") || lowered.includes("paid")) return "finance_follow_up";
  if (lowered.includes("book") || lowered.includes("schedule")) return "booking_request";
  if (lowered.includes("approve") || lowered.includes("proposal")) return "approval_request";
  if (lowered.includes("issue") || lowered.includes("replacement")) return "issue_resolution";

  return "general_update";
}

export function getConversationAssist({
  conversation,
  messages,
  contact,
  organization,
}: ConversationInput): ConversationAiAssist {
  const latestMessage = messages.at(-1);
  const recentText = messages.slice(-3).map((message) => message.body).join(" ");
  const riskLabel = scoreRisk(`${conversation.subject} ${recentText}`);
  const intent = inferIntent(`${conversation.subject} ${latestMessage?.body ?? ""}`);
  const extractedTags = Array.from(
    new Set(
      [conversation.subject, latestMessage?.body ?? ""]
        .join(" ")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => ["approval", "invoice", "booking", "launch", "returns", "demo", "proposal", "follow"].includes(token)),
    ),
  );

  return {
    summary: `${contact?.displayName ?? organization?.name ?? "Customer"} is active on "${conversation.subject}" with ${messages.length} messages in thread.`,
    nextBestAction:
      riskLabel === "high"
        ? "Reply with a concrete owner, timing, and next checkpoint."
        : "Confirm the next milestone and keep the thread moving with one decision.",
    replyDraft:
      riskLabel === "high"
        ? "I have this moving now. I will confirm owner, timing, and the next checkpoint in this thread today."
        : "Thanks for the update. I have logged the next step and will send the next checkpoint with the decision path.",
    extractedTags,
    intent,
    riskLabel,
  };
}
