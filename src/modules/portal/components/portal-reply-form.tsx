"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

export function PortalReplyForm({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    await fetch(`/api/portal/conversations/${conversationId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setBody("");
    router.refresh();
    setPending(false);
  }

  return (
    <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
      <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Reply to this thread..." required />
      <div className="flex justify-end">
        <Button type="submit">{pending ? "Sending..." : "Send reply"}</Button>
      </div>
    </form>
  );
}
