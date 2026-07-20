import { afterAll, describe, expect, it } from "vitest";

import { createCustomer, getCustomerDetail, getCustomersPageData } from "@/modules/customer-graph/server/queries";
import { moveLifecycleItem } from "@/modules/lifecycle/server/queries";
import { getPortalWorkspace, assertPortalConversationAccess, assertPortalQuoteAccess } from "@/modules/portal/server/queries";
import { decideQuote, markInvoicePaid } from "@/modules/revenue/server/queries";
import { prisma } from "@/shared/server/prisma";

describe("tenant scoping", () => {
  it("only lists customers for the requested tenant", async () => {
    const northstar = await getCustomersPageData("tenant_northstar");
    const signal = await getCustomersPageData("tenant_signal");

    expect(northstar.contacts.some((contact) => contact.id === "contact_ava")).toBe(true);
    expect(northstar.contacts.some((contact) => contact.id === "contact_zoe")).toBe(false);
    expect(signal.organizations.some((organization) => organization.id === "org_peakfit")).toBe(true);
    expect(signal.organizations.some((organization) => organization.id === "org_bluebird")).toBe(false);
  });

  it("rejects cross-tenant detail reads", async () => {
    await expect(getCustomerDetail("tenant_signal", "contact_ava")).rejects.toThrow();
  });

  it("keeps newly created customers inside the active tenant", async () => {
    const created = await createCustomer("tenant_northstar", "user_iris", {
      kind: "contact",
      name: "Scoped Test Contact",
      email: "scoped-test@local.test",
      segment: "QA",
      status: "ACTIVE",
      notes: "Created from tenant isolation test.",
    });

    const northstar = await getCustomersPageData("tenant_northstar");
    const signal = await getCustomersPageData("tenant_signal");

    expect(northstar.contacts.some((contact) => contact.id === created.id)).toBe(true);
    expect(signal.contacts.some((contact) => contact.id === created.id)).toBe(false);
  });

  it("rejects cross-tenant lifecycle moves", async () => {
    await expect(
      moveLifecycleItem({
        tenantId: "tenant_signal",
        itemId: "life_northstar_launch",
        stageId: "stage_signal_sales_qualified",
      }),
    ).rejects.toThrow();
  });

  it("scopes the portal workspace to the current client access", async () => {
    const workspace = await getPortalWorkspace("northstar-ava");

    expect(workspace.currentAccess?.id).toBe("portal_ava");
    expect(workspace.currentAccess).not.toBeNull();
    expect(workspace.quotes?.some((quote) => quote.id === "quote_northstar_01")).toBe(true);
    expect(workspace.quotes?.some((quote) => quote.id === "quote_signal_01")).toBe(false);
  });

  it("rejects cross-client portal reply access", async () => {
    await expect(assertPortalConversationAccess("signal-zoe", "conv_northstar_ava")).rejects.toThrow();
  });

  it("rejects cross-client portal quote access", async () => {
    await expect(assertPortalQuoteAccess("signal-zoe", "quote_northstar_01")).rejects.toThrow();
  });

  it("rejects cross-tenant quote decisions", async () => {
    await expect(
      decideQuote({
        tenantId: "tenant_signal",
        quoteId: "quote_northstar_01",
        decision: "APPROVED",
      }),
    ).rejects.toThrow();
  });

  it("rejects cross-tenant invoice payments", async () => {
    await expect(
      markInvoicePaid({
        tenantId: "tenant_northstar",
        invoiceId: "invoice_signal_01",
      }),
    ).rejects.toThrow();
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
