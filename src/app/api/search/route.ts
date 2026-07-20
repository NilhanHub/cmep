import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { searchTenantEntities } from "@/modules/shell/server/queries";
import { searchSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await resolveAppSession();
  const url = new URL(request.url);
  const payload = {
    q: url.searchParams.get("q"),
  };
  const meta = {
    flow: "shell.globalSearch",
    route: "/api/search",
    endpoint: "/api/search",
    workflow: "shell",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Return tenant-scoped global search results.",
    inputSummary: payload,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      const parsed = searchSchema.parse(payload);
      const results = await searchTenantEntities(session.tenant.id, parsed.q);
      return NextResponse.json(results);
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
