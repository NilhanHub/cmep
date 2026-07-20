import type { PropsWithChildren } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import type { AppSession } from "@/modules/identity-tenant/server/session";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

import { TenantRoleSwitcher } from "@/modules/identity-tenant/components/tenant-role-switcher";
import { SidebarNav } from "./sidebar-nav";
import { CommandPalette } from "./command-palette";

export function AppShell({
  session,
  children,
}: PropsWithChildren<{
  session: AppSession;
}>) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-white/5 bg-[var(--sidebar)] px-5 py-6 text-[var(--sidebar-text)] lg:block">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">
            CME Platform
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{session.tenant.name}</h1>
          <p className="mt-2 text-sm text-[var(--sidebar-muted)]">{session.tenant.description}</p>
        </div>
        <SidebarNav />
      </aside>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--app-background)]/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <CommandPalette />
              <TenantRoleSwitcher
                memberships={session.memberships.map((membership) => ({
                  tenantId: membership.tenantId,
                  tenantName: membership.tenant.name,
                  userId: membership.userId,
                  userName: membership.user.name,
                  role: membership.role,
                }))}
                currentTenantId={session.tenant.id}
                currentUserId={session.user.id}
              />
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/app/customers"
                className="hidden h-10 items-center rounded-md bg-[var(--panel-strong)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--panel-strong-hover)] md:inline-flex"
              >
                <Plus className="mr-2 size-4" />
                Quick add
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
