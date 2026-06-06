"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [handicapIndex, setHandicapIndex] = useState("");
  const [homeClub, setHomeClub] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Profile;
        setProfile(p);
        setDisplayName(p.display_name ?? "");
        setHandicapIndex(p.handicap_index?.toString() ?? "");
        setHomeClub(p.home_club ?? "");
        setProfileImageUrl(p.profile_image_url ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  async function uploadAvatar(file: File) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setProfileImageUrl(data.publicUrl);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const handicap =
      handicapIndex.trim() === "" ? null : Number(handicapIndex);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        handicap_index: handicap,
        home_club: homeClub.trim() || null,
        profile_image_url: profileImageUrl || null,
      })
      .eq("id", profile?.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile saved");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-dvh">
        <Header title="Profile" showBack />
        <main className="mx-auto max-w-lg px-4 py-6">
          Loading…
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <Header title="Profile" showBack />

      <main className="mx-auto max-w-lg px-4 py-6 pb-10">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="flex items-center gap-4">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-fairway-100 text-2xl font-bold text-fairway-700">
                {displayName.charAt(0).toUpperCase() || "R"}
              </div>
            )}

            <label className="btn-secondary cursor-pointer">
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar(file);
                }}
              />
            </label>
          </div>

          <input
            required
            className="input-field"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <input
            type="number"
            step="0.1"
            className="input-field"
            placeholder="Handicap index"
            value={handicapIndex}
            onChange={(e) => setHandicapIndex(e.target.value)}
          />

          <input
            className="input-field"
            placeholder="Home club"
            value={homeClub}
            onChange={(e) => setHomeClub(e.target.value)}
          />

          {message && (
            <p className="text-sm text-fairway-600">{message}</p>
          )}

          <button disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </main>
    </div>
  );
}