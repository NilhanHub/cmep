import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { decideQuote } from "@/modules/revenue/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { assertPortalQuoteAccess } from "@/modules/portal/server/queries";
import { portalCookieName } from "@/shared/domain/constants";
import { AccessDeniedError } from "@/shared/observability/errors";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await resolveAppSession().catch(() => null);
  const { id } = await context.params;
  const payload = (await request.json()) as {
    decision: "APPROVED" | "REJECTED";
    tenantId?: string;
    scope?: "app" | "portal";
  };
  const accessKey = (await cookies()).get(portalCookieName)?.value ?? null;
  const meta = {
    flow: "revenue.quote.decision",
    route: `/api/revenue/quotes/${id}/decision`,
    endpoint: "/api/revenue/quotes/[id]/decision",
    workflow: "revenue",
    tenantId: payload.tenantId ?? session?.tenant.id ?? null,
    userId: session?.user.id ?? null,
    portalAccessKey: accessKey,
    expectedResult: "Approve or reject a quote inside the active app or portal scope.",
    inputSummary: payload,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      if (payload.scope === "portal") {
        if (!accessKey) {
          throw new AccessDeniedError("No active portal access is available.");
        }

        const { currentAccess } = await assertPortalQuoteAccess(accessKey, id);
        await decideQuote({
          tenantId: currentAccess.tenantId,
          quoteId: id,
          decision: payload.decision,
        });
        return NextResponse.json({ ok: true, mode: "portal" });
      }

      if (!session) {
        throw new AccessDeniedError("No active application session.");
      }

      await decideQuote({
        tenantId: session.tenant.id,
        quoteId: id,
        decision: payload.decision,
      });

      return NextResponse.json({ ok: true, mode: "app" });
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
