"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type UiRole = "user" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<UiRole>("user");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qpRole = searchParams.get("role");
    if (qpRole === "admin" || qpRole === "user") {
      setRole(qpRole);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }
      // Redirect based on actual stored role, not local toggle
      const userRole = data.user?.role as string | undefined;
      if (userRole && userRole !== "user") {
        router.push("/admin");
      } else {
        router.push("/user");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="grid w-full max-w-4xl gap-10 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-500/25 backdrop-blur-xl md:grid-cols-[1.05fr,0.95fr] md:p-10">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Dual role access
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Log in as{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              {role === "admin" ? "Government Admin" : "Citizen User"}
            </span>
            .
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-200/80">
            Use your email and password to access your personalised dashboard.
            Admins can review and action incoming land requests, while users
            can submit and track their own applications.
          </p>
          <div className="inline-flex gap-2 rounded-full border border-white/10 bg-black/30 p-1 text-xs">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${
                role === "user"
                  ? "bg-emerald-400 text-slate-900"
                  : "text-slate-200 hover:bg-white/5"
              }`}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${
                role === "admin"
                  ? "bg-emerald-400 text-slate-900"
                  : "text-slate-200 hover:bg-white/5"
              }`}
            >
              Govt Admin
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-xl"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Email address
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/60 focus:border-emerald-400/70 focus:ring-2"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/60 focus:border-emerald-400/70 focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? role === "admin"
                ? "Signing in as admin..."
                : "Signing in..."
              : role === "admin"
              ? "Sign in as Govt Admin"
              : "Sign in as Citizen"}
          </button>

          {role === "user" && (
            <p className="pt-1 text-center text-[11px] text-slate-400/80">
              New citizen?{" "}
              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="font-medium text-emerald-300 underline-offset-2 hover:underline"
              >
                Create an account
              </button>
            </p>
          )}
          {role === "admin" && (
            <p className="pt-1 text-center text-[11px] text-slate-400/80">
              New admin?{" "}
              <button
                type="button"
                onClick={() => router.push("/admin/signup")}
                className="font-medium text-amber-300 underline-offset-2 hover:underline"
              >
                Register as admin
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

