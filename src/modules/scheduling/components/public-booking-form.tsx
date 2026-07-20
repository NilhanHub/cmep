"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

export function PublicBookingForm({
  tenantId,
  bookingTypeId,
  slotOptions,
  questionIds,
}: {
  tenantId: string;
  bookingTypeId: string;
  slotOptions: Array<{ value: string; label: string }>;
  questionIds: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState(slotOptions[0]?.value ?? "");

  async function submit(formData: FormData) {
    const answers = Object.fromEntries(questionIds.map((question) => [question.id, String(formData.get(question.id) ?? "")]));
    await fetch("/api/schedule/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingTypeId,
        tenantId,
        startsAt: selectedSlot,
        notes: String(formData.get("notes") ?? ""),
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        answers,
      }),
    });
    router.push("/client");
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await submit(new FormData(event.currentTarget));
      }}
    >
      <div className="grid gap-2">
        <p className="text-sm font-medium text-[var(--text-primary)]">Choose a slot</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {slotOptions.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => setSelectedSlot(slot.value)}
              className={`rounded-md border px-3 py-3 text-left text-sm ${
                selectedSlot === slot.value
                  ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]"
                  : "border-[var(--border-subtle)] bg-[var(--panel)]"
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>
      <Input name="name" placeholder="Your name" required />
      <Input name="email" type="email" placeholder="you@company.test" required />
      {questionIds.map((question) => (
        <Textarea key={question.id} name={question.id} placeholder={question.label} required />
      ))}
      <Textarea name="notes" placeholder="Anything we should know before the session?" required />
      <Button type="submit">Book now</Button>
    </form>
  );
}
