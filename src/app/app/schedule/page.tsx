import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { SchedulePage } from "@/modules/scheduling/components/schedule-page";
import { getScheduleData } from "@/modules/scheduling/server/queries";

export default async function ScheduleRoute() {
  const session = await resolveAppSession();
  const data = await getScheduleData(session.tenant.id);

  return <SchedulePage data={data} tenantSlug={session.tenant.slug} />;
}
