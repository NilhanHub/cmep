"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AttachmentUploader({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <label className="inline-flex cursor-pointer items-center rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-secondary)]">
      {pending ? "Uploading..." : "Attach file"}
      <input
        type="file"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          setPending(true);
          const formData = new FormData();
          formData.set("file", file);
          await fetch(`/api/inbox/conversations/${conversationId}/attachments`, {
            method: "POST",
            body: formData,
          });
          router.refresh();
          setPending(false);
        }}
      />
    </label>
  );
}
