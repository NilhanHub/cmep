import Link from "next/link";

import { customerRoute, formatCurrency, formatDateOnly, invoiceRoute, quoteRoute } from "@/shared/domain/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";

import { OfferingIcon } from "./offering-icon";

type OfferingDetail = Awaited<ReturnType<typeof import("../server/queries").getOfferingDetail>>;

function toneForStatus(status: string) {
  if (["ACTIVE", "SUBSCRIBED", "DELIVERED", "BOOKED"].includes(status)) return "success" as const;
  if (["BLOCKED", "LAPSED"].includes(status)) return "danger" as const;
  if (["QUOTED", "PROPOSED", "AVAILABLE"].includes(status)) return "accent" as const;
  return "neutral" as const;
}

export function OfferingDetailPage({ data }: { data: OfferingDetail }) {
  const { offering } = data;
  const pricingCards = [
    ...offering.prices.map((price) => ({
      price,
      variantLabel: null,
    })),
    ...offering.variants.flatMap((variant) =>
      variant.prices.map((price) => ({
        price,
        variantLabel: variant.displayLabel,
      })),
    ),
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <Card className="h-fit overflow-hidden">
        <div className="flex h-44 items-end bg-[linear-gradient(135deg,var(--panel-subtle),transparent)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-md bg-white/10">
              <OfferingIcon iconName={offering.iconName} className="size-7 text-[var(--accent-strong)]" />
            </div>
            <div>
              <Badge tone={offering.type === "BUNDLE" ? "accent" : offering.type === "SERVICE" ? "success" : "warning"}>
                {offering.type}
              </Badge>
              <h1 className="mt-2 text-2xl font-semibold">{offering.name}</h1>
            </div>
          </div>
        </div>
        <CardContent className="grid gap-4 pt-6 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge>{offering.family}</Badge>
            <Badge tone="neutral">{offering.category}</Badge>
          </div>
          <p className="text-[var(--text-secondary)]">{offering.summary}</p>
          <div className="grid gap-1 text-xs text-[var(--text-secondary)]">
            <p>{offering.code}</p>
            <p>{offering.slug}</p>
            {offering.unitLabel ? <p>{offering.unitLabel}</p> : null}
          </div>
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Catalog reach</p>
            {offering.catalogItems.map((item) => (
              <div key={item.id} className="rounded-md bg-[var(--panel-subtle)] px-3 py-2">
                <p className="font-medium">{item.catalog.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{item.price?.name ?? "No price attached"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Offering story</p>
              <p className="text-sm text-[var(--text-secondary)]">Variants, pricing, bundle shape, and the routes this offering drives.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <p className="text-sm text-[var(--text-secondary)]">{offering.description}</p>

            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Variant strip</p>
              <div className="flex flex-wrap gap-2">
                {offering.variants.map((variant) => (
                  <div key={variant.id} className="rounded-md border border-[var(--border-subtle)] bg-[var(--panel-subtle)] px-3 py-2">
                    <p className="text-sm font-medium">{variant.displayLabel}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{variant.code}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Pricing cards</p>
              <div className="grid gap-3 md:grid-cols-2">
                {pricingCards.map(({ price, variantLabel }) => (
                  <div key={price.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{price.name}</p>
                        {variantLabel ? <p className="text-xs text-[var(--text-secondary)]">{variantLabel}</p> : null}
                      </div>
                      {price.isDefault ? <Badge tone="accent">Default</Badge> : null}
                    </div>
                    <p className="mt-3 text-xl font-semibold">{formatCurrency(price.amountCents)}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {price.billingModel}
                      {price.interval ? ` · ${price.interval}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Version {price.version}</p>
                  </div>
                ))}
              </div>
            </div>

            {offering.bundleItems.length > 0 ? (
              <div className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Bundle composition</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {offering.bundleItems.map((item) => (
                    <div key={item.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{item.itemOffering.name}</p>
                        <Badge tone={item.requirement === "OPTIONAL" ? "neutral" : "accent"}>{item.requirement}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {item.itemVariant?.displayLabel ?? "Base"} · qty {item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Route map</p>
              <div className="grid gap-3 md:grid-cols-2">
                {offering.routeBindings.map((binding) => (
                  <div key={binding.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{binding.catalog?.name ?? "Unscoped route"}</p>
                      <Badge tone={binding.portalVisible ? "success" : "neutral"}>
                        {binding.portalVisible ? "Portal visible" : "Internal only"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-1 text-sm text-[var(--text-secondary)]">
                      <p>Pipeline: {binding.pipelineTemplate?.name ?? "None"}</p>
                      <p>Booking: {binding.bookingType?.name ?? "None"}</p>
                      <p>Intake: {binding.intakeForm?.name ?? "None"}</p>
                      <p>Automation: {binding.automationRule?.name ?? "None"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Customer relationships</p>
              <p className="text-sm text-[var(--text-secondary)]">Who has access, who was quoted, who booked, and who is active.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
                {offering.customerLinks.map((link) => (
                  <div key={link.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      {link.contact?.id || link.organization?.id ? (
                        <Link className="font-medium" href={customerRoute(link.contact?.id ?? link.organization?.id ?? "")}>
                          {link.contact?.displayName ?? link.organization?.name ?? "Unscoped relationship"}
                        </Link>
                      ) : (
                        <p className="font-medium">Unscoped relationship</p>
                      )}
                      <Badge tone={toneForStatus(link.status)}>{link.status}</Badge>
                    </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {link.catalog?.name ?? "Direct link"}{link.price ? ` · ${link.price.name}` : ""}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">First seen {formatDateOnly(link.firstSeenAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Connected work</p>
              <p className="text-sm text-[var(--text-secondary)]">Where this offering appears across lifecycle, bookings, revenue, and inbox context.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Lifecycle</p>
              {data.lifecycleItems.map((item) => (
                <Link key={item.id} href={`/app/lifecycle?focus=${item.id}`} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{item.stage.name}</p>
                </Link>
              ))}
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Bookings</p>
              {data.bookings.map((booking) => (
                <div key={booking.id} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="font-medium">{booking.bookingType.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{booking.contact?.displayName ?? booking.organization?.name}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Quotes</p>
              {data.quotes.map((quote) => (
                <Link key={quote.id} href={quoteRoute(quote.id)} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="font-medium">{quote.reference}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatCurrency(quote.totalCents)}</p>
                </Link>
              ))}
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Invoices</p>
              {data.invoices.map((invoice) => (
                <Link key={invoice.id} href={invoiceRoute(invoice.id)} className="rounded-md bg-[var(--panel-subtle)] p-3">
                  <p className="font-medium">{invoice.reference}</p>
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
              <p className="text-lg font-semibold">Add variant</p>
              <p className="text-sm text-[var(--text-secondary)]">Expand the sellable shape without leaving the detail page.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" action="/api/catalog/variants" method="post">
              <input name="offeringId" type="hidden" value={offering.id} />
              <Field label="Code">
                <Input name="code" placeholder="NEW-VARIANT" required />
              </Field>
              <Field label="Name">
                <Input name="name" placeholder="Variant name" required />
              </Field>
              <Field label="Label">
                <Input name="displayLabel" placeholder="Display label" required />
              </Field>
              <Field label="Option name">
                <Input name="optionName" placeholder="tier, color, duration" />
              </Field>
              <Field label="Option value">
                <Input name="optionValue" placeholder="Signature, Slate, 90" />
              </Field>
              <Field label="Service duration (minutes)">
                <Input name="serviceDurationMinutes" type="number" min="0" />
              </Field>
              <Button type="submit" data-testid="catalog-variant-submit">
                Add variant
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Add price</p>
              <p className="text-sm text-[var(--text-secondary)]">New prices create a new version instead of mutating old financial truth.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" action="/api/catalog/prices" method="post">
              <input name="offeringId" type="hidden" value={offering.id} />
              <Field label="Variant">
                <Select name="variantId">
                  <option value="">Base offering</option>
                  {offering.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.displayLabel}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Price name">
                <Input name="name" placeholder="New price version" required />
              </Field>
              <Field label="Amount (cents)">
                <Input name="amountCents" type="number" min="0" required />
              </Field>
              <Field label="Billing model">
                <Select name="billingModel" defaultValue="ONE_TIME">
                  <option value="ONE_TIME">One-time</option>
                  <option value="RECURRING">Recurring</option>
                  <option value="TIERED_SIMPLE">Tiered simple</option>
                  <option value="NEGOTIATED_OVERRIDE_SUPPORT">Negotiated support</option>
                </Select>
              </Field>
              <Field label="Interval">
                <Select name="interval" defaultValue="">
                  <option value="">No interval</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                </Select>
              </Field>
              <Button type="submit" data-testid="catalog-price-submit">
                Add price
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
