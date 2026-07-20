import Link from "next/link";

import { formatCurrency, formatDateOnly, invoiceRoute } from "@/shared/domain/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

type RevenueData = Awaited<ReturnType<typeof import("../server/queries").getRevenueData>>;

export function InvoicesPage({
  data,
}: {
  data: RevenueData;
}) {
  return (
    <div className="app-grid">
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Revenue Actions</p>
        <h1 className="mt-1 text-3xl font-semibold">Invoices, manual payments, and recurring revenue at a glance.</h1>
      </div>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Invoices</p>
              <p className="text-sm text-[var(--text-secondary)]">Print-friendly and local-payment ready.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.invoices.map((invoice) => (
              <Link key={invoice.id} href={invoiceRoute(invoice.id)} className="rounded-md bg-[var(--panel-subtle)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{invoice.reference}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {invoice.contact?.displayName ?? invoice.organization?.name}
                    </p>
                  </div>
                  <Badge tone={invoice.status === "OVERDUE" ? "danger" : invoice.status === "PAID" ? "success" : "warning"}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--text-secondary)]">
                  <span>{formatCurrency(invoice.balanceCents)}</span>
                  <span>Due {formatDateOnly(invoice.dueDate)}</span>
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  {invoice.lineItems[0]?.offering?.name ?? invoice.lineItems[0]?.description ?? "No line items"}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Create invoice</p>
              <p className="text-sm text-[var(--text-secondary)]">Derive invoices from the same offering prices used in quotes and subscriptions.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3">
              {data.offeringPrices.filter((price) => price.billingModel !== "RECURRING").slice(0, 4).map((price) => (
                <div key={price.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{price.offering.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{price.variant?.displayLabel ?? price.name}</p>
                    </div>
                    <Badge tone="accent">{formatCurrency(price.amountCents)}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <form className="grid gap-4" action="/api/revenue/invoices" method="post">
              <Field label="Reference">
                <Input name="reference" placeholder="INV-2026-099" required />
              </Field>
              <Field label="Offering price">
                <Select name="offeringPriceId" data-testid="invoice-offering-price-select">
                  {data.offeringPrices.filter((price) => price.billingModel !== "RECURRING").map((price) => (
                    <option key={price.id} value={price.id}>
                      {price.offering.name} · {price.variant?.displayLabel ?? price.name} · {formatCurrency(price.amountCents)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quantity">
                <Input defaultValue={1} min={1} name="quantity" type="number" />
              </Field>
              <Field label="Contact">
                <Select name="contactId" data-testid="invoice-contact-select">
                  <option value="">No contact</option>
                  {data.contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.displayName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Organization">
                <Select name="organizationId" data-testid="invoice-organization-select">
                  <option value="">No organization</option>
                  {data.organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Notes">
                <Textarea name="notes" required />
              </Field>
              <Button type="submit">Create invoice</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <p className="text-lg font-semibold">Recurring agreements</p>
            <p className="text-sm text-[var(--text-secondary)]">Stubbed for phase-2 subscription expansion.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.recurring.map((agreement) => (
            <div key={agreement.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{agreement.offering?.name ?? agreement.name}</p>
                <Badge tone="accent">{agreement.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{formatCurrency(agreement.amountCents)}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Next billing {formatDateOnly(agreement.nextBillingDate)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
