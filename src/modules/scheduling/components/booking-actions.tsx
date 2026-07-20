"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function BookingActions({
  bookingId,
}: {
  bookingId: string;
}) {
  const router = useRouter();
  const [startsAt, setStartsAt] = useState("");
  const [pending, setPending] = useState(false);

  async function update(status: "RESCHEDULED" | "CANCELLED") {
    setPending(true);
    await fetch(`/api/schedule/bookings/${bookingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, startsAt }),
    });
    router.refresh();
    setPending(false);
  }

  return (
    <div className="grid gap-2">
      <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={pending} onClick={() => void update("RESCHEDULED")}>
          Reschedule
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => void update("CANCELLED")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
