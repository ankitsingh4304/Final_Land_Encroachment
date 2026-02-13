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
    <div className="flex h-full items-center justify-center bg-white">
      <div className="grid w-full max-w-4xl gap-10 border border-gray-300 bg-white p-8 shadow-sm md:grid-cols-[1.1fr,0.9fr] md:p-10">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 border border-blue-600 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
            Admin onboarding
          </p>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Create your{" "}
            <span className="text-blue-600">
              government admin account
            </span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-gray-700">
            Invite-only registration for administrators. Choose your access
            level (state, district or block) and provide the shared admin
            secret issued by your system owner.
          </p>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
              <span>State admins can see all districts; district admins see their own districts; block admins focus on a single block.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
              <span>Secure access with admin secret verification.</span>
            </li>
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-gray-300 bg-gray-50 p-6"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Full name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Contact number
            </label>
            <input
              type="tel"
              required
              value={form.contactNumber}
              onChange={(e) =>
                setForm({ ...form, contactNumber: e.target.value })
              }
              className="w-full border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="+91-XXXXXXXXXX"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
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
              className="w-full border border-gray-400 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="state_admin">State-level Admin</option>
              <option value="district_admin">District-level Admin</option>
              <option value="block_admin">Block-level Admin</option>
            </select>
            <p className="text-xs text-gray-600">
              This controls the scope of areas you manage in the system.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Admin secret
            </label>
            <input
              type="password"
              required
              value={form.adminSecret}
              onChange={(e) =>
                setForm({ ...form, adminSecret: e.target.value })
              }
              className="w-full border border-blue-600 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="Enter admin secret from your administrator"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating admin account..." : "Create admin account"}
          </button>

          <p className="pt-1 text-center text-xs text-gray-600">
            Already an admin?{" "}
            <button
              type="button"
              onClick={() => router.push("/login?role=admin")}
              className="font-medium text-blue-600 underline-offset-2 hover:underline"
            >
              Log in as admin
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
