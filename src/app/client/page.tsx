import { ClientWorkspace } from "@/modules/portal/components/client-workspace";
import { getPortalWorkspace } from "@/modules/portal/server/queries";
import { observeServerFlow } from "@/shared/observability/server";

export const runtime = "nodejs";

export default async function ClientPortalRoute({
  searchParams,
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const { access } = await searchParams;
  const data = await observeServerFlow(
    {
      flow: "portal.workspace.load",
      route: access ? `/client?access=${access}` : "/client",
      screen: "/client",
      workflow: "portal",
      portalAccessKey: access ?? null,
      expectedResult: "Load only the records visible to the current client portal access.",
    },
    () => getPortalWorkspace(access),
  );

  return <ClientWorkspace data={data} />;
}
