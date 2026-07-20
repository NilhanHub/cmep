import { AlertTriangle, CalendarClock, CircleDollarSign, ListTodo, MessageSquareText } from "lucide-react";

import type { getMissionControlData } from "../server/queries";
import { formatCurrency, formatDateTime, quoteRoute, invoiceRoute } from "@/shared/domain/format";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";

type MissionControlData = Awaited<ReturnType<typeof getMissionControlData>>;

export function MissionControl({ data }: { data: MissionControlData }) {
  return (
    <div className="app-grid">
      <section className="balanced-grid">
        <Card>
          <CardHeader>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Today&apos;s tasks</p>
              <p className="mt-1 text-3xl font-semibold">{data.tasks.length}</p>
            </div>
            <ListTodo className="size-5 text-[var(--accent-strong)]" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Attention inbox</p>
              <p className="mt-1 text-3xl font-semibold">{data.conversations.length}</p>
            </div>
            <MessageSquareText className="size-5 text-[var(--accent-strong)]" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">At-risk work</p>
              <p className="mt-1 text-3xl font-semibold">{data.lifecycleItems.length}</p>
            </div>
            <AlertTriangle className="size-5 text-[var(--accent-strong)]" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Upcoming bookings</p>
              <p className="mt-1 text-3xl font-semibold">{data.bookings.length}</p>
            </div>
            <CalendarClock className="size-5 text-[var(--accent-strong)]" />
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="items-center">
            <div>
              <p className="text-lg font-semibold">Priority flow</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Work needing movement across tasks, conversations, and at-risk delivery.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Tasks
              </p>
              {data.tasks.map((task) => (
                <div key={task.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{task.description}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Conversations
              </p>
              {data.conversations.map((conversation) => (
                <div key={conversation.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{conversation.subject}</p>
                    {conversation.unreadCount > 0 ? <Badge tone="danger">{conversation.unreadCount} unread</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {conversation.contact?.displayName ?? conversation.organization?.name}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                At risk
              </p>
              {data.lifecycleItems.map((item) => (
                <div key={item.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge tone="warning">{item.stage.name}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {item.contact?.displayName ?? item.organization?.name}
                  </p>
                  {item.offering ? <p className="mt-1 text-xs text-[var(--accent-strong)]">{item.offering.name}</p> : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div>
                <p className="text-lg font-semibold">Upcoming</p>
                <p className="text-sm text-[var(--text-secondary)]">Bookings and reminders for the next few days.</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.bookings.map((booking) => (
                <div key={booking.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{booking.offering?.name ?? booking.bookingType.name}</p>
                    <Badge tone="accent">{booking.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {booking.contact?.displayName ?? booking.organization?.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDateTime(booking.startsAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <p className="text-lg font-semibold">Revenue edge</p>
                <p className="text-sm text-[var(--text-secondary)]">Quotes and invoices that need movement.</p>
              </div>
              <CircleDollarSign className="size-5 text-[var(--accent-strong)]" />
            </CardHeader>
            <CardContent className="grid gap-3">
              {[...data.quotes.map((quote) => ({ id: quote.id, label: quote.reference, amount: quote.totalCents, href: quoteRoute(quote.id), status: quote.status })), ...data.invoices.map((invoice) => ({ id: invoice.id, label: invoice.reference, amount: invoice.balanceCents, href: invoiceRoute(invoice.id), status: invoice.status }))].slice(0, 6).map((entry) => (
                <a key={entry.id} href={entry.href} className="rounded-md bg-[var(--panel-subtle)] p-3 transition hover:bg-[var(--panel-strong)]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{entry.label}</p>
                    <Badge tone={entry.status === "OVERDUE" ? "danger" : "neutral"}>{entry.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{formatCurrency(entry.amount)}</p>
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Hot offerings</p>
              <p className="text-sm text-[var(--text-secondary)]">Newly requested, quoted, active, and at-risk customer offering relationships.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.customerOfferingLinks.map((link) => (
              <div key={link.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{link.offering.name}</p>
                  <Badge tone={link.status === "BLOCKED" ? "danger" : link.status === "ACTIVE" || link.status === "SUBSCRIBED" ? "success" : "accent"}>
                    {link.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {link.contact?.displayName ?? link.organization?.name}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Expiring by offering</p>
              <p className="text-sm text-[var(--text-secondary)]">Quotes and invoices that still need a decision or payment.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[...data.quotes, ...data.invoices].slice(0, 6).map((entry) => (
              <div key={entry.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{entry.reference}</p>
                  <Badge tone={"lineItems" in entry && entry.status === "OVERDUE" ? "danger" : "accent"}>{entry.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {entry.lineItems?.[0]?.offering?.name ?? entry.contact?.displayName ?? entry.organization?.name}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
