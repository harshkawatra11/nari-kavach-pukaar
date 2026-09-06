"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Contact } from "@pukaar/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    <div className="bg-surface-strong rounded-2xl p-6 border border-border" style={{ borderRadius: "1.25rem" }}>
      <div className="flex items-center justify-between mb-2">
        <Label className="mb-0">Trusted contacts</Label>
        <Button type="button" onClick={add} variant="outline" size="sm">
          <Plus className="w-4 h-4" aria-hidden />
          Add
        </Button>
      </div>
      <p className="font-body text-sm text-ink-soft mb-4">
        Phone as digits only, no plus sign, e.g. 919876543210. WhatsApp Desktop must be signed
        in on this laptop for the alert to actually send during the demo.
      </p>
      <div className="flex flex-col gap-4">
        {contacts.map((c) => (
          <div key={c.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
            <Input placeholder="Name" value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} />
            <Input
              placeholder="919876543210"
              value={c.phone}
              onChange={(e) => update(c.id, { phone: e.target.value.replace(/[^\d]/g, "") })}
            />
            <Input placeholder="Relationship" value={c.relationship} onChange={(e) => update(c.id, { relationship: e.target.value })} />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(c.id)} aria-label={`Remove ${c.name || "contact"}`}>
              <Trash2 className="w-4 h-4" aria-hidden />
            </Button>
          </div>
        ))}
        {contacts.length === 0 && <p className="font-body text-sm text-ink-faint italic">No contacts yet. Add at least one.</p>}
      </div>
    </div>
  );
}
