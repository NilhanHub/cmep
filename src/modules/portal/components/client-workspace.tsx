import { formatCurrency, formatDateOnly, formatDateTime } from "@/shared/domain/format";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";

import { PortalReplyForm } from "./portal-reply-form";
import { QuoteDecisionButton } from "@/modules/revenue/components/quote-decision-button";

type PortalData = Awaited<ReturnType<typeof import("../server/queries").getPortalWorkspace>>;

export function ClientWorkspace({ data }: { data: PortalData }) {
  if (!data.currentAccess) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4">
        <EmptyState title="No portal access" description="No active portal access record is available." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-background)] px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <Card className="overflow-hidden">
          <div
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.currentAccess.tenant.coverImagePath ?? ""})` }}
          />
          <CardHeader>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{data.currentAccess.tenant.name}</p>
              <h1 className="mt-1 text-3xl font-semibold">
                {data.currentAccess.contact?.displayName ?? data.currentAccess.organization?.name}
              </h1>
            </div>
            <form action="/api/portal/access" method="post" className="min-w-52">
              <select
                name="accessKey"
                defaultValue={data.currentAccess.accessKey}
                className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--panel)] px-3 text-sm"
              >
                {data.accesses.map((access) => (
                  <option key={access.id} value={access.accessKey}>
                    {access.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="mt-2 rounded-md bg-[var(--panel-strong)] px-3 py-2 text-sm">
                Switch view
              </button>
            </form>
          </CardHeader>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-lg font-semibold">Available catalog</p>
                  <p className="text-sm text-[var(--text-secondary)]">Only the assigned catalog items and requestable routes for this client scope.</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {data.catalogAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{assignment.catalog.name}</p>
                      <Badge tone="accent">{assignment.catalog.type}</Badge>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {assignment.catalog.items.map((item) => (
                        <div key={item.id} className="rounded-md bg-[var(--panel)] p-3">
                          <p className="font-medium">{item.offering.name}</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {item.variant?.displayLabel ?? item.price?.name ?? "Base"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">{formatCurrency(item.price?.amountCents ?? 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-lg font-semibold">Active and past offerings</p>
                  <p className="text-sm text-[var(--text-secondary)]">Customer-specific relationships tracked through catalog, quote, booking, and invoice flow.</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {data.customerOfferingLinks.map((link) => (
                  <div key={link.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{link.offering.name}</p>
                      <Badge tone={link.status === "ACTIVE" || link.status === "SUBSCRIBED" ? "success" : "accent"}>{link.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {link.variant?.displayLabel ?? "Base"}{link.price ? ` · ${formatCurrency(link.price.amountCents)}` : ""}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-lg font-semibold">Conversations</p>
                  <p className="text-sm text-[var(--text-secondary)]">Reply to shared threads without leaving the portal.</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {data.conversations.map((conversation) => (
                  <div key={conversation.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{conversation.subject}</p>
                      <Badge>{conversation.status}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {conversation.messages.map((message) => (
                        <div key={message.id} className="rounded-md bg-[var(--panel)] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{message.authorLabel}</p>
                            <p className="text-xs text-[var(--text-muted)]">{formatDateTime(message.sentAt)}</p>
                          </div>
                          <p className="mt-2 text-sm text-[var(--text-secondary)]">{message.body}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <PortalReplyForm conversationId={conversation.id} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-lg font-semibold">Requests and status</p>
                  <p className="text-sm text-[var(--text-secondary)]">See current lifecycle work, bookings, and files.</p>
                </div>
              </CardHeader>
              <CardContent className="balanced-grid">
                {data.lifecycleItems.map((item) => (
                  <div key={item.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{item.title}</p>
                      <Badge>{item.stage.name}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.description}</p>
                    {item.offering ? (
                      <p className="mt-1 text-xs text-[var(--accent-strong)]">
                        {item.offering.name}{item.offeringVariant ? ` · ${item.offeringVariant.displayLabel}` : ""}
                      </p>
                    ) : null}
                  </div>
                ))}
                {data.bookings.map((booking) => (
                  <div key={booking.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <p className="font-medium">{booking.offering?.name ?? booking.bookingType.name}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{formatDateTime(booking.startsAt)}</p>
                  </div>
                ))}
                {data.files.map((file) => (
                  <a key={file.id} href={file.path} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <p className="font-medium">{file.name}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{formatDateOnly(file.createdAt)}</p>
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-lg font-semibold">Quotes</p>
                  <p className="text-sm text-[var(--text-secondary)]">Approve or reject without leaving the portal.</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.quotes.map((quote) => (
                  <div key={quote.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{quote.reference}</p>
                      <Badge>{quote.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{formatCurrency(quote.totalCents)}</p>
                    <div className="mt-3 grid gap-2">
                      {quote.lineItems.map((item) => (
                        <div key={item.id} className="rounded-md bg-[var(--panel)] p-2 text-sm">
                          {item.offering?.name ?? item.description}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <QuoteDecisionButton quoteId={quote.id} tenantId={quote.tenantId} decision="APPROVED" scope="portal" />
                      <QuoteDecisionButton quoteId={quote.id} tenantId={quote.tenantId} decision="REJECTED" scope="portal" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <p className="text-lg font-semibold">Invoices</p>
                  <p className="text-sm text-[var(--text-secondary)]">View balances and due dates.</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{invoice.reference}</p>
                      <Badge tone={invoice.status === "OVERDUE" ? "danger" : invoice.status === "PAID" ? "success" : "warning"}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{formatCurrency(invoice.balanceCents)}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Due {formatDateOnly(invoice.dueDate)}</p>
                    <div className="mt-3 grid gap-2">
                      {invoice.lineItems.map((item) => (
                        <div key={item.id} className="rounded-md bg-[var(--panel)] p-2 text-sm">
                          {item.offering?.name ?? item.description}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
