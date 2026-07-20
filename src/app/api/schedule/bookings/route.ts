import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { createBooking } from "@/modules/scheduling/server/queries";
import { bookingCreateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";
import { prisma } from "@/shared/server/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const raw =
    contentType.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());

  const session = await resolveAppSession().catch(() => null);
  const meta = {
    flow: "schedule.booking.create",
    route: "/api/schedule/bookings",
    endpoint: "/api/schedule/bookings",
    workflow: "scheduling",
    tenantId: null,
    userId: session?.user.id ?? null,
    expectedResult: "Create a booking inside the active tenant or public booking scope.",
    inputSummary: raw,
  };

  try {
    const payload = bookingCreateSchema.parse(raw);
    const tenantId = payload.tenantId ?? session?.tenant.id;

    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
    }

    const beforeCount = await prisma.booking.count({ where: { tenantId } });

    return await observeRouteRequest(request, { ...meta, tenantId, stateBefore: { bookingCount: beforeCount } }, async () => {
      const booking = await createBooking({
        bookingTypeId: payload.bookingTypeId,
        tenantId,
        startsAt: payload.startsAt,
        notes: payload.notes,
        contactId: payload.contactId,
        organizationId: payload.organizationId,
        offeringId: payload.offeringId ?? undefined,
        offeringVariantId: payload.offeringVariantId ?? undefined,
        name: payload.name,
        email: payload.email || undefined,
        answers: payload.answers,
      });

      return contentType.includes("application/json")
        ? NextResponse.json({ id: booking.id })
        : NextResponse.redirect(new URL("/app/schedule", request.url));
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
