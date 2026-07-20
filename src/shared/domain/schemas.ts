import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().optional(),
);

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().optional());

const optionalInterval = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).optional(),
);

export const identitySchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
});

export const portalAccessSchema = z.object({
  accessKey: z.string().min(1),
});

export const customerCreateSchema = z.object({
  kind: z.enum(["contact", "organization"]),
  name: z.string().min(2),
  email: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().email().optional(),
  ),
  phone: optionalString,
  company: optionalString,
  segment: z.string().min(2),
  status: z.enum(["ACTIVE", "PROSPECT", "AT_RISK", "ARCHIVED"]),
  notes: z.string().min(3),
});

export const customerUpdateSchema = z.object({
  name: z.string().min(2),
  segment: z.string().min(2),
  lifecycleStage: z.string().min(2),
  notes: z.string().min(3),
  tags: z.string().optional(),
});

export const messageCreateSchema = z.object({
  body: z.string().min(1),
  isInternalNote: z.coerce.boolean().default(false),
  cannedReplyId: optionalString,
});

export const lifecycleMoveSchema = z.object({
  stageId: z.string().min(1),
});

export const automationSimulateSchema = z.object({
  triggerType: z.enum([
    "STAGE_CHANGED",
    "MESSAGE_RECEIVED",
    "NO_REPLY_DAYS",
    "BOOKING_CREATED",
    "INVOICE_OVERDUE",
    "QUOTE_APPROVED",
    "OFFERING_REQUESTED",
    "QUOTE_CREATED_FOR_OFFERING",
    "QUOTE_APPROVED_FOR_OFFERING",
    "CUSTOMER_OFFERING_STATUS_CHANGED",
  ]),
  sourceId: z.string().min(1),
  sourceType: z.string().min(1),
  mode: z.enum(["simulate", "apply"]).default("simulate"),
});

export const lifecycleCreateSchema = z.object({
  templateId: z.string().min(1),
  title: z.string().min(2),
  contactId: optionalString,
  organizationId: optionalString,
  offeringId: optionalString,
  offeringVariantId: optionalString,
});

export const bookingCreateSchema = z.object({
  bookingTypeId: z.string().min(1),
  tenantId: optionalString,
  contactId: optionalString,
  organizationId: optionalString,
  offeringId: optionalString,
  offeringVariantId: optionalString,
  startsAt: z.string().min(1),
  notes: z.string().min(3),
  name: optionalString,
  email: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().email().optional(),
  ),
  answers: z.record(z.string(), z.string()).optional(),
});

export const bookingUpdateSchema = z.object({
  status: z.enum(["SCHEDULED", "RESCHEDULED", "CANCELLED", "COMPLETED"]),
  startsAt: optionalString,
});

export const quoteCreateSchema = z.object({
  contactId: optionalString,
  organizationId: optionalString,
  notes: z.string().min(3),
  reference: z.string().min(2),
  offeringPriceId: optionalString,
  quantity: optionalNumber,
  isAdHoc: z.coerce.boolean().default(false),
  adHocDescription: optionalString,
  adHocUnitPriceCents: optionalNumber,
});

export const invoicePaymentSchema = z.object({
  markPaid: z.coerce.boolean(),
});

export const invoiceCreateSchema = z.object({
  contactId: optionalString,
  organizationId: optionalString,
  notes: z.string().min(3),
  reference: z.string().min(2),
  offeringPriceId: optionalString,
  quantity: optionalNumber,
  isAdHoc: z.coerce.boolean().default(false),
  adHocDescription: optionalString,
  adHocUnitPriceCents: optionalNumber,
});

export const offeringCreateSchema = z.object({
  type: z.enum(["PRODUCT", "SERVICE", "BUNDLE"]),
  name: z.string().min(2),
  code: z.string().min(2),
  family: z.string().min(2),
  category: z.string().min(2),
  summary: z.string().min(3),
  description: z.string().min(3),
  unitLabel: optionalString,
  variantCode: optionalString,
  variantName: optionalString,
  variantLabel: optionalString,
  priceName: optionalString,
  priceAmountCents: optionalNumber,
  billingModel: z.enum(["ONE_TIME", "RECURRING", "TIERED_SIMPLE", "NEGOTIATED_OVERRIDE_SUPPORT"]).default("ONE_TIME"),
  interval: optionalInterval,
});

export const offeringVariantCreateSchema = z.object({
  offeringId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(2),
  displayLabel: z.string().min(2),
  optionName: optionalString,
  optionValue: optionalString,
  serviceDurationMinutes: optionalNumber,
});

export const offeringPriceCreateSchema = z.object({
  offeringId: z.string().min(1),
  variantId: optionalString,
  name: z.string().min(2),
  amountCents: z.coerce.number().int().nonnegative(),
  billingModel: z.enum(["ONE_TIME", "RECURRING", "TIERED_SIMPLE", "NEGOTIATED_OVERRIDE_SUPPORT"]).default("ONE_TIME"),
  interval: optionalInterval,
  intervalCount: optionalNumber,
});

export const catalogAssignmentCreateSchema = z.object({
  catalogId: z.string().min(1),
  contactId: optionalString,
  organizationId: optionalString,
  segment: optionalString,
  portalVisible: z.coerce.boolean().default(true),
});

export const searchSchema = z.object({
  q: z.string().min(1),
});
