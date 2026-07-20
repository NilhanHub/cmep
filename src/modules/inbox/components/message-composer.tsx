"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

export function MessageComposer({
  conversationId,
  cannedReplies,
}: {
  conversationId: string;
  cannedReplies: Array<{ id: string; title: string; category: string }>;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [cannedReplyId, setCannedReplyId] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    await fetch(`/api/inbox/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, cannedReplyId, isInternalNote }),
    });

    setBody("");
    setCannedReplyId("");
    setIsInternalNote(false);
    router.refresh();
    setIsPending(false);
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select value={cannedReplyId} onChange={(event) => setCannedReplyId(event.target.value)}>
          <option value="">Canned replies</option>
          {cannedReplies.map((reply) => (
            <option key={reply.id} value={reply.id}>
              {reply.category} · {reply.title}
            </option>
          ))}
        </Select>
        <label className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] px-3 text-sm">
          <input
            type="checkbox"
            checked={isInternalNote}
            onChange={(event) => setIsInternalNote(event.target.checked)}
          />
          Internal note
        </label>
      </div>
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write a reply or note..."
        required
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} data-testid="send-message-submit">
          {isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
