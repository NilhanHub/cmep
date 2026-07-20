"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

type LifecycleData = Awaited<ReturnType<typeof import("../server/queries").getLifecycleData>>;

export function LifecycleBoard({
  data,
  focusId,
}: {
  data: LifecycleData;
  focusId?: string;
}) {
  const router = useRouter();
  const initialTemplate =
    data.templates.find((template) =>
      template.stages.some((stage) => stage.items.some((item) => item.id === focusId)),
    ) ?? data.templates[0];
  const [activeTemplateId, setActiveTemplateId] = useState(initialTemplate?.id);
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [offeringId, setOfferingId] = useState(data.offerings[0]?.id ?? "");
  const [offeringVariantId, setOfferingVariantId] = useState("");

  const activeTemplate = useMemo(
    () => data.templates.find((template) => template.id === activeTemplateId) ?? data.templates[0],
    [activeTemplateId, data.templates],
  );
  const activeOffering = useMemo(
    () => data.offerings.find((offering) => offering.id === offeringId),
    [data.offerings, offeringId],
  );

  async function createItem() {
    if (!title.trim() || !activeTemplate) return;
    await fetch("/api/lifecycle/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: activeTemplate.id,
        title,
        contactId: contactId || undefined,
        organizationId: organizationId || undefined,
        offeringId: offeringId || undefined,
        offeringVariantId: offeringVariantId || undefined,
      }),
    });
    setTitle("");
    router.refresh();
  }

  return (
    <div className="app-grid">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Lifecycle Canvas</p>
          <h1 className="mt-1 text-3xl font-semibold">Move sales, service, and issue work in one visual board.</h1>
        </div>
        {activeTemplate ? (
          <div className="grid w-full max-w-5xl gap-2 md:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))_auto]">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Create a new lifecycle item" data-testid="create-lifecycle-input" />
            <select value={contactId} onChange={(event) => setContactId(event.target.value)} className="rounded-md border border-[var(--border-strong)] bg-[var(--panel)] px-3 text-sm" data-testid="lifecycle-contact-select">
              <option value="">Contact</option>
              {data.contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.displayName}
                </option>
              ))}
            </select>
            <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="rounded-md border border-[var(--border-strong)] bg-[var(--panel)] px-3 text-sm" data-testid="lifecycle-organization-select">
              <option value="">Organization</option>
              {data.organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            <select value={offeringId} onChange={(event) => { setOfferingId(event.target.value); setOfferingVariantId(""); }} className="rounded-md border border-[var(--border-strong)] bg-[var(--panel)] px-3 text-sm" data-testid="lifecycle-offering-select">
              <option value="">Offering</option>
              {data.offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.name}
                </option>
              ))}
            </select>
            <select value={offeringVariantId} onChange={(event) => setOfferingVariantId(event.target.value)} className="rounded-md border border-[var(--border-strong)] bg-[var(--panel)] px-3 text-sm" data-testid="lifecycle-variant-select">
              <option value="">Variant</option>
              {activeOffering?.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.displayLabel}
                </option>
              ))}
            </select>
            <Button type="button" onClick={() => void createItem()} data-testid="create-lifecycle-submit">
              Add item
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {data.templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setActiveTemplateId(template.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTemplateId === template.id
                ? "bg-[var(--accent-strong)] text-white"
                : "bg-[var(--panel)] text-[var(--text-primary)]"
            }`}
          >
            {template.name}
          </button>
        ))}
      </div>

      {activeTemplate ? (
        <div className="grid gap-4 xl:grid-cols-5">
          {activeTemplate.stages.map((stage) => (
            <div
              key={stage.id}
              data-testid={`stage-${stage.id}`}
              className="min-h-56 rounded-md border border-[var(--border-subtle)] bg-[var(--panel)] p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={async (event) => {
                event.preventDefault();
                const itemId = event.dataTransfer.getData("text/plain");
                if (!itemId) return;
                await fetch(`/api/lifecycle/items/${itemId}/move`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ stageId: stage.id }),
                });
                router.refresh();
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{stage.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{stage.items.length} items</p>
                </div>
                <span className="size-3 rounded-full" style={{ backgroundColor: stage.color }} />
              </div>
              <div className="grid gap-3">
                {stage.items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                    className="rounded-md border border-[var(--border-subtle)] bg-[var(--panel-subtle)] p-3"
                    data-testid={focusId === item.id ? "focused-lifecycle-item" : `lifecycle-item-${item.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.riskFlag ? <Badge tone="warning">Risk</Badge> : null}
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      {item.contact?.displayName ?? item.organization?.name}
                    </p>
                    {item.offering ? (
                      <p className="mt-2 text-xs font-medium text-[var(--accent-strong)]">
                        {item.offering.name}{item.offeringVariant ? ` · ${item.offeringVariant.displayLabel}` : ""}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{item.priority}</Badge>
                      {item.valueCents > 0 ? <Badge tone="accent">${Math.round(item.valueCents / 100)}</Badge> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">No lifecycle templates available.</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <p className="text-lg font-semibold">List view</p>
            <p className="text-sm text-[var(--text-secondary)]">Secondary view for quick scanning.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {activeTemplate?.stages.flatMap((stage) => stage.items).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[var(--panel-subtle)] p-3">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {item.contact?.displayName ?? item.organization?.name}
                </p>
                {item.offering ? (
                  <p className="text-xs text-[var(--accent-strong)]">
                    {item.offering.name}{item.offeringVariant ? ` · ${item.offeringVariant.displayLabel}` : ""}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge>{activeTemplate?.stages.find((stage) => stage.id === item.stageId)?.name}</Badge>
                <Badge>{item.priority}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
