"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  INDUSTRIAL_AREAS,
  IndustrialAreaId,
} from "@/lib/config/areas";

interface AreaAnalysisPanelProps {
  onAnalyze?: (areaId: IndustrialAreaId) => void;
  isAnalyzing?: boolean;
}

type AdminRole = "state_admin" | "district_admin" | "block_admin" | "user" | null;

function filterAreasForRole(role: AdminRole) {
  if (role === "district_admin") {
    // District admins: Industrial Area 1 & 2 only
    return INDUSTRIAL_AREAS.filter((a) => a.id === "area-1" || a.id === "area-2");
  }
  if (role === "block_admin") {
    // Block admins: Industrial Area 1 only
    return INDUSTRIAL_AREAS.filter((a) => a.id === "area-1");
  }
  // State admins and others: all areas
  return INDUSTRIAL_AREAS;
}

export function AreaAnalysisPanel({
  onAnalyze,
  isAnalyzing = false,
}: AreaAnalysisPanelProps) {
  const [selectedAreaId, setSelectedAreaId] =
    useState<IndustrialAreaId>("area-1");
  const [adminRole, setAdminRole] = useState<AdminRole>(null);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        const role = (data.user?.role ?? "user") as AdminRole;
        setAdminRole(role);
      } catch (err) {
        console.error("Failed to load admin role for areas", err);
      }
    };
    loadRole();
  }, []);

  const visibleAreas = filterAreasForRole(adminRole);

  useEffect(() => {
    if (!visibleAreas.length) return;
    const exists = visibleAreas.some((a) => a.id === selectedAreaId);
    if (!exists) {
      setSelectedAreaId(visibleAreas[0].id);
    }
  }, [adminRole, selectedAreaId, visibleAreas]);

  const selectedArea =
    visibleAreas.find((area) => area.id === selectedAreaId) ??
    visibleAreas[0] ??
    INDUSTRIAL_AREAS[0];

  const handleAnalyzeClick = () => {
    if (!selectedArea || !onAnalyze) return;
    onAnalyze(selectedArea.id);
  };

  return (
    <section className="space-y-4 rounded-3xl border border-emerald-500/20 bg-slate-950/60 p-5 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Encroachment Analyzer
          </h2>
          <p className="text-xs text-slate-400">
            Select an industrial area to compare official vs satellite maps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="industrial-area"
            className="text-[11px] font-medium text-slate-300"
          >
            Industrial Area
          </label>
          <select
            id="industrial-area"
            className="rounded-full border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 shadow-sm outline-none ring-emerald-400/40 focus:border-emerald-400 focus:ring-1"
            value={selectedAreaId}
            onChange={(e) =>
              setSelectedAreaId(e.target.value as IndustrialAreaId)
            }
          >
            {visibleAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Official Layout
          </p>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
            <div className="relative h-56 w-full md:h-64">
              <Image
                src={selectedArea.officialMapPath}
                alt={`${selectedArea.name} official map`}
                fill
                className="object-contain"
                sizes="(min-width: 768px) 50vw, 100vw"
                priority
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Latest Satellite View
          </p>
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-950/80">
            <div className="relative h-56 w-full md:h-64">
              <Image
                src={selectedArea.satelliteMapPath}
                alt={`${selectedArea.name} satellite map`}
                fill
                className="object-contain"
                sizes="(min-width: 768px) 50vw, 100vw"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex-1">
          <p className="text-[11px] text-slate-400">
            The analyzer will run the Python pipeline using the selected area
            maps and generate an encroachment report.
          </p>
          {isAnalyzing && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/2 animate-[progress_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
        >
          {isAnalyzing && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          )}
          <span>
            {isAnalyzing ? "Analyzing Encroachment..." : "Analyze Encroachment"}
          </span>
        </button>
      </div>
    </section>
  );
}

