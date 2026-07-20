import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/shared/server/prisma";

import { portalCookieName } from "@/shared/domain/constants";
import { portalAccessSchema } from "@/shared/domain/schemas";
import { AccessDeniedError } from "@/shared/observability/errors";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = {
    accessKey: formData.get("accessKey"),
  };
  const meta = {
    flow: "portal.access.switch",
    route: "/api/portal/access",
    endpoint: "/api/portal/access",
    workflow: "portal",
    expectedResult: "Switch the active client portal access cookie.",
    inputSummary: payload,
  };

  try {
    return await observeRouteRequest(request, meta, async () => {
      const parsed = portalAccessSchema.parse(payload);
      const access = await prisma.portalAccess.findFirst({
        where: { accessKey: parsed.accessKey, active: true },
      });

      if (!access) {
        throw new AccessDeniedError("Portal access key is not active.");
      }

      const cookieStore = await cookies();

      cookieStore.set(portalCookieName, parsed.accessKey, {
        path: "/",
        sameSite: "lax",
      });

      return NextResponse.redirect(new URL("/client", request.url));
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
