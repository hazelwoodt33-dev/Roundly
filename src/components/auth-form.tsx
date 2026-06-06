"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() || email.split("@")[0] },
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-fairway-700 text-white shadow-lg shadow-fairway-700/20">
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path
              d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-fairway-950">
          {isSignup ? "Sign up" : "Sign in"}
        </h1>
        <p className="mt-2 text-fairway-600">
          {isSignup
            ? "Create your Roundly account."
            : "Sign in to your Roundly account."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div>
            <label htmlFor="displayName" className="mb-1.5 block text-sm font-semibold text-fairway-800">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              className="input-field"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-fairway-800">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-fairway-800">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="input-field"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Please wait…" : isSignup ? "Sign up" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-fairway-600">
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-fairway-700 underline-offset-2 active:underline"
        >
          {isSignup ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </div>
  );
}
