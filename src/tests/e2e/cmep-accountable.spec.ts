import { expect, test } from "@playwright/test";
import path from "node:path";

import { attachBrowserDiagnostics, captureSurface, finalizeRepresentativeArtifacts, isEvidenceRun, writeScenarioResults } from "./evidence-utils";

const evidenceSegment = process.env.CMEP_EVIDENCE_SEGMENT ?? "full";
const evidenceRunDir = process.env.CMEP_EVIDENCE_RUN_DIR ?? path.join(process.cwd(), "test-results", "accountable");

test.describe.configure({ mode: "serial" });

async function selectOptionContaining(select: import("@playwright/test").Locator, text: string) {
  const value = await select.locator("option").evaluateAll((options, expected) => {
    const match = options.find((option) => option.textContent?.includes(expected));
    return match?.getAttribute("value") ?? null;
  }, text);

  if (!value) {
    throw new Error(`Could not find option containing "${text}".`);
  }

  await select.selectOption(value);
  return value;
}

async function switchTenant(page: import("@playwright/test").Page, tenantName: string) {
  await page.getByLabel("Tenant switcher").selectOption({ label: tenantName });
  await expect(page.locator("aside")).toContainText(tenantName);
}

test("cmep accountable evidence flow", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    recordHar: { path: path.join(evidenceRunDir, "network.har"), mode: "full" },
    recordVideo: isEvidenceRun() ? { dir: path.join(evidenceRunDir, "videos") } : undefined,
  });

  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  const page = await context.newPage();
  await attachBrowserDiagnostics(context, page);

  const created = {
    customerId: "contact_zoe",
    offeringId: "",
    offeringName: `Evidence Service Sprint ${Date.now()}`,
    quoteId: "",
    invoiceId: "",
  };

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Keep customers, work, and revenue moving." })).toBeVisible();
  await switchTenant(page, "Signal Goods");
  await captureSurface(page, "mission-control");

  if (evidenceSegment !== "isolation") {
    await page.goto("/app/catalog");
    await expect(page.getByRole("heading", { name: "Offerings, prices, bundles, and customer access in one visual spine." })).toBeVisible();

    const catalogCreateForm = page.locator('form[action="/api/catalog/offerings"]');
    await catalogCreateForm.getByLabel("Type").selectOption("SERVICE");
    await catalogCreateForm.locator('input[name="code"]').fill(`SIG-EVID-${Date.now()}`);
    await catalogCreateForm.locator('input[name="name"]').fill(created.offeringName);
    await catalogCreateForm.locator('input[name="unitLabel"]').fill("session");
    await catalogCreateForm.locator('input[name="family"]').fill("Evidence Services");
    await catalogCreateForm.locator('input[name="category"]').fill("Verification");
    await catalogCreateForm.locator('input[name="summary"]').fill("Offering created during the accountable catalog rerun.");
    await catalogCreateForm
      .locator('textarea[name="description"]')
      .fill("A proof-oriented service offering used to route lifecycle, revenue, and portal work through the catalog spine.");
    await catalogCreateForm.locator('input[name="variantCode"]').fill("CORE90");
    await catalogCreateForm.locator('input[name="variantName"]').fill("Core 90");
    await catalogCreateForm.locator('input[name="variantLabel"]').fill("Core 90");
    await catalogCreateForm.locator('input[name="priceAmountCents"]').fill("135000");
    await catalogCreateForm.locator('input[name="priceName"]').fill("Core launch price");
    await catalogCreateForm.getByTestId("catalog-create-submit").click();
    await expect(page).toHaveURL(/\/app\/catalog\/off_/);
    created.offeringId = page.url().split("/").at(-1) ?? "";
    await expect(page.getByRole("heading", { name: created.offeringName })).toBeVisible();

    const variantForm = page.locator('form[action="/api/catalog/variants"]');
    await variantForm.locator('input[name="code"]').fill("VIP120");
    await variantForm.locator('input[name="name"]').fill("VIP 120");
    await variantForm.locator('input[name="displayLabel"]').fill("VIP 120");
    await variantForm.locator('input[name="optionName"]').fill("duration");
    await variantForm.locator('input[name="optionValue"]').fill("120");
    await variantForm.locator('input[name="serviceDurationMinutes"]').fill("120");
    await variantForm.getByTestId("catalog-variant-submit").click();
    await expect(page.getByText("VIP 120", { exact: true }).first()).toBeVisible();

    const priceForm = page.locator('form[action="/api/catalog/prices"]');
    await selectOptionContaining(priceForm.getByLabel("Variant"), "VIP 120");
    await priceForm.getByLabel("Price name").fill("VIP price");
    await priceForm.getByLabel("Amount (cents)").fill("189000");
    await priceForm.getByTestId("catalog-price-submit").click();
    await expect(page.getByText("VIP price", { exact: true }).first()).toBeVisible();
    await captureSurface(page, "offering-detail");

    await page.goto("/app/catalog");
    const assignmentForm = page.locator('form[action="/api/catalog/assignments"]');
    await selectOptionContaining(assignmentForm.getByLabel("Catalog"), "Signal Master Catalog");
    await selectOptionContaining(assignmentForm.getByLabel("Organization"), "Peakfit Collective");
    await selectOptionContaining(assignmentForm.getByLabel("Contact"), "Zoe Chang");
    await assignmentForm.getByLabel("Segment").fill("Evidence pilot");
    await assignmentForm.getByTestId("catalog-assignment-submit").click();
    await expect(page.getByText(created.offeringName, { exact: true }).first()).toBeVisible();
    await captureSurface(page, "catalog-home");

    await page.goto("/app/customers");
    await expect(page.getByRole("link", { name: /Zoe Chang/ })).toBeVisible();
    await captureSurface(page, "customers-list");

    await page.goto("/app/inbox");
    await page.getByPlaceholder("Write a reply or note...").fill("Following up from the accountable evidence flow.");
    await page.getByTestId("send-message-submit").click();
    await expect(page.getByText("Following up from the accountable evidence flow.")).toBeVisible();
    await captureSurface(page, "inbox");

    await page.goto("/app/lifecycle");
    await page.getByTestId("create-lifecycle-input").fill("Evidence lifecycle item");
    await page.getByTestId("lifecycle-contact-select").selectOption("contact_zoe");
    await page.getByTestId("lifecycle-organization-select").selectOption("org_peakfit");
    await page.getByTestId("lifecycle-offering-select").selectOption(created.offeringId);
    await selectOptionContaining(page.getByTestId("lifecycle-variant-select"), "Core 90");
    await page.getByTestId("create-lifecycle-submit").click();
    const lifecycleCard = page.locator('[data-testid^="lifecycle-item-"]', {
      hasText: "Evidence lifecycle item",
    });
    await expect(lifecycleCard).toBeVisible();
    await expect(lifecycleCard).toContainText(created.offeringName);
    await lifecycleCard.dragTo(page.getByTestId("stage-stage_signal_sales_qualified"));
    await captureSurface(page, "lifecycle-board");

    await page.goto("/app/schedule");
    await selectOptionContaining(page.getByTestId("schedule-offering-select"), "Demo Call");
    await selectOptionContaining(page.getByTestId("schedule-booking-type-select"), "Demo Call");
    await selectOptionContaining(page.getByTestId("schedule-contact-select"), "Zoe Chang");
    await selectOptionContaining(page.getByTestId("schedule-organization-select"), "Peakfit Collective");
    await page.locator('input[name="startsAt"]').fill("2026-04-20T10:00");
    await page.locator('textarea[name="notes"]').fill("Evidence booking note");
    await page.getByTestId("create-booking-submit").click();
    await expect(page.getByText("Evidence booking note")).toBeVisible();
    await captureSurface(page, "schedule");

    await page.goto("/app/revenue/quotes");
    await page.locator('input[name="reference"]').fill("EVID-QUOTE-001");
    await selectOptionContaining(page.getByTestId("quote-offering-price-select"), created.offeringName);
    await selectOptionContaining(page.getByTestId("quote-contact-select"), "Zoe Chang");
    await selectOptionContaining(page.getByTestId("quote-organization-select"), "Peakfit Collective");
    await page.locator('textarea[name="notes"]').fill("Evidence quote note");
    await page.getByTestId("create-quote-submit").click();
    await expect(page).toHaveURL(/\/app\/revenue\/quotes\//);
    created.quoteId = page.url().split("/").at(-1) ?? "";
    await expect(page.getByText("EVID-QUOTE-001")).toBeVisible();
    await captureSurface(page, "quote-detail");

    await page.goto("/app/revenue/invoices");
    await page.locator('input[name="reference"]').fill("EVID-INV-001");
    await selectOptionContaining(page.getByTestId("invoice-offering-price-select"), created.offeringName);
    await selectOptionContaining(page.getByTestId("invoice-contact-select"), "Zoe Chang");
    await selectOptionContaining(page.getByTestId("invoice-organization-select"), "Peakfit Collective");
    await page.locator('textarea[name="notes"]').fill("Evidence invoice note");
    await page.getByRole("button", { name: "Create invoice" }).click();
    await expect(page).toHaveURL(/\/app\/revenue\/invoices\//);
    created.invoiceId = page.url().split("/").at(-1) ?? "";
    await page.getByRole("button", { name: "Mark paid" }).click();
    await expect(page.getByText("PAID", { exact: true })).toBeVisible();
    await captureSurface(page, "invoice-detail");

    await page.goto("/app/automations");
    await page.getByTestId("automation-trigger-select").selectOption("QUOTE_APPROVED_FOR_OFFERING");
    await page.getByTestId("automation-source-type-select").selectOption("Quote");
    await selectOptionContaining(page.getByTestId("automation-source-id-select"), "SG-2026-101");
    await page.getByTestId("simulate-automation").click();
    await expect(page.getByTestId("automation-result")).toContainText(/Would apply|Rule conditions did not match/);
    await captureSurface(page, "automation-studio");

    await page.goto("/app/customers/contact_zoe");
    await expect(page.getByText(created.offeringName, { exact: true }).first()).toBeVisible();
    await captureSurface(page, "customer-detail");

    await page.goto("/client");
    await page.selectOption('select[name="accessKey"]', { label: "Zoe Chang portal" });
    await page.getByRole("button", { name: "Switch view" }).click();
    await expect(page.getByRole("heading", { name: "Zoe Chang" })).toBeVisible();
    await expect(page.getByText(created.offeringName, { exact: true }).first()).toBeVisible();
    await page.locator('textarea[placeholder="Reply to this thread..."]').fill("Portal evidence reply.");
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText("Portal evidence reply.")).toBeVisible();
    await captureSurface(page, "client-portal");
  }

  const probeResults: Record<string, unknown> = {};

  if (evidenceSegment !== "smoke") {
    await page.goto("/app/catalog");
    await switchTenant(page, "Northstar Studio");

    const crossTenantSearch = await page.evaluate(async (query) => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      return response.json();
    }, created.offeringName || "Trail Pack");

    expect(crossTenantSearch.offerings).toHaveLength(0);
    probeResults.crossTenantCatalogSearch = crossTenantSearch;

    const crossTenantUpdate = await page.evaluate(async (customerId) => {
      const formData = new FormData();
      formData.set("name", "Tampered Name");
      formData.set("segment", "Tampered");
      formData.set("lifecycleStage", "qualified");
      formData.set("notes", "Tampered notes");
      formData.set("tags", "tampered");
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "POST",
        body: formData,
      });
      return {
        status: response.status,
        body: await response.text(),
      };
    }, created.customerId || "contact_ava");

    expect(crossTenantUpdate.status).toBe(404);
    probeResults.crossTenantCustomerUpdate = crossTenantUpdate;

    await page.goto("/client");
    await page.selectOption('select[name="accessKey"]', { label: "Ava Hughes portal" });
    await page.getByRole("button", { name: "Switch view" }).click();
    await expect(page.getByRole("heading", { name: "Ava Hughes" })).toBeVisible();
    await expect(page.getByText(created.offeringName, { exact: true })).toHaveCount(0);
    await captureSurface(page, "client-portal-signal");

    await page.selectOption('select[name="accessKey"]', { label: "Zoe Chang portal" });
    await page.getByRole("button", { name: "Switch view" }).click();
    await expect(page.getByRole("heading", { name: "Zoe Chang" })).toBeVisible();

    const crossClientReply = await page.evaluate(async () => {
      const response = await fetch("/api/portal/conversations/conv_northstar_ava/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "Tampered cross-client reply" }),
      });
      return {
        status: response.status,
        body: await response.text(),
      };
    });

    expect(crossClientReply.status).toBe(403);
    probeResults.crossClientPortalReply = crossClientReply;

    const crossClientQuoteDecision = await page.evaluate(async () => {
      const response = await fetch("/api/revenue/quotes/quote_northstar_01/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "APPROVED", tenantId: "tenant_northstar", scope: "portal" }),
      });
      return {
        status: response.status,
        body: await response.text(),
      };
    });

    expect(crossClientQuoteDecision.status).toBe(403);
    probeResults.crossClientQuoteDecision = crossClientQuoteDecision;
  }

  await writeScenarioResults("scenario-results", {
    segment: evidenceSegment,
    created,
    probeResults,
  });

  await context.tracing.stop({ path: path.join(evidenceRunDir, "playwright-trace.zip") });
  await finalizeRepresentativeArtifacts("mission-control", evidenceSegment === "smoke" ? "client-portal" : "client-portal-signal");
  await context.close();
});
