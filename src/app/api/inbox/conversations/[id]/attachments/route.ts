import { NextResponse } from "next/server";

import { resolveAppSession } from "@/modules/identity-tenant/server/session";
import { uploadConversationAttachment } from "@/modules/inbox/server/queries";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await resolveAppSession();
  const { id } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  await uploadConversationAttachment({
    tenantId: session.tenant.id,
    conversationId: id,
    file,
    userId: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
