import { MissionControl } from "@/modules/shell/components/mission-control";
import { getMissionControlData } from "@/modules/shell/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { observeServerFlow } from "@/shared/observability/server";

export const runtime = "nodejs";

export default async function AppHomePage() {
  const session = await resolveAppSession();
  const data = await observeServerFlow(
    {
      flow: "app.home.load",
      route: "/app",
      screen: "/app",
      workflow: "shell",
      tenantId: session.tenant.id,
      userId: session.user.id,
      expectedResult: "Load mission control for the active tenant.",
    },
    () => getMissionControlData(session.tenant.id),
  );

  return (
    <div className="app-grid">
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Mission Control</p>
        <h1 className="mt-1 text-3xl font-semibold">Keep customers, work, and revenue moving.</h1>
      </div>
      <MissionControl data={data} />
    </div>
  );
}
