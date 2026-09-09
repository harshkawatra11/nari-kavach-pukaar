"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact, GeoPoint, Lang } from "@pukaar/core";
import { AppBar } from "@/components/shell/AppBar";
import { SettingsGroup, SettingsRow } from "@/components/ui/settings-group";
import { ContactForm } from "@/components/setup/ContactForm";
import { DuressPhrasePicker } from "@/components/setup/DuressPhrasePicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([{ id: crypto.randomUUID(), name: "", phone: "", relationship: "" }]);
  const [duressPhrase, setDuressPhrase] = useState("Mummy ko bol dena blue notebook drawer mein rakhi hai");
  const [language, setLanguage] = useState<Lang>("auto");
  const [error, setError] = useState<string | null>(null);
  const [submitStage, setSubmitStage] = useState<"idle" | "creating" | "locating" | "opening">("idle");

  function getInitialLocation(): Promise<GeoPoint | null> {
    if (!("geolocation" in navigator)) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy, at: Date.now() }),
        () => resolve(null),
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 },
      );
    });
  }

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

    setSubmitStage("creating");
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contacts: validContacts,
          duressPhrase,
          language,
          userName: userName || "she",
          // Deliberately URL-scoped and absent from the normal setup UI. It
          // lets the demo team run an explicitly labelled delivery rehearsal
          // without risking a test message that reads like a real emergency.
          testMode: new URLSearchParams(window.location.search).get("test") === "1",
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "failed to create session");
      setSubmitStage("locating");
      const initialPoint = await getInitialLocation();
      if (initialPoint) {
        await fetch(`/api/session/${data.sessionId}/location`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-session-control": data.controlToken },
          body: JSON.stringify(initialPoint),
        }).catch(() => undefined);
        sessionStorage.setItem("pukaar.initialLocation", JSON.stringify(initialPoint));
      } else {
        sessionStorage.removeItem("pukaar.initialLocation");
      }
      sessionStorage.setItem("pukaar.userName", userName || "she");
      sessionStorage.setItem("pukaar.duressPhrase", duressPhrase);
      sessionStorage.setItem("pukaar.language", language);
      sessionStorage.setItem("pukaar.trackUrl", data.trackUrl);
      sessionStorage.setItem("pukaar.controlToken", data.controlToken);
      setSubmitStage("opening");
      router.push(`/call?sessionId=${data.sessionId}&trackToken=${data.trackToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitStage("idle");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar back={{ href: "/", label: "Back" }} title="New session" />
      <main className="mx-auto flex w-full max-w-[620px] flex-1 flex-col gap-7 px-5 py-8 pb-28">
        <SettingsGroup label="Identity">
          <SettingsRow label="Your name" htmlFor="user-name">
            <Input id="user-name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Dayita" className="text-right" />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup
          label="Trusted contacts"
          footnote="Digits only, no plus sign. WhatsApp Desktop must be signed in on this laptop for the alert to actually send."
        >
          <ContactForm contacts={contacts} onChange={setContacts} />
        </SettingsGroup>

        <SettingsGroup
          label="Safe word"
          footnote="A full, ordinary-sounding sentence you would only say if you needed to. Distinctive phrases are recognised more reliably and are harder to say by accident."
        >
          <DuressPhrasePicker value={duressPhrase} onChange={setDuressPhrase} />
        </SettingsGroup>

        <SettingsGroup label="Voice">
          <SettingsRow label="Language" htmlFor="language">
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Lang)}
              className="h-10 w-full max-w-[220px] rounded-[var(--radius-md)] border border-hairline bg-surface-2 px-3 text-[length:var(--text-base)] text-ink transition-colors hover:border-hairline-strong focus:border-[var(--focus)] focus:outline-none"
            >
              <option value="auto">Auto (Hinglish)</option>
              <option value="hi-IN">Hindi</option>
              <option value="en-IN">English</option>
            </select>
          </SettingsRow>
        </SettingsGroup>

        <div className="fixed inset-x-0 bottom-0 border-t border-hairline bg-ground px-5 py-3">
          <div className="mx-auto flex max-w-[620px] items-center gap-3">
            {error && (
              <p role="alert" className="text-[length:var(--text-sm)] text-alarm">
                {error}
              </p>
            )}
            <Button className="ml-auto" onClick={handleStart} disabled={submitStage !== "idle"}>
              {submitStage === "creating" ? "Creating session" : submitStage === "locating" ? "Securing location" : submitStage === "opening" ? "Opening call" : "Start call"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
