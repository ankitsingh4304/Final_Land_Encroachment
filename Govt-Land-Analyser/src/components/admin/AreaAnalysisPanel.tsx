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
    <section className="space-y-4 border border-gray-300 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Encroachment Analyzer
          </h2>
          <p className="text-xs text-gray-600">
            Select an industrial area to compare official vs satellite maps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="industrial-area"
            className="text-xs font-medium text-gray-700"
          >
            Industrial Area
          </label>
          <select
            id="industrial-area"
            className="border border-gray-400 bg-white px-3 py-1.5 text-xs text-gray-900 shadow-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
            Official Layout
          </p>
          <div className="relative overflow-hidden border border-gray-300 bg-gray-50">
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
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
            Latest Satellite View
          </p>
          <div className="relative overflow-hidden border border-blue-600 bg-gray-50">
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
          <p className="text-xs text-gray-600">
            The analyzer will run the Python pipeline using the selected area
            maps and generate an encroachment report.
          </p>
          {isAnalyzing && (
            <div className="mt-2 h-1.5 w-full overflow-hidden bg-gray-200">
              <div className="h-full w-1/2 animate-[progress_1.2s_ease-in-out_infinite] bg-blue-600" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          <span>
            {isAnalyzing ? "Analyzing Encroachment..." : "Analyze Encroachment"}
          </span>
        </button>
      </div>
    </section>
  );
}

