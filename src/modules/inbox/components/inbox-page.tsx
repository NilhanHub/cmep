import Link from "next/link";

import { formatDateTime, relativeTime } from "@/shared/domain/format";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";

import { AttachmentUploader } from "./attachment-uploader";
import { MessageComposer } from "./message-composer";

type InboxData = Awaited<ReturnType<typeof import("../server/queries").getInboxData>>;

export function InboxPage({ data }: { data: InboxData }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
      <Card className="h-fit">
        <CardHeader>
          <div>
            <p className="text-lg font-semibold">Inbox</p>
            <p className="text-sm text-[var(--text-secondary)]">Shared conversations across local channels.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/app/inbox?conversation=${conversation.id}`}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--panel-subtle)] p-3 transition hover:border-[var(--accent-strong)]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{conversation.subject}</p>
                {conversation.unreadCount > 0 ? <Badge tone="danger">{conversation.unreadCount}</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {conversation.contact?.displayName ?? conversation.organization?.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>{conversation.status}</Badge>
                <Badge tone={conversation.priority === "URGENT" ? "danger" : conversation.priority === "HIGH" ? "warning" : "neutral"}>
                  {conversation.priority}
                </Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          {data.selected ? (
            <div>
              <p className="text-lg font-semibold">{data.selected.subject}</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {data.selected.contact?.displayName ?? data.selected.organization?.name}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold">Select a conversation</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid gap-4">
          {data.selected ? (
            <>
              <div className="grid gap-3">
                {data.selected.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-md p-4 ${
                      message.isInternalNote
                        ? "border border-dashed border-[var(--border-strong)] bg-[var(--panel)]"
                        : message.authorType === "CLIENT"
                          ? "bg-[var(--panel-subtle)]"
                          : "bg-[var(--panel-strong)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{message.authorLabel}</p>
                      <p className="text-xs text-[var(--text-muted)]">{relativeTime(message.sentAt)}</p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{message.body}</p>
                    {message.attachments.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.fileAsset.path}
                            className="rounded-md bg-[var(--panel)] px-3 py-1 text-xs"
                          >
                            {attachment.fileAsset.name}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <AttachmentUploader conversationId={data.selected.id} />
                <p className="text-xs text-[var(--text-muted)]">{formatDateTime(data.selected.lastMessageAt)}</p>
              </div>
              <MessageComposer
                conversationId={data.selected.id}
                cannedReplies={data.cannedReplies.map((reply) => ({
                  id: reply.id,
                  title: reply.title,
                  category: reply.category,
                }))}
              />
            </>
          ) : (
            <EmptyState title="No conversations" description="Seed data will appear here after demo reset." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Context</p>
              <p className="text-sm text-[var(--text-secondary)]">Customer story, status, and channel metadata.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {data.selected ? (
              <>
                <div className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="font-medium">
                    {data.selected.contact?.displayName ?? data.selected.organization?.name}
                  </p>
                  <p className="mt-1 text-[var(--text-secondary)]">{data.selected.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{data.selected.channel}</Badge>
                  <Badge>{data.selected.status}</Badge>
                  <Badge tone={data.selected.priority === "URGENT" ? "danger" : "warning"}>
                    {data.selected.priority}
                  </Badge>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">AI assist</p>
              <p className="text-sm text-[var(--text-secondary)]">Local deterministic guidance for triage and reply.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {data.aiAssist ? (
              <>
                <div className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Summary</p>
                  <p className="mt-2">{data.aiAssist.summary}</p>
                </div>
                <div className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Next action</p>
                  <p className="mt-2">{data.aiAssist.nextBestAction}</p>
                </div>
                <div className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Reply draft</p>
                  <p className="mt-2">{data.aiAssist.replyDraft}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={data.aiAssist.riskLabel === "high" ? "danger" : data.aiAssist.riskLabel === "medium" ? "warning" : "accent"}>
                    {data.aiAssist.riskLabel}
                  </Badge>
                  <Badge>{data.aiAssist.intent}</Badge>
                  {data.aiAssist.extractedTags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="No AI brief" description="Select a thread to inspect local AI guidance." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
