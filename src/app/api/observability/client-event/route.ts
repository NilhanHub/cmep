import { NextResponse } from "next/server";

import { recordClientSideEvent } from "@/shared/observability/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    kind: string;
    route?: string;
    navigationType?: string;
    detail?: unknown;
  };

  await recordClientSideEvent(payload);

  return NextResponse.json({ ok: true });
}
