"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Boxes,
  CalendarClock,
  LayoutDashboard,
  MessageSquareText,
  ReceiptText,
  UsersRound,
  Workflow,
  WalletCards,
  DoorOpen,
  Settings,
} from "lucide-react";

import { cn } from "@/shared/ui/cn";

const nav = [
  { href: "/app", label: "Mission Control", icon: LayoutDashboard },
  { href: "/app/catalog", label: "Catalog", icon: Boxes },
  { href: "/app/customers", label: "Customers", icon: UsersRound },
  { href: "/app/inbox", label: "Inbox", icon: MessageSquareText },
  { href: "/app/lifecycle", label: "Lifecycle", icon: Workflow },
  { href: "/app/automations", label: "Automations", icon: Bot },
  { href: "/app/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/app/revenue/quotes", label: "Quotes", icon: WalletCards },
  { href: "/app/revenue/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/client", label: "Client Workspace", icon: DoorOpen },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {nav.map((item) => {
        const active =
          pathname === item.href || (item.href !== "/app" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-white/12 text-white"
                : "text-[var(--sidebar-muted)] hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
