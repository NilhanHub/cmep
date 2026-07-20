import {
  ActivityKind,
  AutomationRunStatus,
  AutomationTriggerType,
  BillingCadence,
  BookingStatus,
  ConversationChannel,
  ConversationPriority,
  ConversationStatus,
  CustomerStatus,
  InvoiceStatus,
  LifecycleItemStatus,
  LifecycleStageKind,
  MembershipRole,
  MessageAuthorType,
  NotificationKind,
  PrismaClient,
  QuoteStatus,
  RecurringAgreementStatus,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";
import { addDays, addHours, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import { backfillOfferingSpine, seedOfferingSpine } from "./seed-offering-spine";

const prisma = new PrismaClient();

const dayAt = (offset: number, hour: number, minute = 0) =>
  setMinutes(setHours(addDays(startOfDay(new Date()), offset), hour), minute);

const daysAgo = (days: number, hour: number, minute = 0) =>
  setMinutes(setHours(subDays(startOfDay(new Date()), days), hour), minute);

async function main() {
  await prisma.$transaction([
    prisma.attachment.deleteMany(),
    prisma.message.deleteMany(),
    prisma.note.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.task.deleteMany(),
    prisma.automationRun.deleteMany(),
    prisma.automationRule.deleteMany(),
    prisma.quoteLineItem.deleteMany(),
    prisma.quote.deleteMany(),
    prisma.invoiceLineItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.recurringAgreement.deleteMany(),
    prisma.intakeSubmission.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.customerOfferingLink.deleteMany(),
    prisma.bookingType.deleteMany(),
    prisma.offeringRouteBinding.deleteMany(),
    prisma.intakeForm.deleteMany(),
    prisma.lifecycleItem.deleteMany(),
    prisma.pipelineStage.deleteMany(),
    prisma.pipelineTemplate.deleteMany(),
    prisma.offeringBundleItem.deleteMany(),
    prisma.catalogAssignment.deleteMany(),
    prisma.catalogItem.deleteMany(),
    prisma.catalog.deleteMany(),
    prisma.offeringMedia.deleteMany(),
    prisma.offeringPrice.deleteMany(),
    prisma.offeringVariant.deleteMany(),
    prisma.offering.deleteMany(),
    prisma.cannedReply.deleteMany(),
    prisma.portalAccess.deleteMany(),
    prisma.fileAsset.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);

  await prisma.tenant.createMany({
    data: [
      {
        id: "tenant_northstar",
        slug: "northstar-studio",
        name: "Northstar Studio",
        description: "Service-led production and experience studio.",
        vibe: "warm coral + electric teal",
        primaryColor: "#F25D50",
        accentColor: "#2EC5B6",
        gradientFrom: "#FFF0EA",
        gradientTo: "#E3FFF8",
        coverImagePath: "/tenant-covers/northstar-studio.png",
      },
      {
        id: "tenant_signal",
        slug: "signal-goods",
        name: "Signal Goods",
        description: "Product-led operations for wholesale and DTC gear.",
        vibe: "amber + slate + mint",
        primaryColor: "#F97B22",
        accentColor: "#3AC2A2",
        gradientFrom: "#FFF3E6",
        gradientTo: "#EEFDF8",
        coverImagePath: "/tenant-covers/signal-goods.png",
      },
    ],
  });

  await prisma.user.createMany({
    data: [
      { id: "user_iris", name: "Iris Navarro", email: "iris@northstar.local", initials: "IN", avatarTone: "#F25D50" },
      { id: "user_milo", name: "Milo Grant", email: "milo@northstar.local", initials: "MG", avatarTone: "#2EC5B6" },
      { id: "user_ava", name: "Ava Hughes", email: "ava@bluebirdwellness.local", initials: "AH", avatarTone: "#845EC2" },
      { id: "user_cora", name: "Cora Sethi", email: "cora@signal.local", initials: "CS", avatarTone: "#F97B22" },
      { id: "user_harper", name: "Harper Lowe", email: "harper@signal.local", initials: "HL", avatarTone: "#3AC2A2" },
      { id: "user_joel", name: "Joel Hart", email: "joel@signal.local", initials: "JH", avatarTone: "#4E6E81" },
      { id: "user_zoe", name: "Zoe Chang", email: "zoe@peakfit.local", initials: "ZC", avatarTone: "#FF6F91" },
    ],
  });

  await prisma.membership.createMany({
    data: [
      { id: "membership_northstar_owner", tenantId: "tenant_northstar", userId: "user_iris", role: MembershipRole.OWNER, title: "Founder" },
      { id: "membership_northstar_staff", tenantId: "tenant_northstar", userId: "user_milo", role: MembershipRole.STAFF, title: "Producer" },
      { id: "membership_northstar_client", tenantId: "tenant_northstar", userId: "user_ava", role: MembershipRole.CLIENT, title: "Client" },
      { id: "membership_signal_owner", tenantId: "tenant_signal", userId: "user_cora", role: MembershipRole.OWNER, title: "Managing Director" },
      { id: "membership_signal_admin", tenantId: "tenant_signal", userId: "user_harper", role: MembershipRole.ADMIN, title: "Operations Lead" },
      { id: "membership_signal_staff", tenantId: "tenant_signal", userId: "user_joel", role: MembershipRole.STAFF, title: "Account Manager" },
      { id: "membership_signal_client", tenantId: "tenant_signal", userId: "user_zoe", role: MembershipRole.CLIENT, title: "Client" },
    ],
  });

  await prisma.organization.createMany({
    data: [
      {
        id: "org_bluebird",
        tenantId: "tenant_northstar",
        name: "Bluebird Wellness",
        industry: "Hospitality",
        website: "https://bluebirdwellness.local",
        city: "Austin",
        status: CustomerStatus.ACTIVE,
        segment: "VIP retreat brand",
        lifecycleStage: "proposal",
        ownerUserId: "user_iris",
        summary: "Retreat brand expanding premium event launches and partner content.",
        tags: ["VIP", "retainer", "wellness"],
        customFields: { region: "South", retainerTier: "Signature" },
      },
      {
        id: "org_summercove",
        tenantId: "tenant_northstar",
        name: "Summercove Events",
        industry: "Events",
        website: "https://summercove.local",
        city: "Nashville",
        status: CustomerStatus.PROSPECT,
        segment: "Seasonal activations",
        lifecycleStage: "qualified",
        ownerUserId: "user_milo",
        summary: "Corporate retreat planners evaluating production support packages.",
        tags: ["seasonal", "proposal"],
        customFields: { eventSize: "250-500", decisionMaker: "VP Marketing" },
      },
      {
        id: "org_peakfit",
        tenantId: "tenant_signal",
        name: "Peakfit Collective",
        industry: "Retail",
        website: "https://peakfit.local",
        city: "Portland",
        status: CustomerStatus.ACTIVE,
        segment: "Wholesale gym chain",
        lifecycleStage: "booked",
        ownerUserId: "user_harper",
        summary: "Regional retail chain onboarding new replenishment and demo workflows.",
        tags: ["wholesale", "high-value"],
        customFields: { skuCount: 48, renewalMonth: "July" },
      },
      {
        id: "org_horizon",
        tenantId: "tenant_signal",
        name: "Horizon Supply",
        industry: "Distribution",
        website: "https://horizon.local",
        city: "Denver",
        status: CustomerStatus.AT_RISK,
        segment: "Returns-heavy account",
        lifecycleStage: "working",
        ownerUserId: "user_joel",
        summary: "Distribution account with open QA issue backlog and invoice aging.",
        tags: ["at-risk", "returns"],
        customFields: { returnRate: "7.2%", warehouse: "DEN-03" },
      },
    ],
  });

  await prisma.contact.createMany({
    data: [
      {
        id: "contact_ava",
        tenantId: "tenant_northstar",
        organizationId: "org_bluebird",
        firstName: "Ava",
        lastName: "Hughes",
        displayName: "Ava Hughes",
        email: "ava@bluebirdwellness.local",
        phone: "+1 555 0199",
        title: "Brand Director",
        city: "Austin",
        status: CustomerStatus.ACTIVE,
        segment: "Primary sponsor",
        lifecycleStage: "proposal",
        ownerUserId: "user_iris",
        summary: "Fast-moving decision maker who prefers concise updates and options.",
        tags: ["vip", "responsive"],
        customFields: { preferredChannel: "email", contractTerm: "6 months" },
      },
      {
        id: "contact_leo",
        tenantId: "tenant_northstar",
        organizationId: "org_summercove",
        firstName: "Leo",
        lastName: "Grant",
        displayName: "Leo Grant",
        email: "leo@summercove.local",
        phone: "+1 555 0183",
        title: "Head of Events",
        city: "Nashville",
        status: CustomerStatus.PROSPECT,
        segment: "Evaluator",
        lifecycleStage: "qualified",
        ownerUserId: "user_milo",
        summary: "Evaluating event operations support for Q3 offsites.",
        tags: ["proposal", "event"],
        customFields: { referralSource: "Partner intro", eventBudgetBand: "$25k-$50k" },
      },
      {
        id: "contact_maya",
        tenantId: "tenant_northstar",
        firstName: "Maya",
        lastName: "Rivera",
        displayName: "Maya Rivera",
        email: "maya@privatecollector.local",
        phone: "+1 555 0177",
        title: "Collector",
        city: "Miami",
        status: CustomerStatus.AT_RISK,
        segment: "One-off premium",
        lifecycleStage: "waiting",
        ownerUserId: "user_iris",
        summary: "Waiting for final sign-off on gallery install delivery window.",
        tags: ["follow-up"],
        customFields: { urgency: "medium" },
      },
      {
        id: "contact_zoe",
        tenantId: "tenant_signal",
        organizationId: "org_peakfit",
        firstName: "Zoe",
        lastName: "Chang",
        displayName: "Zoe Chang",
        email: "zoe@peakfit.local",
        phone: "+1 555 0211",
        title: "Director of Merchandising",
        city: "Portland",
        status: CustomerStatus.ACTIVE,
        segment: "Expansion account",
        lifecycleStage: "booked",
        ownerUserId: "user_harper",
        summary: "Scaling replenishment program across 12 stores.",
        tags: ["wholesale", "renewal"],
        customFields: { storeCount: 12, launchWave: "Wave 2" },
      },
      {
        id: "contact_noah",
        tenantId: "tenant_signal",
        organizationId: "org_horizon",
        firstName: "Noah",
        lastName: "Lane",
        displayName: "Noah Lane",
        email: "noah@horizon.local",
        phone: "+1 555 0228",
        title: "Ops Director",
        city: "Denver",
        status: CustomerStatus.AT_RISK,
        segment: "Recovery",
        lifecycleStage: "working",
        ownerUserId: "user_joel",
        summary: "Needs tighter SLA coverage and invoice cleanup.",
        tags: ["at-risk", "finance"],
        customFields: { escalationTier: "T2" },
      },
      {
        id: "contact_priya",
        tenantId: "tenant_signal",
        firstName: "Priya",
        lastName: "Singh",
        displayName: "Priya Singh",
        email: "priya@urbanloop.local",
        phone: "+1 555 0233",
        title: "Founder",
        city: "Seattle",
        status: CustomerStatus.PROSPECT,
        segment: "DTC",
        lifecycleStage: "lead",
        ownerUserId: "user_cora",
        summary: "Considering a lightweight pilot for bundle merchandising.",
        tags: ["pilot"],
        customFields: { source: "Trade show", velocity: "fast" },
      },
    ],
  });

  await prisma.portalAccess.createMany({
    data: [
      { id: "portal_ava", tenantId: "tenant_northstar", contactId: "contact_ava", organizationId: "org_bluebird", accessKey: "northstar-ava", label: "Ava Hughes portal" },
      { id: "portal_zoe", tenantId: "tenant_signal", contactId: "contact_zoe", organizationId: "org_peakfit", accessKey: "signal-zoe", label: "Zoe Chang portal" },
    ],
  });

  await prisma.cannedReply.createMany({
    data: [
      { id: "reply_northstar_eta", tenantId: "tenant_northstar", title: "ETA update", category: "status", body: "Thanks for the note. We are on track and will send the next checkpoint with options before close of day." },
      { id: "reply_northstar_booking", tenantId: "tenant_northstar", title: "Booking confirmed", category: "schedule", body: "Confirmed. We have locked the slot and added the intake prompts so we can move quickly on prep." },
      { id: "reply_signal_restock", tenantId: "tenant_signal", title: "Restock next steps", category: "sales", body: "Thanks. I have flagged the replenishment request and can confirm the staged rollout once the final count lands." },
      { id: "reply_signal_invoice", tenantId: "tenant_signal", title: "Invoice follow-up", category: "finance", body: "Received. I have logged the finance follow-up and will update the account thread once payment timing is confirmed." },
    ],
  });

  await prisma.intakeForm.createMany({
    data: [
      {
        id: "form_northstar_strategy",
        tenantId: "tenant_northstar",
        name: "Strategy session intake",
        questions: [
          { id: "goals", label: "Primary goal", type: "textarea" },
          { id: "stakeholders", label: "Stakeholders", type: "text" },
          { id: "deliveryDate", label: "Target delivery window", type: "text" },
        ],
      },
      {
        id: "form_signal_demo",
        tenantId: "tenant_signal",
        name: "Demo call intake",
        questions: [
          { id: "skuFocus", label: "SKUs to focus on", type: "text" },
          { id: "locations", label: "Store locations", type: "textarea" },
          { id: "launchDate", label: "Preferred launch date", type: "text" },
        ],
      },
    ],
  });

  await prisma.bookingType.createMany({
    data: [
      {
        id: "booking_northstar_strategy",
        tenantId: "tenant_northstar",
        intakeFormId: "form_northstar_strategy",
        slug: "strategy-session",
        name: "Strategy Session",
        description: "Plan launch milestones, creative scope, and approvals.",
        durationMinutes: 60,
        bufferMinutes: 15,
        availabilityJson: { weekdays: [1, 2, 3, 4], startHour: 9, endHour: 16 },
      },
      {
        id: "booking_northstar_shoot",
        tenantId: "tenant_northstar",
        intakeFormId: "form_northstar_strategy",
        slug: "on-site-shoot",
        name: "On-site Shoot",
        description: "Production slot for capture day and on-location coordination.",
        durationMinutes: 120,
        bufferMinutes: 30,
        availabilityJson: { weekdays: [2, 4], startHour: 10, endHour: 15 },
      },
      {
        id: "booking_signal_demo",
        tenantId: "tenant_signal",
        intakeFormId: "form_signal_demo",
        slug: "demo-call",
        name: "Demo Call",
        description: "Review assortment, onboarding milestones, and merchandising plan.",
        durationMinutes: 45,
        bufferMinutes: 15,
        availabilityJson: { weekdays: [1, 2, 3, 4, 5], startHour: 8, endHour: 17 },
      },
      {
        id: "booking_signal_onboarding",
        tenantId: "tenant_signal",
        intakeFormId: "form_signal_demo",
        slug: "onboarding-lab",
        name: "Onboarding Lab",
        description: "Hands-on working session for account launch and training.",
        durationMinutes: 90,
        bufferMinutes: 30,
        availabilityJson: { weekdays: [2, 3, 4], startHour: 9, endHour: 15 },
      },
    ],
  });

  await seedOfferingSpine(prisma, { dayAt, daysAgo });

  await prisma.pipelineTemplate.createMany({
    data: [
      { id: "template_northstar_sales", tenantId: "tenant_northstar", name: "Lead to close", category: "sales", description: "Lead -> qualified -> proposal -> won/lost", isDefault: true },
      { id: "template_northstar_service", tenantId: "tenant_northstar", name: "Service delivery", category: "service", description: "Inquiry -> booked -> in progress -> delivered -> follow-up", isDefault: false },
      { id: "template_northstar_issue", tenantId: "tenant_northstar", name: "Issue response", category: "issue", description: "Issue -> triage -> working -> waiting -> resolved", isDefault: false },
      { id: "template_signal_sales", tenantId: "tenant_signal", name: "Lead to close", category: "sales", description: "Lead -> qualified -> proposal -> won/lost", isDefault: true },
      { id: "template_signal_service", tenantId: "tenant_signal", name: "Service delivery", category: "service", description: "Inquiry -> booked -> in progress -> delivered -> follow-up", isDefault: false },
      { id: "template_signal_issue", tenantId: "tenant_signal", name: "Issue response", category: "issue", description: "Issue -> triage -> working -> waiting -> resolved", isDefault: false },
    ],
  });

  await prisma.pipelineStage.createMany({
    data: [
      { id: "stage_northstar_sales_lead", tenantId: "tenant_northstar", templateId: "template_northstar_sales", name: "Lead", order: 0, color: "#FFD166", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_sales_qualified", tenantId: "tenant_northstar", templateId: "template_northstar_sales", name: "Qualified", order: 1, color: "#F25D50", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_sales_proposal", tenantId: "tenant_northstar", templateId: "template_northstar_sales", name: "Proposal", order: 2, color: "#2EC5B6", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_sales_won", tenantId: "tenant_northstar", templateId: "template_northstar_sales", name: "Won", order: 3, color: "#3AC2A2", kind: LifecycleStageKind.WON },
      { id: "stage_northstar_sales_lost", tenantId: "tenant_northstar", templateId: "template_northstar_sales", name: "Lost", order: 4, color: "#6C757D", kind: LifecycleStageKind.LOST },
      { id: "stage_northstar_service_inquiry", tenantId: "tenant_northstar", templateId: "template_northstar_service", name: "Inquiry", order: 0, color: "#FFD166", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_service_booked", tenantId: "tenant_northstar", templateId: "template_northstar_service", name: "Booked", order: 1, color: "#9B5DE5", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_service_progress", tenantId: "tenant_northstar", templateId: "template_northstar_service", name: "In Progress", order: 2, color: "#2EC5B6", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_service_delivered", tenantId: "tenant_northstar", templateId: "template_northstar_service", name: "Delivered", order: 3, color: "#3AC2A2", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_service_followup", tenantId: "tenant_northstar", templateId: "template_northstar_service", name: "Follow-up", order: 4, color: "#FF8C42", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_issue_issue", tenantId: "tenant_northstar", templateId: "template_northstar_issue", name: "Issue", order: 0, color: "#FFD166", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_issue_triage", tenantId: "tenant_northstar", templateId: "template_northstar_issue", name: "Triage", order: 1, color: "#F25D50", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_issue_working", tenantId: "tenant_northstar", templateId: "template_northstar_issue", name: "Working", order: 2, color: "#2EC5B6", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_issue_waiting", tenantId: "tenant_northstar", templateId: "template_northstar_issue", name: "Waiting", order: 3, color: "#845EC2", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_northstar_issue_resolved", tenantId: "tenant_northstar", templateId: "template_northstar_issue", name: "Resolved", order: 4, color: "#3AC2A2", kind: LifecycleStageKind.RESOLVED },
      { id: "stage_signal_sales_lead", tenantId: "tenant_signal", templateId: "template_signal_sales", name: "Lead", order: 0, color: "#FFD166", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_sales_qualified", tenantId: "tenant_signal", templateId: "template_signal_sales", name: "Qualified", order: 1, color: "#F97B22", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_sales_proposal", tenantId: "tenant_signal", templateId: "template_signal_sales", name: "Proposal", order: 2, color: "#3AC2A2", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_sales_won", tenantId: "tenant_signal", templateId: "template_signal_sales", name: "Won", order: 3, color: "#34D399", kind: LifecycleStageKind.WON },
      { id: "stage_signal_sales_lost", tenantId: "tenant_signal", templateId: "template_signal_sales", name: "Lost", order: 4, color: "#64748B", kind: LifecycleStageKind.LOST },
      { id: "stage_signal_service_inquiry", tenantId: "tenant_signal", templateId: "template_signal_service", name: "Inquiry", order: 0, color: "#FFD166", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_service_booked", tenantId: "tenant_signal", templateId: "template_signal_service", name: "Booked", order: 1, color: "#9B5DE5", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_service_progress", tenantId: "tenant_signal", templateId: "template_signal_service", name: "In Progress", order: 2, color: "#3AC2A2", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_service_delivered", tenantId: "tenant_signal", templateId: "template_signal_service", name: "Delivered", order: 3, color: "#0EA5E9", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_service_followup", tenantId: "tenant_signal", templateId: "template_signal_service", name: "Follow-up", order: 4, color: "#F97B22", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_issue_issue", tenantId: "tenant_signal", templateId: "template_signal_issue", name: "Issue", order: 0, color: "#FFD166", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_issue_triage", tenantId: "tenant_signal", templateId: "template_signal_issue", name: "Triage", order: 1, color: "#F97B22", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_issue_working", tenantId: "tenant_signal", templateId: "template_signal_issue", name: "Working", order: 2, color: "#3AC2A2", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_issue_waiting", tenantId: "tenant_signal", templateId: "template_signal_issue", name: "Waiting", order: 3, color: "#4E6E81", kind: LifecycleStageKind.ACTIVE },
      { id: "stage_signal_issue_resolved", tenantId: "tenant_signal", templateId: "template_signal_issue", name: "Resolved", order: 4, color: "#22C55E", kind: LifecycleStageKind.RESOLVED },
    ],
  });

  await prisma.lifecycleItem.createMany({
    data: [
      {
        id: "life_northstar_launch",
        tenantId: "tenant_northstar",
        templateId: "template_northstar_sales",
        stageId: "stage_northstar_sales_proposal",
        contactId: "contact_ava",
        organizationId: "org_bluebird",
        ownerUserId: "user_iris",
        title: "Retreat launch content package",
        description: "Proposal includes launch film, stills, and guest comms kit.",
        dueDate: dayAt(4, 16),
        valueCents: 2800000,
        status: LifecycleItemStatus.ACTIVE,
        priority: TaskPriority.HIGH,
        riskFlag: false,
        tags: ["proposal", "vip"],
      },
      {
        id: "life_northstar_service",
        tenantId: "tenant_northstar",
        templateId: "template_northstar_service",
        stageId: "stage_northstar_service_progress",
        contactId: "contact_leo",
        organizationId: "org_summercove",
        ownerUserId: "user_milo",
        title: "Summercove retreat production",
        description: "Crew booking, shot list, and day-of logistics in flight.",
        dueDate: dayAt(6, 12),
        valueCents: 1750000,
        status: LifecycleItemStatus.ACTIVE,
        priority: TaskPriority.MEDIUM,
        riskFlag: true,
        tags: ["delivery"],
      },
      {
        id: "life_northstar_issue",
        tenantId: "tenant_northstar",
        templateId: "template_northstar_issue",
        stageId: "stage_northstar_issue_waiting",
        contactId: "contact_maya",
        ownerUserId: "user_iris",
        title: "Gallery install sign-off",
        description: "Waiting on client confirmation for revised delivery window.",
        dueDate: dayAt(2, 14),
        valueCents: 0,
        status: LifecycleItemStatus.ON_HOLD,
        priority: TaskPriority.HIGH,
        riskFlag: true,
        tags: ["sign-off"],
      },
      {
        id: "life_signal_wholesale",
        tenantId: "tenant_signal",
        templateId: "template_signal_sales",
        stageId: "stage_signal_sales_qualified",
        contactId: "contact_zoe",
        organizationId: "org_peakfit",
        ownerUserId: "user_harper",
        title: "Peakfit replenishment expansion",
        description: "New bundle rollout for spring floor sets.",
        dueDate: dayAt(5, 15),
        valueCents: 4200000,
        status: LifecycleItemStatus.ACTIVE,
        priority: TaskPriority.HIGH,
        riskFlag: false,
        tags: ["wholesale", "renewal"],
      },
      {
        id: "life_signal_service",
        tenantId: "tenant_signal",
        templateId: "template_signal_service",
        stageId: "stage_signal_service_booked",
        contactId: "contact_zoe",
        organizationId: "org_peakfit",
        ownerUserId: "user_joel",
        title: "Peakfit demo rollout",
        description: "Onboarding lab booked to align store managers and merchandising.",
        dueDate: dayAt(3, 11),
        valueCents: 950000,
        status: LifecycleItemStatus.ACTIVE,
        priority: TaskPriority.MEDIUM,
        riskFlag: false,
        tags: ["onboarding"],
      },
      {
        id: "life_signal_issue",
        tenantId: "tenant_signal",
        templateId: "template_signal_issue",
        stageId: "stage_signal_issue_working",
        contactId: "contact_noah",
        organizationId: "org_horizon",
        ownerUserId: "user_joel",
        title: "Horizon returns backlog",
        description: "Working through damaged shipment exceptions and replacement timing.",
        dueDate: dayAt(1, 17),
        valueCents: 0,
        status: LifecycleItemStatus.ACTIVE,
        priority: TaskPriority.URGENT,
        riskFlag: true,
        tags: ["returns", "urgent"],
      },
    ],
  });

  await prisma.conversation.createMany({
    data: [
      {
        id: "conv_northstar_ava",
        tenantId: "tenant_northstar",
        contactId: "contact_ava",
        organizationId: "org_bluebird",
        subject: "Retreat launch timing and approvals",
        channel: ConversationChannel.EMAIL,
        status: ConversationStatus.OPEN,
        priority: ConversationPriority.HIGH,
        assignedUserId: "user_iris",
        unreadCount: 2,
        portalVisible: true,
        summary: "Client wants a tighter approval timeline and a simplified launch option set.",
        tags: ["launch", "approval"],
        lastMessageAt: dayAt(0, 10, 20),
      },
      {
        id: "conv_northstar_leo",
        tenantId: "tenant_northstar",
        contactId: "contact_leo",
        organizationId: "org_summercove",
        subject: "Crew availability for summer retreat",
        channel: ConversationChannel.CHAT,
        status: ConversationStatus.PENDING,
        priority: ConversationPriority.NORMAL,
        assignedUserId: "user_milo",
        unreadCount: 0,
        portalVisible: true,
        summary: "Staff is holding talent options while client narrows date range.",
        tags: ["crew", "booking"],
        lastMessageAt: daysAgo(1, 14),
      },
      {
        id: "conv_signal_zoe",
        tenantId: "tenant_signal",
        contactId: "contact_zoe",
        organizationId: "org_peakfit",
        subject: "Demo rollout prep",
        channel: ConversationChannel.EMAIL,
        status: ConversationStatus.WAITING_ON_CLIENT,
        priority: ConversationPriority.HIGH,
        assignedUserId: "user_harper",
        unreadCount: 0,
        portalVisible: true,
        summary: "Waiting on final SKU list before demo lab goes live.",
        tags: ["demo", "sku"],
        lastMessageAt: daysAgo(2, 11),
      },
      {
        id: "conv_signal_noah",
        tenantId: "tenant_signal",
        contactId: "contact_noah",
        organizationId: "org_horizon",
        subject: "Returns backlog and aging invoice",
        channel: ConversationChannel.SMS,
        status: ConversationStatus.OPEN,
        priority: ConversationPriority.URGENT,
        assignedUserId: "user_joel",
        unreadCount: 1,
        portalVisible: false,
        summary: "Urgent issue thread covering replacement units and overdue billing.",
        tags: ["returns", "invoice"],
        lastMessageAt: dayAt(0, 9, 45),
      },
    ],
  });

  await prisma.message.createMany({
    data: [
      { id: "msg_northstar_1", tenantId: "tenant_northstar", conversationId: "conv_northstar_ava", authorType: MessageAuthorType.CLIENT, authorLabel: "Ava Hughes", body: "Can we tighten approvals to one working session and still keep the launch week date?", extractedTags: ["approval", "timeline"], intent: "timeline_check", riskLabel: "medium", sentAt: daysAgo(1, 16) },
      { id: "msg_northstar_2", tenantId: "tenant_northstar", conversationId: "conv_northstar_ava", authorType: MessageAuthorType.USER, authorLabel: "Iris Navarro", body: "Yes. I can collapse this to a single option grid and send a checkpoint with tradeoffs this afternoon.", extractedTags: ["proposal"], intent: "reassure", riskLabel: "low", sentAt: dayAt(0, 9, 10) },
      { id: "msg_northstar_3", tenantId: "tenant_northstar", conversationId: "conv_northstar_ava", authorType: MessageAuthorType.CLIENT, authorLabel: "Ava Hughes", body: "Perfect. Please include the guest messaging draft too.", extractedTags: ["guest messaging"], intent: "scope_addition", riskLabel: "medium", sentAt: dayAt(0, 10, 20) },
      { id: "msg_northstar_4", tenantId: "tenant_northstar", conversationId: "conv_northstar_leo", authorType: MessageAuthorType.USER, authorLabel: "Milo Grant", body: "Holding two crew options for the 24th. Need your final venue call.", extractedTags: ["crew"], intent: "follow_up", riskLabel: "low", sentAt: daysAgo(2, 13) },
      { id: "msg_northstar_5", tenantId: "tenant_northstar", conversationId: "conv_northstar_leo", authorType: MessageAuthorType.CLIENT, authorLabel: "Leo Grant", body: "Venue shortlist lands tomorrow morning. Keep both options warm.", extractedTags: ["venue"], intent: "status_update", riskLabel: "low", sentAt: daysAgo(1, 14) },
      { id: "msg_signal_1", tenantId: "tenant_signal", conversationId: "conv_signal_zoe", authorType: MessageAuthorType.USER, authorLabel: "Harper Lowe", body: "We are ready for the demo lab once the final SKU list arrives.", extractedTags: ["sku"], intent: "nudge", riskLabel: "low", sentAt: daysAgo(3, 10) },
      { id: "msg_signal_2", tenantId: "tenant_signal", conversationId: "conv_signal_zoe", authorType: MessageAuthorType.CLIENT, authorLabel: "Zoe Chang", body: "The merchandising team is finalizing counts. I should have it tomorrow.", extractedTags: ["counts"], intent: "status_update", riskLabel: "medium", sentAt: daysAgo(2, 11) },
      { id: "msg_signal_3", tenantId: "tenant_signal", conversationId: "conv_signal_noah", authorType: MessageAuthorType.CLIENT, authorLabel: "Noah Lane", body: "I still need confirmation on replacements. Finance is also asking about the overdue invoice.", extractedTags: ["replacements", "invoice"], intent: "escalation", riskLabel: "high", sentAt: dayAt(0, 9, 45) },
      { id: "msg_signal_4", tenantId: "tenant_signal", conversationId: "conv_signal_noah", authorType: MessageAuthorType.USER, authorLabel: "Joel Hart", body: "I have both on my board. Replacement timing will be confirmed after the warehouse check this afternoon.", extractedTags: ["warehouse"], intent: "status_update", riskLabel: "medium", sentAt: dayAt(0, 10, 30) },
    ],
  });

  await prisma.fileAsset.createMany({
    data: [
      { id: "file_launch_brief", tenantId: "tenant_northstar", contactId: "contact_ava", organizationId: "org_bluebird", uploadedByUserId: "user_iris", name: "Launch brief.pdf", path: "/demo-assets/launch-brief.txt", mimeType: "text/plain", sizeBytes: 2496 },
      { id: "file_shot_list", tenantId: "tenant_northstar", contactId: "contact_leo", organizationId: "org_summercove", uploadedByUserId: "user_milo", name: "Shot list.txt", path: "/demo-assets/shot-list.txt", mimeType: "text/plain", sizeBytes: 1520 },
      { id: "file_demo_pack", tenantId: "tenant_signal", contactId: "contact_zoe", organizationId: "org_peakfit", uploadedByUserId: "user_harper", name: "Demo pack.txt", path: "/demo-assets/demo-pack.txt", mimeType: "text/plain", sizeBytes: 1860 },
      { id: "file_returns_log", tenantId: "tenant_signal", contactId: "contact_noah", organizationId: "org_horizon", uploadedByUserId: "user_joel", name: "Returns log.txt", path: "/demo-assets/returns-log.txt", mimeType: "text/plain", sizeBytes: 1732 },
    ],
  });

  await prisma.attachment.createMany({
    data: [
      { id: "attach_northstar_brief", tenantId: "tenant_northstar", conversationId: "conv_northstar_ava", messageId: "msg_northstar_2", fileAssetId: "file_launch_brief" },
      { id: "attach_signal_demo", tenantId: "tenant_signal", conversationId: "conv_signal_zoe", messageId: "msg_signal_1", fileAssetId: "file_demo_pack" },
    ],
  });

  await prisma.note.createMany({
    data: [
      { id: "note_northstar_1", tenantId: "tenant_northstar", contactId: "contact_ava", conversationId: "conv_northstar_ava", authorUserId: "user_iris", body: "Keep the option set visual. Ava responds best to compact side-by-side pricing.", pinned: true },
      { id: "note_northstar_2", tenantId: "tenant_northstar", lifecycleItemId: "life_northstar_service", authorUserId: "user_milo", body: "Crew hold expires tomorrow at noon unless deposit lands.", pinned: false },
      { id: "note_signal_1", tenantId: "tenant_signal", contactId: "contact_zoe", lifecycleItemId: "life_signal_service", authorUserId: "user_harper", body: "Bundle the replenishment story into the demo to shortcut follow-up.", pinned: true },
      { id: "note_signal_2", tenantId: "tenant_signal", conversationId: "conv_signal_noah", lifecycleItemId: "life_signal_issue", authorUserId: "user_joel", body: "Potential SLA credit if replacements slip again.", pinned: false },
    ],
  });

  await prisma.booking.createMany({
    data: [
      {
        id: "book_northstar_strategy",
        tenantId: "tenant_northstar",
        bookingTypeId: "booking_northstar_strategy",
        contactId: "contact_ava",
        organizationId: "org_bluebird",
        status: BookingStatus.SCHEDULED,
        startsAt: dayAt(1, 10),
        endsAt: addHours(dayAt(1, 10), 1),
        notes: "Review launch sequence and approvals.",
      },
      {
        id: "book_northstar_shoot",
        tenantId: "tenant_northstar",
        bookingTypeId: "booking_northstar_shoot",
        contactId: "contact_leo",
        organizationId: "org_summercove",
        status: BookingStatus.RESCHEDULED,
        startsAt: dayAt(6, 11),
        endsAt: addHours(dayAt(6, 11), 2),
        notes: "Venue lock pending, moved from Wednesday.",
      },
      {
        id: "book_signal_demo",
        tenantId: "tenant_signal",
        bookingTypeId: "booking_signal_demo",
        contactId: "contact_zoe",
        organizationId: "org_peakfit",
        status: BookingStatus.SCHEDULED,
        startsAt: dayAt(2, 9, 30),
        endsAt: addHours(dayAt(2, 9, 30), 1),
        notes: "Merchandising and replenishment working session.",
      },
    ],
  });

  await prisma.intakeSubmission.createMany({
    data: [
      {
        id: "intake_northstar_ava",
        tenantId: "tenant_northstar",
        intakeFormId: "form_northstar_strategy",
        bookingId: "book_northstar_strategy",
        contactId: "contact_ava",
        answers: { goals: "Launch guest invite flow and content rollout.", stakeholders: "Ava, COO, guest services lead", deliveryDate: "Launch week on Friday" },
      },
      {
        id: "intake_signal_zoe",
        tenantId: "tenant_signal",
        intakeFormId: "form_signal_demo",
        bookingId: "book_signal_demo",
        contactId: "contact_zoe",
        answers: { skuFocus: "Trail pack, hydrate belt, studio bundle", locations: "Portland, Bend, Eugene", launchDate: "Next month" },
      },
    ],
  });

  await prisma.quote.createMany({
    data: [
      {
        id: "quote_northstar_01",
        tenantId: "tenant_northstar",
        contactId: "contact_ava",
        organizationId: "org_bluebird",
        reference: "NS-2026-014",
        status: QuoteStatus.SENT,
        issueDate: daysAgo(2, 9),
        expiresAt: dayAt(5, 17),
        subtotalCents: 2600000,
        taxCents: 208000,
        discountCents: 50000,
        totalCents: 2758000,
        notes: "Includes launch film, stills, and guest message toolkit.",
        portalVisible: true,
      },
      {
        id: "quote_signal_01",
        tenantId: "tenant_signal",
        contactId: "contact_zoe",
        organizationId: "org_peakfit",
        reference: "SG-2026-101",
        status: QuoteStatus.APPROVED,
        issueDate: daysAgo(4, 10),
        expiresAt: dayAt(3, 17),
        subtotalCents: 3900000,
        taxCents: 312000,
        discountCents: 120000,
        totalCents: 4092000,
        notes: "Wholesale rollout support and onboarding lab.",
        portalVisible: true,
      },
    ],
  });

  await prisma.quoteLineItem.createMany({
    data: [
      { id: "quote_line_ns_1", quoteId: "quote_northstar_01", description: "Launch film", quantity: 1, unitPriceCents: 1450000, sortOrder: 0 },
      { id: "quote_line_ns_2", quoteId: "quote_northstar_01", description: "Guest message toolkit", quantity: 1, unitPriceCents: 1150000, sortOrder: 1 },
      { id: "quote_line_sg_1", quoteId: "quote_signal_01", description: "Wholesale rollout strategy", quantity: 1, unitPriceCents: 2100000, sortOrder: 0 },
      { id: "quote_line_sg_2", quoteId: "quote_signal_01", description: "Onboarding lab", quantity: 1, unitPriceCents: 1800000, sortOrder: 1 },
    ],
  });

  await prisma.invoice.createMany({
    data: [
      {
        id: "invoice_northstar_01",
        tenantId: "tenant_northstar",
        contactId: "contact_ava",
        organizationId: "org_bluebird",
        reference: "NS-INV-021",
        status: InvoiceStatus.SENT,
        issueDate: daysAgo(10, 9),
        dueDate: dayAt(2, 17),
        subtotalCents: 920000,
        taxCents: 73600,
        discountCents: 0,
        totalCents: 993600,
        balanceCents: 993600,
        notes: "Deposit invoice for launch package.",
        portalVisible: true,
      },
      {
        id: "invoice_signal_01",
        tenantId: "tenant_signal",
        contactId: "contact_noah",
        organizationId: "org_horizon",
        reference: "SG-INV-073",
        status: InvoiceStatus.OVERDUE,
        issueDate: daysAgo(18, 9),
        dueDate: daysAgo(3, 17),
        subtotalCents: 680000,
        taxCents: 54400,
        discountCents: 0,
        totalCents: 734400,
        balanceCents: 734400,
        notes: "Replacements and expedited logistics fee.",
        portalVisible: true,
      },
    ],
  });

  await prisma.invoiceLineItem.createMany({
    data: [
      { id: "invoice_line_ns_1", invoiceId: "invoice_northstar_01", description: "Launch deposit", quantity: 1, unitPriceCents: 920000, sortOrder: 0 },
      { id: "invoice_line_sg_1", invoiceId: "invoice_signal_01", description: "Expedited replacements", quantity: 1, unitPriceCents: 440000, sortOrder: 0 },
      { id: "invoice_line_sg_2", invoiceId: "invoice_signal_01", description: "Ops support surcharge", quantity: 1, unitPriceCents: 240000, sortOrder: 1 },
    ],
  });

  await prisma.task.createMany({
    data: [
      { id: "task_northstar_today", tenantId: "tenant_northstar", contactId: "contact_ava", lifecycleItemId: "life_northstar_launch", ownerUserId: "user_iris", title: "Send proposal option grid", description: "Share good/better/best package options before 5pm.", dueDate: dayAt(0, 17), status: TaskStatus.TODO, priority: TaskPriority.URGENT },
      { id: "task_northstar_followup", tenantId: "tenant_northstar", conversationId: "conv_northstar_ava", ownerUserId: "user_milo", title: "Prep production notes", description: "Convert inbox decisions into crew brief.", dueDate: dayAt(1, 10), status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM },
      { id: "task_signal_invoice", tenantId: "tenant_signal", invoiceId: "invoice_signal_01", ownerUserId: "user_harper", title: "Call finance on aging invoice", description: "Confirm payment date and capture blocker.", dueDate: dayAt(0, 15), status: TaskStatus.TODO, priority: TaskPriority.HIGH },
      { id: "task_signal_demo", tenantId: "tenant_signal", bookingId: "book_signal_demo", lifecycleItemId: "life_signal_service", ownerUserId: "user_joel", title: "Finalize demo deck", description: "Lock assortment story and replenishment visuals.", dueDate: dayAt(2, 16), status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
    ],
  });

  await prisma.recurringAgreement.createMany({
    data: [
      { id: "recurring_northstar", tenantId: "tenant_northstar", contactId: "contact_ava", organizationId: "org_bluebird", name: "Launch support retainer", amountCents: 480000, cadence: BillingCadence.MONTHLY, status: RecurringAgreementStatus.ACTIVE, nextBillingDate: dayAt(14, 9) },
      { id: "recurring_signal", tenantId: "tenant_signal", contactId: "contact_zoe", organizationId: "org_peakfit", name: "Field merchandising support", amountCents: 650000, cadence: BillingCadence.QUARTERLY, status: RecurringAgreementStatus.ACTIVE, nextBillingDate: dayAt(21, 9) },
    ],
  });

  await prisma.automationRule.createMany({
    data: [
      {
        id: "rule_stage_northstar",
        tenantId: "tenant_northstar",
        name: "Proposal moves create follow-up task",
        enabled: true,
        triggerType: AutomationTriggerType.STAGE_CHANGED,
        conditions: { templateId: "template_northstar_sales", toStageId: "stage_northstar_sales_proposal" },
        actions: [{ type: "createTask", title: "Send proposal recap", offsetDays: 0 }, { type: "addNote", body: "Proposal stage entered. Keep approvals tight." }],
      },
      {
        id: "rule_message_northstar",
        tenantId: "tenant_northstar",
        name: "Client message tags VIP threads",
        enabled: true,
        triggerType: AutomationTriggerType.MESSAGE_RECEIVED,
        conditions: { tagIncludes: ["vip"] },
        actions: [{ type: "applyTag", tag: "follow-up" }, { type: "notify", title: "VIP inbox touchpoint" }],
      },
      {
        id: "rule_noreply_northstar",
        tenantId: "tenant_northstar",
        name: "No reply in 3 days creates chase task",
        enabled: true,
        triggerType: AutomationTriggerType.NO_REPLY_DAYS,
        conditions: { days: 3 },
        actions: [{ type: "createTask", title: "Nudge client for reply", offsetDays: 0 }],
      },
      {
        id: "rule_booking_signal",
        tenantId: "tenant_signal",
        name: "Bookings spawn prep task",
        enabled: true,
        triggerType: AutomationTriggerType.BOOKING_CREATED,
        conditions: { bookingTypeId: "booking_signal_demo" },
        actions: [{ type: "createTask", title: "Prep demo materials", offsetDays: 0 }, { type: "createFollowUp", title: "Post-demo recap" }],
      },
      {
        id: "rule_invoice_signal",
        tenantId: "tenant_signal",
        name: "Overdue invoice alerts finance",
        enabled: true,
        triggerType: AutomationTriggerType.INVOICE_OVERDUE,
        conditions: { minAmountCents: 500000 },
        actions: [{ type: "notify", title: "Invoice overdue" }, { type: "assignOwner", userId: "user_harper" }],
      },
      {
        id: "rule_quote_signal",
        tenantId: "tenant_signal",
        name: "Approved quote advances pipeline",
        enabled: true,
        triggerType: AutomationTriggerType.QUOTE_APPROVED,
        conditions: { referencePrefix: "SG-" },
        actions: [{ type: "changeStage", stageId: "stage_signal_sales_won" }, { type: "addNote", body: "Quote approved. Move to onboarding prep." }],
      },
    ],
  });

  await backfillOfferingSpine(prisma, { dayAt, daysAgo });

  await prisma.automationRun.createMany({
    data: [
      {
        id: "run_stage_northstar",
        tenantId: "tenant_northstar",
        ruleId: "rule_stage_northstar",
        triggerType: AutomationTriggerType.STAGE_CHANGED,
        sourceType: "LifecycleItem",
        sourceId: "life_northstar_launch",
        status: AutomationRunStatus.APPLIED,
        summary: "Created proposal recap task and note.",
        details: { actionsApplied: 2, mode: "seed" },
      },
      {
        id: "run_message_northstar",
        tenantId: "tenant_northstar",
        ruleId: "rule_message_northstar",
        triggerType: AutomationTriggerType.MESSAGE_RECEIVED,
        sourceType: "Conversation",
        sourceId: "conv_northstar_ava",
        status: AutomationRunStatus.APPLIED,
        summary: "VIP thread tagged for follow-up.",
        details: { matchedMessageId: "msg_northstar_3" },
      },
      {
        id: "run_quote_signal",
        tenantId: "tenant_signal",
        ruleId: "rule_quote_signal",
        triggerType: AutomationTriggerType.QUOTE_APPROVED,
        sourceType: "Quote",
        sourceId: "quote_signal_01",
        status: AutomationRunStatus.SIMULATED,
        summary: "Simulation would move Peakfit opportunity to won.",
        details: { mode: "simulation" },
      },
      {
        id: "run_invoice_signal",
        tenantId: "tenant_signal",
        ruleId: "rule_invoice_signal",
        triggerType: AutomationTriggerType.INVOICE_OVERDUE,
        sourceType: "Invoice",
        sourceId: "invoice_signal_01",
        status: AutomationRunStatus.APPLIED,
        summary: "Finance notification queued for overdue invoice.",
        details: { assignedUserId: "user_harper" },
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { id: "notification_northstar_1", tenantId: "tenant_northstar", userId: "user_iris", kind: NotificationKind.REMINDER, title: "Proposal grid due today", body: "Retreat launch options need to land before 5pm." },
      { id: "notification_northstar_2", tenantId: "tenant_northstar", userId: "user_milo", kind: NotificationKind.BOOKING, title: "Crew hold expires tomorrow", body: "Confirm Summercove venue and deposit to keep both options." },
      { id: "notification_signal_1", tenantId: "tenant_signal", userId: "user_harper", kind: NotificationKind.AUTOMATION, title: "Invoice overdue", body: "Horizon invoice SG-INV-073 crossed the overdue threshold." },
      { id: "notification_signal_2", tenantId: "tenant_signal", userId: "user_joel", kind: NotificationKind.SYSTEM, title: "Demo lab in 2 days", body: "Peakfit prep task is still open." },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { id: "activity_ns_1", tenantId: "tenant_northstar", contactId: "contact_ava", organizationId: "org_bluebird", conversationId: "conv_northstar_ava", kind: ActivityKind.MESSAGE, title: "Client requested tighter approvals", detail: "Approval path collapsed into a single visual option grid.", actorLabel: "Ava Hughes", metadata: { messageId: "msg_northstar_3" }, occurredAt: dayAt(0, 10, 20) },
      { id: "activity_ns_2", tenantId: "tenant_northstar", contactId: "contact_ava", organizationId: "org_bluebird", bookingId: "book_northstar_strategy", kind: ActivityKind.BOOKING, title: "Strategy session booked", detail: "Session locked for tomorrow morning.", actorLabel: "System", metadata: { bookingType: "Strategy Session" }, occurredAt: dayAt(0, 8, 30) },
      { id: "activity_ns_3", tenantId: "tenant_northstar", contactId: "contact_ava", organizationId: "org_bluebird", quoteId: "quote_northstar_01", kind: ActivityKind.QUOTE, title: "Quote sent", detail: "Launch package quote NS-2026-014 sent to client.", actorLabel: "Iris Navarro", metadata: { reference: "NS-2026-014" }, occurredAt: daysAgo(2, 9) },
      { id: "activity_sg_1", tenantId: "tenant_signal", contactId: "contact_zoe", organizationId: "org_peakfit", bookingId: "book_signal_demo", kind: ActivityKind.BOOKING, title: "Demo call scheduled", detail: "Working session booked for merchandising prep.", actorLabel: "System", metadata: { bookingType: "Demo Call" }, occurredAt: dayAt(0, 8, 15) },
      { id: "activity_sg_2", tenantId: "tenant_signal", contactId: "contact_zoe", organizationId: "org_peakfit", quoteId: "quote_signal_01", kind: ActivityKind.QUOTE, title: "Quote approved", detail: "Peakfit approved quote SG-2026-101.", actorLabel: "Zoe Chang", metadata: { reference: "SG-2026-101" }, occurredAt: daysAgo(1, 11) },
      { id: "activity_sg_3", tenantId: "tenant_signal", contactId: "contact_noah", organizationId: "org_horizon", conversationId: "conv_signal_noah", invoiceId: "invoice_signal_01", kind: ActivityKind.INVOICE, title: "Invoice flagged overdue", detail: "Finance follow-up task created after overdue check.", actorLabel: "Automation", metadata: { reference: "SG-INV-073" }, occurredAt: dayAt(0, 9, 55) },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
