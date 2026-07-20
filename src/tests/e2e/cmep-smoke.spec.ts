import { expect, test } from "@playwright/test";

test("cmep local-first smoke flow", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Keep customers, work, and revenue moving." })).toBeVisible();
  await page.getByLabel("Tenant switcher").selectOption({ label: "Signal Goods" });
  await expect(page.locator("aside")).toContainText("Signal Goods");

  await page.goto("/app/catalog");
  await expect(page.getByRole("heading", { name: "Offerings, prices, bundles, and customer access in one visual spine." })).toBeVisible();
  await expect(page.getByText("Trail Pack")).toBeVisible();
  await expect(page.getByText("Demo Call")).toBeVisible();

  await page.goto("/app/customers");
  await expect(page.getByRole("link", { name: /Zoe Chang/ })).toBeVisible();
  await page.goto("/app/customers/contact_zoe");
  await expect(page.getByText("Spring Floor Set Bundle", { exact: true })).toBeVisible();

  await page.goto("/app/inbox");
  await page.getByPlaceholder("Write a reply or note...").fill("Following up from smoke test.");
  await page.getByTestId("send-message-submit").click();
  await expect(page.getByText("Following up from smoke test.")).toBeVisible();

  await page.goto("/app/lifecycle");
  await page.getByTestId("create-lifecycle-input").fill("Smoke pipeline item");
  await page.getByTestId("lifecycle-contact-select").selectOption("contact_zoe");
  await page.getByTestId("lifecycle-organization-select").selectOption("org_peakfit");
  await page.getByTestId("lifecycle-offering-select").selectOption("off_signal_floor_set_bundle");
  await page.getByTestId("lifecycle-variant-select").selectOption("var_signal_floor_set_peakfit");
  await page.getByTestId("create-lifecycle-submit").click();
  const lifecycleCard = page.locator('[data-testid^="lifecycle-item-"]', {
    hasText: "Smoke pipeline item",
  });
  await expect(lifecycleCard).toBeVisible();
  await lifecycleCard.dragTo(page.getByTestId("stage-stage_signal_sales_qualified"));

  await page.goto("/app/automations");
  await page.getByTestId("automation-trigger-select").selectOption("QUOTE_APPROVED_FOR_OFFERING");
  await page.getByTestId("automation-source-type-select").selectOption("Quote");
  await page.getByTestId("simulate-automation").click();
  await expect(page.getByTestId("automation-result")).toContainText(/Would apply|Rule conditions did not match/);

  await page.goto("/app/schedule");
  await page.getByTestId("schedule-offering-select").selectOption("off_signal_demo_call");
  await page.getByTestId("schedule-booking-type-select").selectOption("booking_signal_demo");
  await page.getByTestId("schedule-contact-select").selectOption("contact_zoe");
  await page.getByTestId("schedule-organization-select").selectOption("org_peakfit");
  await page.locator('input[name="startsAt"]').fill("2026-04-20T10:00");
  await page.locator('textarea[name="notes"]').fill("Smoke booking note");
  await page.getByTestId("create-booking-submit").click();
  await expect(page.getByText("Smoke booking note")).toBeVisible();

  await page.goto("/app/revenue/quotes");
  await page.locator('input[name="reference"]').fill("SMOKE-001");
  await page.getByTestId("quote-offering-price-select").selectOption("price_signal_wholesale_rollout");
  await page.getByTestId("quote-contact-select").selectOption("contact_zoe");
  await page.getByTestId("quote-organization-select").selectOption("org_peakfit");
  await page.locator('textarea[name="notes"]').fill("Smoke quote note");
  await page.getByTestId("create-quote-submit").click();
  await expect(page).toHaveURL(/\/app\/revenue\/quotes\//);
  await expect(page.getByText("SMOKE-001")).toBeVisible();

  await page.goto("/client");
  await page.selectOption('select[name="accessKey"]', { label: "Zoe Chang portal" });
  await page.getByRole("button", { name: "Switch view" }).click();
  await expect(page.getByRole("heading", { name: "Zoe Chang" })).toBeVisible();
  await expect(page.getByText("Spring Floor Set Bundle", { exact: true }).first()).toBeVisible();

  await page.goto("/app/customers");
  await expect(page.getByRole("link", { name: /Zoe Chang/ })).toBeVisible();
  await expect(page.getByText("Ava Hughes")).toHaveCount(0);
});
