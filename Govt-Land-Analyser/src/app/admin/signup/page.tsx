"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AdminLevel = "state_admin" | "district_admin" | "block_admin";

export default function AdminSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contactNumber: "",
    adminSecret: "",
    adminLevel: "district_admin" as AdminLevel,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Admin signup failed");
      }
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="grid w-full max-w-4xl gap-10 rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-500/25 backdrop-blur-xl md:grid-cols-[1.1fr,0.9fr] md:p-10">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
            Admin onboarding
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Create your{" "}
            <span className="bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
              government admin account
            </span>
            .
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-200/80">
            Invite-only registration for administrators. Choose your access
            level (state, district or block) and provide the shared admin
            secret issued by your system owner.
          </p>
          <ul className="space-y-2 text-xs text-slate-200/80">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>State admins can see all districts; district admins see their own districts; block admins focus on a single block.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Secure access with admin secret verification.</span>
            </li>
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-xl"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Full name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/60 focus:border-emerald-400/70 focus:ring-2"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/60 focus:border-emerald-400/70 focus:ring-2"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Contact number
            </label>
            <input
              type="tel"
              required
              value={form.contactNumber}
              onChange={(e) =>
                setForm({ ...form, contactNumber: e.target.value })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/60 focus:border-emerald-400/70 focus:ring-2"
              placeholder="+91-XXXXXXXXXX"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Admin level
            </label>
            <select
              value={form.adminLevel}
              onChange={(e) =>
                setForm({
                  ...form,
                  adminLevel: e.target.value as AdminLevel,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-50 outline-none ring-emerald-400/60 focus:border-emerald-400/70 focus:ring-2"
            >
              <option value="state_admin">State-level Admin</option>
              <option value="district_admin">District-level Admin</option>
              <option value="block_admin">Block-level Admin</option>
            </select>
            <p className="text-[10px] text-slate-400">
              This controls the scope of areas you manage in the system.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/60 focus:border-emerald-400/70 focus:ring-2"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-200">
              Admin secret
            </label>
            <input
              type="password"
              required
              value={form.adminSecret}
              onChange={(e) =>
                setForm({ ...form, adminSecret: e.target.value })
              }
              className="w-full rounded-xl border border-amber-400/30 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 outline-none ring-amber-400/60 focus:border-amber-400/70 focus:ring-2"
              placeholder="Enter admin secret from your administrator"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/40 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating admin account..." : "Create admin account"}
          </button>

          <p className="pt-1 text-center text-[11px] text-slate-400/80">
            Already an admin?{" "}
            <button
              type="button"
              onClick={() => router.push("/login?role=admin")}
              className="font-medium text-amber-300 underline-offset-2 hover:underline"
            >
              Log in as admin
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
