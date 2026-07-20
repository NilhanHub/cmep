"use client";

import { formatCurrency, formatDateOnly } from "@/shared/domain/format";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";

import { MarkPaidButton } from "./mark-paid-button";
import { QuoteDecisionButton } from "./quote-decision-button";

export function QuoteDetailSheet({
  quote,
}: {
  quote: Awaited<ReturnType<typeof import("../server/queries").getQuoteDetail>>;
}) {
  return (
    <div className="print-sheet app-grid">
      <Card>
        <CardHeader>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Quote</p>
            <h1 className="mt-1 text-3xl font-semibold">{quote.reference}</h1>
          </div>
          <div className="flex gap-2">
            <Badge tone={quote.status === "APPROVED" ? "success" : quote.status === "REJECTED" ? "danger" : "accent"}>
              {quote.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {quote.contact?.displayName ?? quote.organization?.name}
          </p>
          <div className="grid gap-2">
            {quote.lineItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md bg-[var(--panel-subtle)] p-3">
                <div>
                  <p>{item.description}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {item.offering?.name ?? "Manual item"}{item.offeringVariant ? ` · ${item.offeringVariant.displayLabel}` : ""}{item.isAdHoc ? " · Ad hoc" : ""}
                  </p>
                </div>
                <p>{formatCurrency(item.quantity * item.unitPriceCents)}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-1 text-sm text-[var(--text-secondary)]">
            <p>Issue date: {formatDateOnly(quote.issueDate)}</p>
            <p>Expires: {formatDateOnly(quote.expiresAt)}</p>
            <p>Total: {formatCurrency(quote.totalCents)}</p>
          </div>
          <div className="no-print flex gap-2">
            <QuoteDecisionButton quoteId={quote.id} tenantId={quote.tenantId} decision="APPROVED" />
            <QuoteDecisionButton quoteId={quote.id} tenantId={quote.tenantId} decision="REJECTED" />
            <button type="button" className="rounded-md border border-[var(--border-strong)] px-4 text-sm" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function InvoiceDetailSheet({
  invoice,
}: {
  invoice: Awaited<ReturnType<typeof import("../server/queries").getInvoiceDetail>>;
}) {
  return (
    <div className="print-sheet app-grid">
      <Card>
        <CardHeader>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Invoice</p>
            <h1 className="mt-1 text-3xl font-semibold">{invoice.reference}</h1>
          </div>
          <Badge tone={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "warning"}>
            {invoice.status}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {invoice.contact?.displayName ?? invoice.organization?.name}
          </p>
          <div className="grid gap-2">
            {invoice.lineItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md bg-[var(--panel-subtle)] p-3">
                <div>
                  <p>{item.description}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {item.offering?.name ?? "Manual item"}{item.offeringVariant ? ` · ${item.offeringVariant.displayLabel}` : ""}{item.isAdHoc ? " · Ad hoc" : ""}
                  </p>
                </div>
                <p>{formatCurrency(item.quantity * item.unitPriceCents)}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-1 text-sm text-[var(--text-secondary)]">
            <p>Issue date: {formatDateOnly(invoice.issueDate)}</p>
            <p>Due date: {formatDateOnly(invoice.dueDate)}</p>
            <p>Balance: {formatCurrency(invoice.balanceCents)}</p>
          </div>
          <div className="no-print flex gap-2">
            <MarkPaidButton invoiceId={invoice.id} />
            <button type="button" className="rounded-md border border-[var(--border-strong)] px-4 text-sm" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
