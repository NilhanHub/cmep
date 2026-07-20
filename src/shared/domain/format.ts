import { format, formatDistanceToNow } from "date-fns";

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDateTime(value: Date | string) {
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function formatDateOnly(value: Date | string) {
  return format(new Date(value), "MMM d, yyyy");
}

export function relativeTime(value: Date | string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((chunk) => chunk[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function customerRoute(id: string) {
  return `/app/customers/${id}`;
}

export function quoteRoute(id: string) {
  return `/app/revenue/quotes/${id}`;
}

export function invoiceRoute(id: string) {
  return `/app/revenue/invoices/${id}`;
}
