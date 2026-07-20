import { LifecycleBoard } from "@/modules/lifecycle/components/lifecycle-board";
import { getLifecycleData } from "@/modules/lifecycle/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";

export default async function LifecycleRoute({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  const session = await resolveAppSession();
  const data = await getLifecycleData(session.tenant.id);

  return <LifecycleBoard data={data} focusId={focus} />;
}
