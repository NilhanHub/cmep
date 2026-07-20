import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { CatalogPage } from "@/modules/catalog/components/catalog-page";
import { getCatalogHomeData } from "@/modules/catalog/server/queries";
import { observeServerFlow } from "@/shared/observability/server";

export const runtime = "nodejs";

export default async function CatalogRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: "PRODUCT" | "SERVICE" | "BUNDLE"; sort?: "family" | "name" | "relationships" | "price" }>;
}) {
  const { q, type, sort } = await searchParams;
  const session = await resolveAppSession();
  const data = await observeServerFlow(
    {
      flow: "catalog.home.load",
      route: "/app/catalog",
      screen: "/app/catalog",
      workflow: "catalog",
      tenantId: session.tenant.id,
      userId: session.user.id,
      expectedResult: "Load the offering and catalog workbench for the active tenant.",
    },
    () => getCatalogHomeData(session.tenant.id),
  );

  return <CatalogPage data={data} query={q} typeFilter={type ?? ""} sort={sort ?? "family"} />;
}
