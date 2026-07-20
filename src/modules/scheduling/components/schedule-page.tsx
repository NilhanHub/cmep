import { formatCurrency, formatDateTime } from "@/shared/domain/format";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import { BookingActions } from "./booking-actions";

type ScheduleData = Awaited<ReturnType<typeof import("../server/queries").getScheduleData>>;

export function SchedulePage({
  data,
  tenantSlug,
}: {
  data: ScheduleData;
  tenantSlug: string;
}) {
  return (
    <div className="app-grid">
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Scheduling & Intake</p>
        <h1 className="mt-1 text-3xl font-semibold">Public booking, intake capture, and reschedules in one place.</h1>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Calendar board</p>
              <p className="text-sm text-[var(--text-secondary)]">Upcoming bookings with reschedule and cancel controls.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.bookings.map((booking) => (
              <div key={booking.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{booking.offering?.name ?? booking.bookingType.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {booking.contact?.displayName ?? booking.organization?.name}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{booking.status}</p>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{formatDateTime(booking.startsAt)}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{booking.notes}</p>
                <div className="mt-3">
                  <BookingActions bookingId={booking.id} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div>
                <p className="text-lg font-semibold">Service offerings</p>
                <p className="text-sm text-[var(--text-secondary)]">Bookings now originate from explicit service offerings and route bindings.</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.serviceOfferings.map((offering) => {
                const route = offering.routeBindings[0];
                const variant = offering.variants[0];
                const price = variant?.prices[0] ?? offering.variants.flatMap((entry) => entry.prices)[0];

                return (
                  <div key={offering.id} className="rounded-md bg-[var(--panel-subtle)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{offering.name}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{offering.summary}</p>
                      </div>
                      <p className="text-sm font-medium">{price ? formatCurrency(price.amountCents) : "Add price"}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                      {offering.variants.map((entry) => (
                        <span key={entry.id} className="rounded-md bg-[var(--panel)] px-2 py-1">
                          {entry.displayLabel}
                        </span>
                      ))}
                    </div>
                    {route?.bookingType ? (
                      <a
                        href={`/book/${tenantSlug}/${route.bookingType.slug}`}
                        className="mt-3 inline-flex rounded-md bg-[var(--panel)] px-3 py-2 text-sm transition hover:bg-[var(--panel-strong)]"
                      >
                        Open public booking
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <p className="text-lg font-semibold">Create booking</p>
                <p className="text-sm text-[var(--text-secondary)]">Pick the service offering first, then place it on the calendar.</p>
              </div>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" action="/api/schedule/bookings" method="post">
                <Field label="Service offering">
                  <Select name="offeringId" data-testid="schedule-offering-select">
                    {data.serviceOfferings.map((offering) => (
                      <option key={offering.id} value={offering.id}>
                        {offering.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Booking type">
                  <Select name="bookingTypeId" data-testid="schedule-booking-type-select">
                    {data.bookingTypes.map((bookingType) => (
                      <option key={bookingType.id} value={bookingType.id}>
                        {bookingType.offering?.name ?? bookingType.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Contact">
                  <Select name="contactId" data-testid="schedule-contact-select">
                    <option value="">Pick later</option>
                    {data.contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.displayName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Organization">
                  <Select name="organizationId" data-testid="schedule-organization-select">
                    <option value="">Optional organization</option>
                    {data.organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Starts at">
                  <Input name="startsAt" type="datetime-local" required />
                </Field>
                <Field label="Notes">
                  <Textarea name="notes" required />
                </Field>
                <Button type="submit" data-testid="create-booking-submit">
                  Create booking
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <p className="text-lg font-semibold">Public booking pages</p>
                <p className="text-sm text-[var(--text-secondary)]">Tenant-scoped shareable local routes.</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.bookingTypes.map((bookingType) => (
                <a
                  key={bookingType.id}
                  href={`/book/${tenantSlug}/${bookingType.slug}`}
                  className="rounded-md bg-[var(--panel-subtle)] p-3 transition hover:bg-[var(--panel-strong)]"
                >
                  <p className="font-medium">{bookingType.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{bookingType.description}</p>
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
