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
    <div className="flex h-full items-center justify-center bg-white">
      <div className="grid w-full max-w-4xl gap-10 border border-gray-300 bg-white p-8 shadow-sm md:grid-cols-[1.05fr,0.95fr] md:p-10">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 border border-blue-600 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
            Dual role access
          </p>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Log in as{" "}
            <span className="text-blue-600">
              {role === "admin" ? "Government Admin" : "Citizen User"}
            </span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-gray-700">
            Use your email and password to access your personalised dashboard.
            Admins can review and action incoming land requests, while users
            can submit and track their own applications.
          </p>
          <div className="inline-flex gap-2 border border-gray-300 bg-gray-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex-1 px-3 py-1.5 font-medium transition ${
                role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 px-3 py-1.5 font-medium transition ${
                role === "admin"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Govt Admin
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-gray-300 bg-gray-50 p-6"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Email address
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              placeholder="••••••••"
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
            {loading
              ? role === "admin"
                ? "Signing in as admin..."
                : "Signing in..."
              : role === "admin"
              ? "Sign in as Govt Admin"
              : "Sign in as Citizen"}
          </button>

          {role === "user" && (
            <p className="pt-1 text-center text-xs text-gray-600">
              New citizen?{" "}
              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="font-medium text-blue-600 underline-offset-2 hover:underline"
              >
                Create an account
              </button>
            </p>
          )}
          {role === "admin" && (
            <p className="pt-1 text-center text-xs text-gray-600">
              New admin?{" "}
              <button
                type="button"
                onClick={() => router.push("/admin/signup")}
                className="font-medium text-blue-600 underline-offset-2 hover:underline"
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

