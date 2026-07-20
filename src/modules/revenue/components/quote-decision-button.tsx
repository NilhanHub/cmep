"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

export function QuoteDecisionButton({
  quoteId,
  decision,
  tenantId,
  scope = "app",
}: {
  quoteId: string;
  decision: "APPROVED" | "REJECTED";
  tenantId?: string;
  scope?: "app" | "portal";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant={decision === "APPROVED" ? "primary" : "secondary"}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch(`/api/revenue/quotes/${quoteId}/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, tenantId, scope }),
        });
        router.refresh();
        setPending(false);
      }}
    >
      {pending ? "Working..." : decision === "APPROVED" ? "Approve" : "Reject"}
    </Button>
  );
}
