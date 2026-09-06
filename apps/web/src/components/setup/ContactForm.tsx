"use client";

import { Trash2 } from "lucide-react";
import type { Contact } from "@pukaar/core";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";

/** Renders rows only, no owned heading or container: the parent page places
 *  this inside a SettingsGroup, which supplies the label, border and
 *  footnote. */
export function ContactForm({ contacts, onChange }: { contacts: Contact[]; onChange: (contacts: Contact[]) => void }) {
  function update(id: string, patch: Partial<Contact>) {
    onChange(contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function add() {
    onChange([...contacts, { id: crypto.randomUUID(), name: "", phone: "", relationship: "" }]);
  }

  function remove(id: string) {
    onChange(contacts.filter((c) => c.id !== id));
  }

  return (
    <>
      {contacts.map((c) => (
        <div key={c.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-3">
          <Input placeholder="Name" value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} />
          <Input
            placeholder="919876543210"
            value={c.phone}
            onChange={(e) => update(c.id, { phone: e.target.value.replace(/[^\d]/g, "") })}
          />
          <Input placeholder="Relationship" value={c.relationship} onChange={(e) => update(c.id, { relationship: e.target.value })} />
          <IconButton label={`Remove ${c.name || "contact"}`} tone="danger" onClick={() => remove(c.id)}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      ))}
      {contacts.length === 0 && (
        <p className="px-4 py-3 text-[length:var(--text-base)] italic text-ink-faint">No contacts yet. Add at least one.</p>
      )}
      <button
        type="button"
        onClick={add}
        className="w-full px-4 py-3 text-left text-[length:var(--text-base)] text-accent transition-colors hover:text-accent-hover"
      >
        + Add contact
      </button>
    </>
  );
}
