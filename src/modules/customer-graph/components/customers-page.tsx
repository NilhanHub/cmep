import Link from "next/link";

import { customerRoute } from "@/shared/domain/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

type CustomersData = Awaited<ReturnType<typeof import("../server/queries").getCustomersPageData>>;

export function CustomersPage({
  data,
  query,
}: {
  data: CustomersData;
  query?: string;
}) {
  return (
    <div className="app-grid">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Unified Customer Graph</p>
          <h1 className="mt-1 text-3xl font-semibold">Every customer relationship in one visual surface.</h1>
        </div>
        <form className="flex w-full max-w-sm gap-2" action="/app/customers">
          <Input name="q" defaultValue={query} placeholder="Search customers, tags, companies..." />
          <Button type="submit">Search</Button>
        </form>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Customers</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Contacts and organizations grouped by relationship momentum.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3">
              {data.contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={customerRoute(contact.id)}
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--panel-subtle)] p-4 transition hover:border-[var(--accent-strong)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{contact.displayName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {contact.title} {contact.organization ? `· ${contact.organization.name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={contact.status === "AT_RISK" ? "warning" : "accent"}>{contact.status}</Badge>
                      <Badge>{contact.lifecycleStage}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">{contact.summary}</p>
                </Link>
              ))}
            </div>
            <div className="grid gap-3 border-t border-[var(--border-subtle)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Organizations
              </p>
              {data.organizations.map((organization) => (
                <Link
                  key={organization.id}
                  href={customerRoute(organization.id)}
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--panel-subtle)] p-4 transition hover:border-[var(--accent-strong)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{organization.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {organization.industry} · {organization.contacts.length} contacts
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={organization.status === "AT_RISK" ? "warning" : "neutral"}>
                        {organization.status}
                      </Badge>
                      <Badge>{organization.lifecycleStage}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">{organization.summary}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Create customer</p>
              <p className="text-sm text-[var(--text-secondary)]">Add a person or company directly into the tenant graph.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" action="/api/customers" method="post">
              <Field label="Type">
                <Select name="kind" defaultValue="contact">
                  <option value="contact">Contact</option>
                  <option value="organization">Organization</option>
                </Select>
              </Field>
              <Field label="Name">
                <Input name="name" placeholder="Ava Hughes or Bluebird Wellness" required />
              </Field>
              <Field label="Email">
                <Input name="email" type="email" placeholder="contact@local.test" />
              </Field>
              <Field label="Phone">
                <Input name="phone" placeholder="+1 555 0100" />
              </Field>
              <Field label="Company">
                <Input name="company" placeholder="Optional for contacts" />
              </Field>
              <Field label="Segment">
                <Input name="segment" placeholder="VIP, pilot, wholesale..." required />
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue="PROSPECT">
                  <option value="ACTIVE">Active</option>
                  <option value="PROSPECT">Prospect</option>
                  <option value="AT_RISK">At risk</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </Field>
              <Field label="Notes">
                <Textarea name="notes" placeholder="Context, relationship story, next action..." required />
              </Field>
              <Button type="submit" data-testid="create-customer-submit">
                Create customer
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
