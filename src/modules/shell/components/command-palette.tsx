"use client";

import { Command } from "cmdk";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { commandPaletteShortcuts } from "@/shared/domain/constants";

type SearchPayload = {
  contacts: Array<{ id: string; displayName: string }>;
  organizations: Array<{ id: string; name: string }>;
  conversations: Array<{ id: string; subject: string }>;
  lifecycleItems: Array<{ id: string; title: string }>;
  offerings: Array<{ id: string; name: string; code: string }>;
  catalogs: Array<{ id: string; name: string; code: string }>;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchPayload | null>(null);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (!open || search.trim().length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(search)}`, {
        signal: controller.signal,
      });
      const payload = (await response.json()) as SearchPayload;
      setResults(payload);
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, search]);

  const visibleResults = open && search.trim().length >= 2 ? results : null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 min-w-44 items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] px-3 text-sm text-[var(--text-secondary)]"
      >
        <Search className="size-4" />
        Search or jump
        <span className="ml-auto rounded border border-[var(--border-subtle)] px-1.5 py-0.5 text-xs">
          Ctrl K
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/35 px-4 pt-24" onClick={() => setOpen(false)}>
      <div className="w-full max-w-2xl rounded-md border border-[var(--border-strong)] bg-[var(--panel)] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <Command className="w-full">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-3">
            <Search className="size-4 text-[var(--text-muted)]" />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Search customers, threads, and work..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
          <Command.List className="max-h-[26rem] overflow-y-auto p-3">
            <Command.Empty className="px-2 py-4 text-sm text-[var(--text-muted)]">
              No matching result.
            </Command.Empty>
            <Command.Group heading="Shortcuts" className="grid gap-1 pb-2">
              {commandPaletteShortcuts.map((shortcut) => (
                <Link
                  key={shortcut.route}
                  href={shortcut.route}
                  className="rounded-md px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--panel-subtle)]"
                  onClick={() => setOpen(false)}
                >
                  {shortcut.label}
                </Link>
              ))}
            </Command.Group>
            {visibleResults ? (
              <div className="grid gap-3">
                <div>
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Customers
                  </p>
                  {[...visibleResults.contacts.map((contact) => ({ id: contact.id, label: contact.displayName })), ...visibleResults.organizations.map((organization) => ({ id: organization.id, label: organization.name }))].map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/app/customers/${entry.id}`}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-[var(--panel-subtle)]"
                      onClick={() => setOpen(false)}
                    >
                      {entry.label}
                    </Link>
                  ))}
                </div>
                <div>
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Catalog
                  </p>
                  {[...visibleResults.offerings.map((offering) => ({ id: offering.id, label: `${offering.name} · ${offering.code}`, href: `/app/catalog/${offering.id}` })), ...visibleResults.catalogs.map((catalog) => ({ id: catalog.id, label: `${catalog.name} · ${catalog.code}`, href: "/app/catalog" }))].map((entry) => (
                    <Link
                      key={entry.id}
                      href={entry.href}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-[var(--panel-subtle)]"
                      onClick={() => setOpen(false)}
                    >
                      {entry.label}
                    </Link>
                  ))}
                </div>
                <div>
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Conversations
                  </p>
                  {visibleResults.conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/app/inbox?conversation=${conversation.id}`}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-[var(--panel-subtle)]"
                      onClick={() => setOpen(false)}
                    >
                      {conversation.subject}
                    </Link>
                  ))}
                </div>
                <div>
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Lifecycle
                  </p>
                  {visibleResults.lifecycleItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/app/lifecycle?focus=${item.id}`}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-[var(--panel-subtle)]"
                      onClick={() => setOpen(false)}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
