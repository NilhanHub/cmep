import Link from "next/link";

import { formatCurrency } from "@/shared/domain/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import { OfferingIcon } from "./offering-icon";

type CatalogData = Awaited<ReturnType<typeof import("../server/queries").getCatalogHomeData>>;

function toneForType(type: "PRODUCT" | "SERVICE" | "BUNDLE") {
  if (type === "BUNDLE") return "accent" as const;
  if (type === "SERVICE") return "success" as const;
  return "warning" as const;
}

export function CatalogPage({
  data,
  query,
  typeFilter,
  sort,
}: {
  data: CatalogData;
  query?: string;
  typeFilter?: "PRODUCT" | "SERVICE" | "BUNDLE" | "";
  sort?: "family" | "name" | "relationships" | "price";
}) {
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const filteredOfferings = [...data.offerings]
    .filter((offering) => {
      if (typeFilter && offering.type !== typeFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        offering.name,
        offering.code,
        offering.family,
        offering.category,
        offering.summary,
        ...offering.variants.map((variant) => variant.displayLabel),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    .sort((left, right) => {
      if (sort === "relationships") {
        return right.customerLinks.length - left.customerLinks.length || left.name.localeCompare(right.name);
      }

      if (sort === "price") {
        const leftPrice =
          left.prices.find((price) => price.isDefault)?.amountCents ??
          left.prices[0]?.amountCents ??
          left.variants.flatMap((variant) => variant.prices)[0]?.amountCents ??
          0;
        const rightPrice =
          right.prices.find((price) => price.isDefault)?.amountCents ??
          right.prices[0]?.amountCents ??
          right.variants.flatMap((variant) => variant.prices)[0]?.amountCents ??
          0;
        return rightPrice - leftPrice || left.name.localeCompare(right.name);
      }

      if (sort === "name") {
        return left.name.localeCompare(right.name);
      }

      return left.family.localeCompare(right.family) || left.name.localeCompare(right.name);
    });
  const familyGroups = Array.from(
    filteredOfferings.reduce((map, offering) => {
      const group = map.get(offering.family) ?? [];
      group.push(offering);
      map.set(offering.family, group);
      return map;
    }, new Map<string, typeof data.offerings>()),
  );

  return (
    <div className="app-grid">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Catalog</p>
          <h1 className="mt-1 text-3xl font-semibold">Offerings, prices, bundles, and customer access in one visual spine.</h1>
        </div>
        <form action="/app/catalog" className="grid w-full max-w-3xl gap-2 md:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))_auto]">
          <Input name="q" defaultValue={query} placeholder="Search offerings, families, variants, or SKU codes..." />
          <Select name="type" defaultValue={typeFilter}>
            <option value="">All types</option>
            <option value="PRODUCT">Products</option>
            <option value="SERVICE">Services</option>
            <option value="BUNDLE">Bundles</option>
          </Select>
          <Select name="sort" defaultValue={sort ?? "family"}>
            <option value="family">Sort by family</option>
            <option value="name">Sort by name</option>
            <option value="relationships">Sort by relationships</option>
            <option value="price">Sort by price</option>
          </Select>
          <Button type="submit">Refine</Button>
        </form>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Create offering</p>
              <p className="text-sm text-[var(--text-secondary)]">Start with the sellable thing, then route the workflow around it.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" action="/api/catalog/offerings" method="post">
              <Field label="Type">
                <Select name="type" defaultValue="PRODUCT">
                  <option value="PRODUCT">Product</option>
                  <option value="SERVICE">Service</option>
                  <option value="BUNDLE">Bundle</option>
                </Select>
              </Field>
              <Field label="Code">
                <Input name="code" placeholder="SIG-NEW-OFFERING" required />
              </Field>
              <Field label="Name">
                <Input name="name" placeholder="New flagship offering" required />
              </Field>
              <Field label="Unit label">
                <Input name="unitLabel" placeholder="kit, session, month" />
              </Field>
              <Field label="Family">
                <Input name="family" placeholder="Launch planning" required />
              </Field>
              <Field label="Category">
                <Input name="category" placeholder="Enablement" required />
              </Field>
              <div className="md:col-span-2">
                <Field label="Summary">
                  <Input name="summary" placeholder="Short visual card summary" required />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea name="description" placeholder="What this offering is for and how it moves downstream work." required />
                </Field>
              </div>
              <Field label="Starter variant code">
                <Input name="variantCode" placeholder="DEFAULT" />
              </Field>
              <Field label="Starter variant name">
                <Input name="variantName" placeholder="Core package" />
              </Field>
              <Field label="Starter variant label">
                <Input name="variantLabel" placeholder="Core package" />
              </Field>
              <Field label="Starter price (cents)">
                <Input name="priceAmountCents" type="number" min="0" placeholder="150000" />
              </Field>
              <Field label="Price label">
                <Input name="priceName" placeholder="Default price" />
              </Field>
              <Field label="Billing model">
                <Select name="billingModel" defaultValue="ONE_TIME">
                  <option value="ONE_TIME">One-time</option>
                  <option value="RECURRING">Recurring</option>
                  <option value="TIERED_SIMPLE">Tiered simple</option>
                  <option value="NEGOTIATED_OVERRIDE_SUPPORT">Negotiated support</option>
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Button type="submit" data-testid="catalog-create-submit">
                  Create offering
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div>
                <p className="text-lg font-semibold">Catalog assignment</p>
                <p className="text-sm text-[var(--text-secondary)]">Decide who can request, view, and buy from each assortment.</p>
              </div>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" action="/api/catalog/assignments" method="post">
                <Field label="Catalog">
                  <Select name="catalogId">
                    {data.catalogs.map((catalog) => (
                      <option key={catalog.id} value={catalog.id}>
                        {catalog.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Organization">
                  <Select name="organizationId">
                    <option value="">No organization</option>
                    {data.organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Contact">
                  <Select name="contactId">
                    <option value="">No contact</option>
                    {data.contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.displayName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Segment">
                  <Input name="segment" placeholder="Wholesale, DTC, VIP" />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input defaultChecked name="portalVisible" type="checkbox" value="true" />
                  Visible in client workspace
                </label>
                <Button type="submit" data-testid="catalog-assignment-submit">
                  Assign catalog
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <p className="text-lg font-semibold">Assignment shelf</p>
                <p className="text-sm text-[var(--text-secondary)]">Live customer-specific and segment-specific assortments.</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.catalogs.map((catalog) => (
                <div key={catalog.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{catalog.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{catalog.items.length} catalog items</p>
                    </div>
                    <Badge tone={catalog.type === "PORTAL" ? "accent" : "neutral"}>{catalog.type}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {catalog.assignments.map((assignment) => (
                      <span key={assignment.id} className="rounded-md bg-[var(--panel)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                        {assignment.contact?.displayName ?? assignment.organization?.name ?? assignment.segment ?? "Open"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6">
        {familyGroups.map(([family, offerings]) => (
          <div key={family} className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{family}</h2>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(offerings.map((offering) => offering.category))).map((category) => (
                  <span key={category} className="rounded-md bg-[var(--panel-subtle)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {offerings.map((offering) => {
                const featuredPrice =
                  offering.prices.find((price) => price.isDefault) ?? offering.prices[0] ?? offering.variants[0]?.prices[0];

                return (
                  <Link key={offering.id} href={`/app/catalog/${offering.id}`} className="block">
                    <Card className="h-full overflow-hidden transition hover:border-[var(--accent-strong)] hover:bg-[var(--panel-strong)]">
                      <div className="flex h-36 items-end justify-between bg-[linear-gradient(135deg,var(--panel-subtle),transparent)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-12 items-center justify-center rounded-md bg-white/10">
                            <OfferingIcon iconName={offering.iconName} className="size-6 text-[var(--accent-strong)]" />
                          </div>
                          <div>
                            <Badge tone={toneForType(offering.type)}>{offering.type}</Badge>
                            <p className="mt-2 text-lg font-semibold">{offering.name}</p>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{offering.code}</p>
                      </div>
                      <CardContent className="grid gap-4">
                        <p className="text-sm text-[var(--text-secondary)]">{offering.summary}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-md bg-[var(--panel-subtle)] px-2 py-1 text-xs">{offering.category}</span>
                          {offering.variants.slice(0, 2).map((variant) => (
                            <span key={variant.id} className="rounded-md bg-[var(--panel-subtle)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                              {variant.displayLabel}
                            </span>
                          ))}
                        </div>
                        <div className="grid gap-2 rounded-md bg-[var(--panel-subtle)] p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Price block</p>
                          <p className="text-lg font-semibold">
                            {featuredPrice ? formatCurrency(featuredPrice.amountCents) : "Add pricing"}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {offering.customerLinks.length} customer relationship{offering.customerLinks.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
