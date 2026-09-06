"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact, Lang } from "@pukaar/core";
import { AuroraField } from "@/components/field/AuroraField";
import { ContactForm } from "@/components/setup/ContactForm";
import { DuressPhrasePicker } from "@/components/setup/DuressPhrasePicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([{ id: crypto.randomUUID(), name: "", phone: "", relationship: "" }]);
  const [duressPhrase, setDuressPhrase] = useState("No, I already told mom. I will eat at home.");
  const [language, setLanguage] = useState<Lang>("auto");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleStart() {
    setError(null);
    const validContacts = contacts.filter((c) => c.name && /^\d{10,15}$/.test(c.phone));
    if (validContacts.length === 0) {
      setError("Add at least one contact with a valid 10 to 15 digit phone number.");
      return;
    }
    if (duressPhrase.trim().length < 6) {
      setError("Duress phrase needs to be a real sentence.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contacts: validContacts, duressPhrase, language, userName: userName || "she" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "failed to create session");
      sessionStorage.setItem("pukaar.userName", userName || "she");
      sessionStorage.setItem("pukaar.duressPhrase", duressPhrase);
      sessionStorage.setItem("pukaar.language", language);
      router.push(`/call?sessionId=${data.sessionId}&trackToken=${data.trackToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <AuroraField intensity={0.5} />
      <div className="relative max-w-xl mx-auto px-6 py-16 flex flex-col gap-6">
        <h1 className="font-display font-semibold text-3xl">Set up a session</h1>
        <div>
          <Label htmlFor="user-name">Your name</Label>
          <Input id="user-name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Dayita" />
        </div>
        <ContactForm contacts={contacts} onChange={setContacts} />
        <DuressPhrasePicker value={duressPhrase} onChange={setDuressPhrase} />
        <div>
          <Label htmlFor="language">Language</Label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Lang)}
            className="w-full h-11 bg-surface-strong border border-border px-4 font-body text-base"
            style={{ borderRadius: "0.85rem" }}
          >
            <option value="auto">Auto (Hinglish code-switching)</option>
            <option value="hi-IN">Hindi</option>
            <option value="en-IN">English</option>
          </select>
        </div>
        {error && (
          <p className="font-body text-sm text-magenta" role="alert">
            {error}
          </p>
        )}
        <Button size="lg" onClick={handleStart} disabled={submitting} className="w-full">
          {submitting ? "Starting..." : "Start the call"}
        </Button>
      </div>
    </main>
  );
}
