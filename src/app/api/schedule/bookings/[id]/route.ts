import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { updateBooking } from "@/modules/scheduling/server/queries";
import { bookingUpdateSchema } from "@/shared/domain/schemas";
import { handleObservedRouteError, observeRouteRequest } from "@/shared/observability/server";
import { prisma } from "@/shared/server/prisma";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await resolveAppSession();
  const { id } = await context.params;
  const payload = await request.json();
  const meta = {
    flow: "schedule.booking.update",
    route: `/api/schedule/bookings/${id}`,
    endpoint: "/api/schedule/bookings/[id]",
    workflow: "scheduling",
    tenantId: session.tenant.id,
    userId: session.user.id,
    expectedResult: "Reschedule or cancel a booking in the active tenant.",
    inputSummary: payload,
  };

  try {
    const before = await prisma.booking.findFirst({
      where: { tenantId: session.tenant.id, id },
      select: { status: true, startsAt: true, endsAt: true },
    });

    return await observeRouteRequest(request, { ...meta, stateBefore: before }, async () => {
      const parsed = bookingUpdateSchema.parse(payload);

      await updateBooking({
        tenantId: session.tenant.id,
        bookingId: id,
        status: parsed.status,
        startsAt: parsed.startsAt,
      });

      return NextResponse.json({ ok: true });
    });
  } catch (error) {
    return handleObservedRouteError(error, meta);
  }
}
