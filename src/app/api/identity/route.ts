import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { personaCookieName } from "@/shared/domain/constants";
import { identitySchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json();
  const meta = {
    flow: "identity.persona.switch",
    route: "/api/identity",
    endpoint: "/api/identity",
    workflow: "identity",
    expectedResult: "Switch the active tenant and persona cookie.",
    inputSummary: payload,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      const parsed = identitySchema.parse(payload);
      const cookieStore = await cookies();

      cookieStore.set(personaCookieName, `${parsed.tenantId}:${parsed.userId}`, {
        path: "/",
        sameSite: "lax",
      });

      return NextResponse.json({ ok: true });
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
