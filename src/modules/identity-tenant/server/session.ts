import type { Membership, MembershipRole, Tenant, User } from "@prisma/client";
import { cookies } from "next/headers";

import { personaCookieName } from "@/shared/domain/constants";
import { prisma } from "@/shared/server/prisma";

export type SessionMembership = Membership & {
  tenant: Tenant;
  user: User;
};

export type AppSession = {
  current: SessionMembership;
  tenant: Tenant;
  user: User;
  memberships: SessionMembership[];
  tenantMemberships: SessionMembership[];
};

const roleOrder: Record<MembershipRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  STAFF: 2,
  CLIENT: 3,
};

export function serializePersona(tenantId: string, userId: string) {
  return `${tenantId}:${userId}`;
}

export async function resolveAppSession(): Promise<AppSession> {
  const membershipRecords = await prisma.membership.findMany({
    include: {
      tenant: true,
      user: true,
    },
  });

  if (membershipRecords.length === 0) {
    throw new Error("No memberships found. Run npm run demo:reset.");
  }

  const memberships = membershipRecords.sort((a, b) => {
    if (a.tenant.name !== b.tenant.name) {
      return a.tenant.name.localeCompare(b.tenant.name);
    }

    return roleOrder[a.role] - roleOrder[b.role];
  });

  const cookieStore = await cookies();
  const persona = cookieStore.get(personaCookieName)?.value;
  const fallback = memberships[0];
  const current =
    memberships.find((membership) => serializePersona(membership.tenantId, membership.userId) === persona) ??
    fallback;

  return {
    current,
    tenant: current.tenant,
    user: current.user,
    memberships,
    tenantMemberships: memberships.filter((membership) => membership.tenantId === current.tenantId),
  };
}
