"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { roleLabels } from "@/shared/domain/constants";
import { Select } from "@/shared/ui/select";

type MembershipOption = {
  tenantId: string;
  tenantName: string;
  userId: string;
  userName: string;
  role: keyof typeof roleLabels;
};

export function TenantRoleSwitcher({
  memberships,
  currentTenantId,
  currentUserId,
}: {
  memberships: MembershipOption[];
  currentTenantId: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const current = memberships.find(
    (membership) => membership.tenantId === currentTenantId && membership.userId === currentUserId,
  );

  const tenantOptions = useMemo(
    () =>
      Array.from(new Map(memberships.map((membership) => [membership.tenantId, membership])).values()),
    [memberships],
  );

  const currentTenantMemberships = memberships.filter((membership) => membership.tenantId === currentTenantId);

  async function submit(nextTenantId: string, nextUserId: string) {
    await fetch("/api/identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: nextTenantId, userId: nextUserId }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Tenant switcher"
        className="min-w-40"
        value={currentTenantId}
        onChange={(event) => {
          const nextTenantId = event.target.value;
          const firstMembership = memberships.find((membership) => membership.tenantId === nextTenantId);
          if (firstMembership) {
            void submit(nextTenantId, firstMembership.userId);
          }
        }}
      >
        {tenantOptions.map((membership) => (
          <option key={membership.tenantId} value={membership.tenantId}>
            {membership.tenantName}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Role switcher"
        className="min-w-40"
        value={current?.userId ?? currentUserId}
        onChange={(event) => void submit(currentTenantId, event.target.value)}
      >
        {currentTenantMemberships.map((membership) => (
          <option key={`${membership.tenantId}:${membership.userId}`} value={membership.userId}>
            {roleLabels[membership.role]} · {membership.userName}
          </option>
        ))}
      </Select>
    </div>
  );
}
