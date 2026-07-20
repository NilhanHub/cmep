import { AutomationStudio } from "@/modules/automation/components/automation-studio";
import { getAutomationStudioData } from "@/modules/automation/server/queries";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";

export default async function AutomationsRoute() {
  const session = await resolveAppSession();
  const data = await getAutomationStudioData(session.tenant.id);

  return <AutomationStudio data={data} />;
}
