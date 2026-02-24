"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";

export default function LoginPage() {
  const [view, setView] = useState<"loading" | "login">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) router.replace("/dashboard");
      else setView("login");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) router.replace("/dashboard");
      else setView("login");
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (view === "loading") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-zinc-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-semibold text-center">Log in</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-zinc-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-zinc-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 min-h-[48px] text-base inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="shrink-0" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          <Link href="/" className="text-zinc-400 hover:text-white">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
