import { AppShell } from "@/modules/shell/components/app-shell";
import { resolveAppSession } from "@/modules/identity-tenant/server/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await resolveAppSession();
  return <AppShell session={session}>{children}</AppShell>;
}
