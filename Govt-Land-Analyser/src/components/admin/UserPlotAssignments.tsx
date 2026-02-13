"use client";

import { useEffect, useState } from "react";
import { INDUSTRIAL_AREAS, type IndustrialAreaId } from "@/lib/config/areas";

interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  plotId: string | null;
  areaId: string | null;
}

type AdminRole = "state_admin" | "district_admin" | "block_admin" | "user" | null;

function filterAreasForRole(role: AdminRole) {
  if (role === "district_admin") {
    return INDUSTRIAL_AREAS.filter((a) => a.id === "area-1" || a.id === "area-2");
  }
  if (role === "block_admin") {
    return INDUSTRIAL_AREAS.filter((a) => a.id === "area-1");
  }
  return INDUSTRIAL_AREAS;
}

export function UserPlotAssignments() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        console.error("Failed to load users", await res.text());
        return;
      }
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error("Error loading users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        const role = (data.user?.role ?? "user") as AdminRole;
        setAdminRole(role);
      } catch (err) {
        console.error("Failed to load admin role for assignments", err);
      }
    };
    loadRole();
  }, []);

  const visibleAreas = filterAreasForRole(adminRole);

  const handleChangeArea = (userId: string, areaId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              areaId,
            }
          : u
      )
    );
  };

  const handleChangePlot = (userId: string, plotId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              plotId,
            }
          : u
      )
    );
  };

  const handleSave = async (user: AdminUserSummary) => {
    if (!user.areaId || !user.plotId) return;

    try {
      setSavingUserId(user.id);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          areaId: user.areaId,
          plotId: user.plotId,
        }),
      });

      if (!res.ok) {
        console.error("Failed to save user mapping", await res.text());
        return;
      }

      const updated = (await res.json()) as AdminUserSummary;
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
      );
    } catch (err) {
      console.error("Error saving user mapping", err);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            User ↔ Plot Assignments
          </h2>
          <p className="text-xs text-slate-400">
            Link citizen accounts to specific plots and industrial areas so
            encroachment violations reach the correct user.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-emerald-400/60 px-3 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10"
          onClick={loadUsers}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-xs text-slate-400 italic">
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className="p-6 text-xs text-slate-400 italic">
          No citizen users found yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-xs"
            >
              <div className="min-w-[180px] space-y-1">
                <p className="font-semibold text-slate-100">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-slate-400">
                    Industrial Area
                  </span>
                  <select
                    className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-[11px] text-slate-100 outline-none ring-emerald-400/40 focus:border-emerald-400 focus:ring-1"
                    value={user.areaId ?? ""}
                    onChange={(e) =>
                      handleChangeArea(user.id, e.target.value as IndustrialAreaId)
                    }
                  >
                    <option value="">Select area</option>
                    {visibleAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-slate-400">
                    Plot ID
                  </span>
                  <input
                    type="text"
                    className="w-24 rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-[11px] text-slate-100 outline-none ring-emerald-400/40 focus:border-emerald-400 focus:ring-1"
                    value={user.plotId ?? ""}
                    onChange={(e) => handleChangePlot(user.id, e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>

                <button
                  type="button"
                  className="mt-4 rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
                  onClick={() => handleSave(user)}
                  disabled={savingUserId === user.id || !user.areaId || !user.plotId}
                >
                  {savingUserId === user.id ? "Saving..." : "Save Mapping"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

