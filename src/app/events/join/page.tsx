"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";

export default function JoinEventPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: eventId, error: joinError } = await supabase.rpc("join_event", {
        p_invite_code: inviteCode.trim(),
      });

      if (joinError) {
        throw new Error(
          joinError.message.includes("Invalid invite code")
            ? "Invalid invite code. Check the code and try again."
            : joinError.message,
        );
      }

      if (!eventId) {
        throw new Error("Invalid invite code. Check the code and try again.");
      }

      router.push(`/events/${eventId}`);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to join event"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <Header title="Join event" showBack />
      <main className="mx-auto max-w-lg px-4 py-6 pb-10">
        <p className="mb-6 text-fairway-600">
          Enter the 6-character invite code from your event host.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="mb-1.5 block text-sm font-semibold text-fairway-800">
              Invite code
            </label>
            <input
              id="inviteCode"
              required
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              className="input-field text-center font-mono text-2xl font-bold uppercase tracking-[0.3em]"
              placeholder="ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || inviteCode.length < 6}
            className="btn-primary"
          >
            {loading ? "Joining…" : "Join event"}
          </button>
        </form>
      </main>
    </div>
  );
}
