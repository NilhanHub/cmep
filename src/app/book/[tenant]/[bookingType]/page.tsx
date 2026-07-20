import { formatDateTime } from "@/shared/domain/format";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { PublicBookingForm } from "@/modules/scheduling/components/public-booking-form";
import { getPublicBookingData } from "@/modules/scheduling/server/queries";

type IntakeQuestion = { id: string; label: string };

export default async function PublicBookingRoute({
  params,
}: {
  params: Promise<{ tenant: string; bookingType: string }>;
}) {
  const { tenant, bookingType } = await params;
  const data = await getPublicBookingData(tenant, bookingType);
  const questions = Array.isArray(data.bookingType.intakeForm?.questions)
    ? (data.bookingType.intakeForm?.questions as Array<Record<string, unknown>>)
        .filter((question) => typeof question.id === "string" && typeof question.label === "string")
        .map(
          (question): IntakeQuestion => ({
            id: String(question.id),
            label: String(question.label),
          }),
        )
    : [];

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl gap-6 px-4 py-8 md:grid-cols-[1fr_0.9fr] md:px-8">
      <Card className="overflow-hidden">
        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${data.tenant.coverImagePath ?? ""})` }} />
        <CardHeader>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">{data.tenant.name}</p>
            <h1 className="mt-1 text-3xl font-semibold">{data.bookingType.offering?.name ?? data.bookingType.name}</h1>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-[var(--text-secondary)]">{data.bookingType.description}</p>
          {data.bookingType.offering ? (
            <div className="grid gap-2 rounded-md bg-[var(--panel-subtle)] p-4">
              <p className="text-sm font-medium">Service route</p>
              <p className="text-sm text-[var(--text-secondary)]">{data.bookingType.offering.summary}</p>
            </div>
          ) : null}
          <div className="grid gap-2 rounded-md bg-[var(--panel-subtle)] p-4">
            <p className="text-sm font-medium">What to expect</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {data.bookingType.durationMinutes} minutes with {data.bookingType.bufferMinutes}-minute buffers.
            </p>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Next openings</p>
            {data.slots.slice(0, 4).map((slot) => (
              <div key={slot.toISOString()} className="rounded-md bg-[var(--panel-subtle)] px-3 py-2 text-sm">
                {formatDateTime(slot)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <p className="text-lg font-semibold">Book locally</p>
            <p className="text-sm text-[var(--text-secondary)]">This flow writes directly into the local demo tenant.</p>
          </div>
        </CardHeader>
        <CardContent>
          <PublicBookingForm
            tenantId={data.tenant.id}
            bookingTypeId={data.bookingType.id}
            slotOptions={data.slots.map((slot) => ({ value: slot.toISOString(), label: formatDateTime(slot) }))}
            questionIds={questions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
