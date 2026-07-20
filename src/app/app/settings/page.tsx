import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { getAutomationStudioData } from "@/modules/automation/server/queries";
import { getScheduleData } from "@/modules/scheduling/server/queries";
import { getLifecycleData } from "@/modules/lifecycle/server/queries";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";

export default async function SettingsRoute() {
  const session = await resolveAppSession();
  const [automation, schedule, lifecycle] = await Promise.all([
    getAutomationStudioData(session.tenant.id),
    getScheduleData(session.tenant.id),
    getLifecycleData(session.tenant.id),
  ]);

  return (
    <div className="app-grid">
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold">Tenant brand, pipeline, booking, and automation controls.</h1>
      </div>
      <div className="balanced-grid">
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Brand</p>
              <p className="text-sm text-[var(--text-secondary)]">{session.tenant.name}</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-[var(--text-secondary)]">
            <p>{session.tenant.description}</p>
            <p>Primary color {session.tenant.primaryColor}</p>
            <p>Accent color {session.tenant.accentColor}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Pipelines</p>
              <p className="text-sm text-[var(--text-secondary)]">{lifecycle.templates.length} templates configured</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-[var(--text-secondary)]">
            {lifecycle.templates.map((template) => (
              <p key={template.id}>
                {template.name} · {template.stages.length} stages
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Booking types</p>
              <p className="text-sm text-[var(--text-secondary)]">{schedule.bookingTypes.length} service slots</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-[var(--text-secondary)]">
            {schedule.bookingTypes.map((bookingType) => (
              <p key={bookingType.id}>
                {bookingType.name} · {bookingType.durationMinutes} minutes
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">Automations</p>
              <p className="text-sm text-[var(--text-secondary)]">{automation.rules.length} live rules</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-[var(--text-secondary)]">
            {automation.rules.map((rule) => (
              <p key={rule.id}>
                {rule.name} · {rule.triggerType}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
