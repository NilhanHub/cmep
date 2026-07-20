"use client";

import { useState } from "react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Select } from "@/shared/ui/select";

type StudioData = Awaited<ReturnType<typeof import("../server/queries").getAutomationStudioData>>;

export function AutomationStudio({ data }: { data: StudioData }) {
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [selection, setSelection] = useState({
    triggerType: "STAGE_CHANGED",
    sourceType: "LifecycleItem",
    sourceId: data.sources.lifecycleItems[0]?.id ?? "",
  });
  const [pending, setPending] = useState<"simulate" | "apply" | null>(null);

  const sourceOptions =
    selection.sourceType === "LifecycleItem"
      ? data.sources.lifecycleItems
      : selection.sourceType === "Conversation"
        ? data.sources.conversations
        : selection.sourceType === "Booking"
          ? data.sources.bookings
          : selection.sourceType === "Quote"
            ? data.sources.quotes
            : selection.sourceType === "Invoice"
              ? data.sources.invoices
              : data.sources.customerOfferingLinks;

  async function run(mode: "simulate" | "apply") {
    setPending(mode);
    try {
      const response = await fetch("/api/automation/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...selection, mode }),
      });
      const payload = (await response.json()) as
        | {
            ok: true;
            results: { results: Array<{ summary: string }> };
          }
        | {
            error?: string;
          };

      if (!response.ok || !("results" in payload)) {
        const message = "error" in payload ? payload.error : undefined;
        setLastResult(message ?? "Automation request failed.");
        return;
      }

      setLastResult(payload.results.results.map((result) => result.summary).join(" | "));
    } catch (error) {
      setLastResult(error instanceof Error ? error.message : "Automation request failed.");
    } finally {
      setPending(null);
    }
  }

  function sourceLabel(source: Record<string, unknown>) {
    if ("title" in source) return String(source.title);
    if ("subject" in source) return String(source.subject);
    if ("reference" in source) return String(source.reference);
    if ("offering" in source) return String((source.offering as { name?: string } | null)?.name ?? source.id);
    return String(source.id);
  }

  return (
    <div className="app-grid">
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Automation Studio</p>
        <h1 className="mt-1 text-3xl font-semibold">Rules that react to local events, not cloud dependencies.</h1>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Rules</p>
              <p className="text-sm text-[var(--text-secondary)]">Active triggers, conditions, and action plans.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.rules.map((rule) => (
              <div key={rule.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{rule.name}</p>
                  <div className="flex gap-2">
                    <Badge tone={rule.enabled ? "success" : "neutral"}>{rule.enabled ? "Enabled" : "Paused"}</Badge>
                    <Badge>{rule.triggerType}</Badge>
                  </div>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-md bg-[var(--panel)] p-3 text-xs text-[var(--text-secondary)]">
                  {JSON.stringify(rule.conditions, null, 2)}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Simulation</p>
              <p className="text-sm text-[var(--text-secondary)]">Use seeded events to test or apply a rule path.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Select
              value={selection.triggerType}
              data-testid="automation-trigger-select"
              onChange={(event) =>
                setSelection((current) => ({
                  ...current,
                  triggerType: event.target.value,
                }))
              }
            >
              <option value="STAGE_CHANGED">Stage changed</option>
              <option value="MESSAGE_RECEIVED">Message received</option>
              <option value="NO_REPLY_DAYS">No reply for N days</option>
              <option value="BOOKING_CREATED">Booking created</option>
              <option value="INVOICE_OVERDUE">Invoice overdue</option>
              <option value="QUOTE_APPROVED">Quote approved</option>
              <option value="OFFERING_REQUESTED">Offering requested</option>
              <option value="QUOTE_CREATED_FOR_OFFERING">Quote created for offering</option>
              <option value="QUOTE_APPROVED_FOR_OFFERING">Quote approved for offering</option>
              <option value="CUSTOMER_OFFERING_STATUS_CHANGED">Customer offering status changed</option>
            </Select>
            <Select
              value={selection.sourceType}
              data-testid="automation-source-type-select"
              onChange={(event) =>
                setSelection({
                  triggerType: selection.triggerType,
                  sourceType: event.target.value,
                  sourceId:
                    event.target.value === "LifecycleItem"
                      ? data.sources.lifecycleItems[0]?.id ?? ""
                      : event.target.value === "Conversation"
                        ? data.sources.conversations[0]?.id ?? ""
                        : event.target.value === "Booking"
                          ? data.sources.bookings[0]?.id ?? ""
                          : event.target.value === "Quote"
                            ? data.sources.quotes[0]?.id ?? ""
                            : event.target.value === "Invoice"
                              ? data.sources.invoices[0]?.id ?? ""
                              : data.sources.customerOfferingLinks[0]?.id ?? "",
                })
              }
            >
              <option value="LifecycleItem">Lifecycle item</option>
              <option value="Conversation">Conversation</option>
              <option value="Booking">Booking</option>
              <option value="Quote">Quote</option>
              <option value="Invoice">Invoice</option>
              <option value="CustomerOfferingLink">Customer offering</option>
            </Select>
            <Select
              value={selection.sourceId}
              data-testid="automation-source-id-select"
              onChange={(event) => setSelection((current) => ({ ...current, sourceId: event.target.value }))}
            >
              {sourceOptions.map((source) => (
                <option key={source.id} value={source.id}>
                  {sourceLabel(source)}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!selection.sourceId || pending !== null}
                onClick={() => void run("simulate")}
                data-testid="simulate-automation"
              >
                {pending === "simulate" ? "Simulating..." : "Simulate"}
              </Button>
              <Button
                type="button"
                disabled={!selection.sourceId || pending !== null}
                onClick={() => void run("apply")}
              >
                {pending === "apply" ? "Applying..." : "Apply"}
              </Button>
            </div>
            {lastResult ? (
              <div
                className="rounded-md bg-[var(--panel-subtle)] p-3 text-sm text-[var(--text-secondary)]"
                data-testid="automation-result"
                aria-live="polite"
              >
                {lastResult}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <p className="text-lg font-semibold">Run log</p>
            <p className="text-sm text-[var(--text-secondary)]">Audit trail for simulations and applied rule runs.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.runs.map((run) => (
            <div key={run.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{run.summary}</p>
                <div className="flex gap-2">
                  <Badge tone={run.status === "FAILED" ? "danger" : run.status === "SIMULATED" ? "accent" : "success"}>
                    {run.status}
                  </Badge>
                  <Badge>{run.triggerType}</Badge>
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {run.sourceType} · {run.sourceId}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
