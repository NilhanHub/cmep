export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "CME Platform";

export const roleLabels = {
  OWNER: "Owner",
  ADMIN: "Admin",
  STAFF: "Staff",
  CLIENT: "Client",
} as const;

export const conversationStatusLabels = {
  OPEN: "Open",
  PENDING: "Pending",
  WAITING_ON_CLIENT: "Waiting on client",
  CLOSED: "Closed",
} as const;

export const invoiceStatusLabels = {
  DRAFT: "Draft",
  SENT: "Sent",
  OVERDUE: "Overdue",
  PAID: "Paid",
} as const;

export const quoteStatusLabels = {
  DRAFT: "Draft",
  SENT: "Sent",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
} as const;

export const lifecycleStatusLabels = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  WON: "Won",
  LOST: "Lost",
  RESOLVED: "Resolved",
} as const;

export const navigation = [
  { href: "/app", label: "Mission Control" },
  { href: "/app/catalog", label: "Catalog" },
  { href: "/app/customers", label: "Customers" },
  { href: "/app/inbox", label: "Inbox" },
  { href: "/app/lifecycle", label: "Lifecycle" },
  { href: "/app/automations", label: "Automations" },
  { href: "/app/schedule", label: "Schedule" },
  { href: "/app/revenue/quotes", label: "Quotes" },
  { href: "/app/revenue/invoices", label: "Invoices" },
  { href: "/client", label: "Client Workspace" },
  { href: "/app/settings", label: "Settings" },
] as const;

export const commandPaletteShortcuts = [
  { label: "Open catalog", route: "/app/catalog" },
  { label: "New customer", route: "/app/customers" },
  { label: "Open inbox", route: "/app/inbox" },
  { label: "Review lifecycle", route: "/app/lifecycle" },
  { label: "Run automation simulation", route: "/app/automations" },
  { label: "Schedule booking", route: "/app/schedule" },
] as const;

export const personaCookieName = "cmep-persona";
export const portalCookieName = "cmep-portal";
