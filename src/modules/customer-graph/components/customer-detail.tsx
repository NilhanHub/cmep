import Link from "next/link";

import { formatCurrency, formatDateOnly, formatDateTime, invoiceRoute, quoteRoute } from "@/shared/domain/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

type CustomerDetail = Awaited<ReturnType<typeof import("../server/queries").getCustomerDetail>>;

export function CustomerDetailView({ detail }: { detail: CustomerDetail }) {
  const entity = detail.entity;
  const tags = Array.isArray(entity.tags) ? entity.tags.join(", ") : "";
  const contacts = "contacts" in entity ? entity.contacts : [];
  const offeringShelves = Array.from(
    entity.customerOfferingLinks.reduce((map, link) => {
      const bucket = map.get(link.status) ?? [];
      bucket.push(link);
      map.set(link.status, bucket);
      return map;
    }, new Map<string, typeof entity.customerOfferingLinks>()),
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <Card className="h-fit">
        <CardHeader>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Summary</p>
            <h1 className="mt-1 text-2xl font-semibold">
              {"displayName" in entity ? entity.displayName : entity.name}
            </h1>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge tone={entity.status === "AT_RISK" ? "warning" : "accent"}>{entity.status}</Badge>
            <Badge>{entity.lifecycleStage}</Badge>
          </div>
          <p className="text-[var(--text-secondary)]">{entity.summary}</p>
          {"email" in entity ? <p>{entity.email}</p> : null}
          {"phone" in entity && entity.phone ? <p>{entity.phone}</p> : null}
          {"website" in entity && entity.website ? <p>{entity.website}</p> : null}
          <p>{entity.segment}</p>
          {"organization" in entity && entity.organization ? (
            <Link className="text-[var(--accent-strong)]" href={`/app/customers/${entity.organization.id}`}>
              {entity.organization.name}
            </Link>
          ) : null}
          {contacts.length > 0 ? (
            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Contacts</p>
              {contacts.map((contact) => (
                <Link key={contact.id} href={`/app/customers/${contact.id}`} className="rounded-md bg-[var(--panel-subtle)] px-3 py-2">
                  {contact.displayName}
                </Link>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Relationship timeline</p>
              <p className="text-sm text-[var(--text-secondary)]">Messages, bookings, revenue, and activity in one sequence.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {entity.activities.map((activity) => (
              <div key={activity.id} className="timeline-line pl-7">
                <div className="absolute mt-1 size-3 rounded-full bg-[var(--accent-strong)]" />
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{activity.detail}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDateTime(activity.occurredAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Offerings and catalog relationships</p>
              <p className="text-sm text-[var(--text-secondary)]">Available, proposed, booked, active, and lapsed work tied to explicit offerings.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {offeringShelves.map(([status, links]) => (
              <div key={status} className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{status}</p>
                  <Badge tone={status === "ACTIVE" || status === "SUBSCRIBED" ? "success" : status === "BLOCKED" ? "danger" : "accent"}>
                    {links.length}
                  </Badge>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {links.map((link) => (
                    <div key={link.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{link.offering.name}</p>
                        <Badge>{link.variant?.displayLabel ?? "Base"}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {link.catalog?.name ?? "Direct"}{link.price ? ` · ${link.price.name}` : ""}
                      </p>
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
              <p className="text-lg font-semibold">Connected work</p>
              <p className="text-sm text-[var(--text-secondary)]">Threads, lifecycle cards, bookings, and money actions.</p>
            </div>
          </CardHeader>
          <CardContent className="balanced-grid">
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Conversations</p>
              {entity.conversations.map((conversation) => (
                <Link key={conversation.id} href={`/app/inbox?conversation=${conversation.id}`} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="text-sm font-medium">{conversation.subject}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{conversation.status}</p>
                </Link>
              ))}
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Lifecycle</p>
              {entity.lifecycleItems.map((item) => (
                <Link key={item.id} href={`/app/lifecycle?focus=${item.id}`} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {item.offering?.name ?? "Generic work"} · {item.stage.name}
                  </p>
                </Link>
              ))}
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Bookings</p>
              {entity.bookings.map((booking) => (
                <div key={booking.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="text-sm font-medium">{booking.offering?.name ?? booking.bookingType.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatDateTime(booking.startsAt)}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Revenue</p>
              {entity.quotes.map((quote) => (
                <Link key={quote.id} href={quoteRoute(quote.id)} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="text-sm font-medium">{quote.reference}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatCurrency(quote.totalCents)}</p>
                </Link>
              ))}
              {entity.invoices.map((invoice) => (
                <Link key={invoice.id} href={invoiceRoute(invoice.id)} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="text-sm font-medium">{invoice.reference}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatCurrency(invoice.balanceCents)}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Update</p>
              <p className="text-sm text-[var(--text-secondary)]">Keep the relationship summary current.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" action={`/api/customers/${entity.id}`} method="post">
              <Field label="Name">
                <Input name="name" defaultValue={"displayName" in entity ? entity.displayName : entity.name} />
              </Field>
              <Field label="Segment">
                <Input name="segment" defaultValue={entity.segment} />
              </Field>
              <Field label="Lifecycle stage">
                <Input name="lifecycleStage" defaultValue={entity.lifecycleStage} />
              </Field>
              <Field label="Tags">
                <Input name="tags" defaultValue={tags} placeholder="comma, separated, tags" />
              </Field>
              <Field label="Summary">
                <Textarea name="notes" defaultValue={entity.summary} />
              </Field>
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Files and recurring</p>
              <p className="text-sm text-[var(--text-secondary)]">Assets and recurring revenue tied to this relationship.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {entity.files.map((file) => (
              <a key={file.id} href={file.path} className="rounded-md bg-[var(--panel-subtle)] p-3">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{formatDateOnly(file.createdAt)}</p>
              </a>
            ))}
            {entity.recurringAgreements.map((agreement) => (
              <div key={agreement.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{agreement.name}</p>
                  <Badge tone="success">{agreement.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {formatCurrency(agreement.amountCents)} · next {formatDateOnly(agreement.nextBillingDate)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
