import { AutomationTriggerType, BookingStatus, CustomerStatus } from "@prisma/client";
import { addMinutes, eachDayOfInterval, endOfDay, isBefore, setHours, setMinutes, startOfDay } from "date-fns";

import { runAutomationsForEvent } from "@/modules/automation/server/engine";
import { prisma } from "@/shared/server/prisma";

function buildSlots(startHour: number, endHour: number, durationMinutes: number, bufferMinutes: number, day: Date) {
  const slots: Date[] = [];
  let cursor = setMinutes(setHours(new Date(day), startHour), 0);
  const end = setMinutes(setHours(new Date(day), endHour), 0);

  while (isBefore(addMinutes(cursor, durationMinutes), addMinutes(end, 1))) {
    slots.push(cursor);
    cursor = addMinutes(cursor, durationMinutes + bufferMinutes);
  }

  return slots;
}

function isSlotTaken(slot: Date, bookings: Array<{ startsAt: Date; endsAt: Date }>, durationMinutes: number) {
  const slotEnd = addMinutes(slot, durationMinutes);
  return bookings.some((booking) => slot < booking.endsAt && slotEnd > booking.startsAt);
}

export async function getScheduleData(tenantId: string) {
  const [bookingTypes, bookings, serviceOfferings, contacts, organizations] = await Promise.all([
    prisma.bookingType.findMany({
      where: { tenantId },
      include: { intakeForm: true, offering: true, offeringVariant: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      where: { tenantId },
      include: { bookingType: true, contact: true, organization: true, offering: true, offeringVariant: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.offering.findMany({
      where: { tenantId, type: "SERVICE", status: "ACTIVE", archivedAt: null },
      include: {
        variants: {
          where: { active: true },
          include: {
            prices: {
              where: { active: true },
              orderBy: [{ isDefault: "desc" }, { version: "desc" }],
            },
          },
          orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
        },
        routeBindings: {
          include: { bookingType: true, intakeForm: true },
        },
      },
      orderBy: [{ family: "asc" }, { name: "asc" }],
    }),
    prisma.contact.findMany({
      where: { tenantId, archivedAt: null },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.organization.findMany({
      where: { tenantId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { bookingTypes, bookings, serviceOfferings, contacts, organizations };
}

export async function getPublicBookingData(tenantSlug: string, bookingTypeSlug: string) {
  const bookingType = await prisma.bookingType.findFirstOrThrow({
    where: {
      slug: bookingTypeSlug,
      tenant: { slug: tenantSlug },
    },
    include: {
      tenant: true,
      intakeForm: true,
      bookings: true,
      offering: true,
      offeringVariant: true,
    },
  });

  const availability = bookingType.availabilityJson as {
    weekdays: number[];
    startHour: number;
    endHour: number;
  };
  const days = eachDayOfInterval({
    start: startOfDay(new Date()),
    end: endOfDay(addMinutes(new Date(), 60 * 24 * 7)),
  });

  const slots = days
    .filter((day) => availability.weekdays.includes(day.getDay()))
    .flatMap((day) =>
      buildSlots(
        availability.startHour,
        availability.endHour,
        bookingType.durationMinutes,
        bookingType.bufferMinutes,
        day,
      ),
    )
    .filter((slot) => slot > new Date())
    .filter((slot) => !isSlotTaken(slot, bookingType.bookings, bookingType.durationMinutes))
    .slice(0, 12);

  return { bookingType, tenant: bookingType.tenant, slots };
}

async function ensureBookingCustomerLink(input: {
  tenantId: string;
  contactId?: string;
  organizationId?: string;
  offeringId?: string | null;
  offeringVariantId?: string | null;
}) {
  if (!input.offeringId || (!input.contactId && !input.organizationId)) {
    return null;
  }

  const existing = await prisma.customerOfferingLink.findFirst({
    where: {
      tenantId: input.tenantId,
      contactId: input.contactId,
      organizationId: input.organizationId,
      offeringId: input.offeringId,
      variantId: input.offeringVariantId ?? null,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return prisma.customerOfferingLink.update({
      where: { id: existing.id },
      data: {
        status: "BOOKED",
        lastActivityAt: new Date(),
        activatedAt: existing.activatedAt ?? new Date(),
      },
    });
  }

  return prisma.customerOfferingLink.create({
    data: {
      id: `cust_offer_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      contactId: input.contactId,
      organizationId: input.organizationId,
      offeringId: input.offeringId,
      variantId: input.offeringVariantId ?? undefined,
      sourceType: "BOOKING",
      status: "BOOKED",
      activatedAt: new Date(),
      lastActivityAt: new Date(),
    },
  });
}

export async function createBooking(input: {
  bookingTypeId: string;
  tenantId: string;
  startsAt: string;
  notes: string;
  contactId?: string;
  organizationId?: string;
  offeringId?: string;
  offeringVariantId?: string;
  name?: string;
  email?: string;
  answers?: Record<string, string>;
}) {
  const bookingType = await prisma.bookingType.findFirstOrThrow({
    where: { id: input.bookingTypeId, tenantId: input.tenantId },
    include: { intakeForm: true },
  });

  let contactId = input.contactId;
  if (!contactId && input.name && input.email) {
    const ownerMembership = await prisma.membership.findFirst({
      where: { tenantId: input.tenantId, role: "OWNER" },
      orderBy: { createdAt: "asc" },
    });
    const [firstName, ...rest] = input.name.trim().split(" ");
    const contact = await prisma.contact.create({
      data: {
        id: `contact_${crypto.randomUUID()}`,
        tenantId: input.tenantId,
        firstName,
        lastName: rest.join(" ") || "Client",
        displayName: input.name,
        email: input.email,
        phone: "",
        title: "Client",
        city: "",
        status: CustomerStatus.PROSPECT,
        segment: "Public booking",
        lifecycleStage: "booked",
        ownerUserId: ownerMembership?.userId ?? "",
        summary: "Created from public booking flow.",
        tags: ["booking"],
        customFields: {},
      },
    });
    contactId = contact.id;
  }

  const customerOfferingLink = await ensureBookingCustomerLink({
    tenantId: input.tenantId,
    contactId,
    organizationId: input.organizationId,
    offeringId: input.offeringId ?? bookingType.offeringId,
    offeringVariantId: input.offeringVariantId ?? bookingType.offeringVariantId,
  });

  const startsAt = new Date(input.startsAt);
  const booking = await prisma.booking.create({
    data: {
      id: `book_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      bookingTypeId: bookingType.id,
      contactId,
      organizationId: input.organizationId,
      customerOfferingLinkId: customerOfferingLink?.id,
      offeringId: input.offeringId ?? bookingType.offeringId,
      offeringVariantId: input.offeringVariantId ?? bookingType.offeringVariantId,
      status: BookingStatus.SCHEDULED,
      startsAt,
      endsAt: addMinutes(startsAt, bookingType.durationMinutes),
      notes: input.notes,
    },
  });

  if (bookingType.intakeFormId && input.answers) {
    await prisma.intakeSubmission.create({
      data: {
        id: `intake_${crypto.randomUUID()}`,
        tenantId: input.tenantId,
        intakeFormId: bookingType.intakeFormId,
        bookingId: booking.id,
        contactId,
        answers: input.answers,
      },
    });
  }

  await prisma.activity.create({
    data: {
      id: `activity_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      contactId,
      organizationId: input.organizationId,
      bookingId: booking.id,
      kind: "BOOKING",
      title: `${bookingType.name} booked`,
      detail: input.notes,
      actorLabel: "System",
      metadata: { bookingTypeId: bookingType.id, offeringId: bookingType.offeringId, offeringVariantId: bookingType.offeringVariantId },
    },
  });

  await runAutomationsForEvent(
    {
      tenantId: input.tenantId,
      triggerType: AutomationTriggerType.BOOKING_CREATED,
      sourceType: "Booking",
      sourceId: booking.id,
      contactId,
      organizationId: input.organizationId,
      metadata: {
        bookingTypeId: bookingType.id,
        offeringId: input.offeringId ?? bookingType.offeringId,
        offeringVariantId: input.offeringVariantId ?? bookingType.offeringVariantId,
      },
    },
    "apply",
  );

  return booking;
}

export async function updateBooking(input: {
  tenantId: string;
  bookingId: string;
  status: "SCHEDULED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED";
  startsAt?: string;
}) {
  const booking = await prisma.booking.findFirstOrThrow({
    where: { tenantId: input.tenantId, id: input.bookingId },
    include: { bookingType: true },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: input.status,
      startsAt: input.startsAt ? new Date(input.startsAt) : booking.startsAt,
      endsAt: input.startsAt
        ? addMinutes(new Date(input.startsAt), booking.bookingType.durationMinutes)
        : booking.endsAt,
    },
  });
}
