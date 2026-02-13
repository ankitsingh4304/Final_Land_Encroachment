"use client";
import React from "react";
import type { IndustrialAreaId } from "@/lib/config/areas";
import { getIndustrialAreaById } from "@/lib/config/areas";

interface Plot {
  _id: string;
  plotId: number;
  points: string;
  bought: boolean;
}

interface MapPickerProps {
  plots: Plot[];
  selectedPlotId: number | null;
  onSelect: (plot: Plot) => void;
  /**
   * When true, even "bought" plots can be clicked.
   * Used for admin views like encroachment flagging.
   */
  allowClickOnBought?: boolean;
  /**
   * Currently selected industrial area (e.g. "area-1" / "area-2").
   * If not provided, defaults to "area-1".
   */
  areaId?: IndustrialAreaId;
  /**
   * Called when the user changes the industrial sector from the dropdown.
   * Parent components should keep the selected area in sync so that
   * MapPicker and LandRequestForm show the same selection.
   */
  onAreaChange?: (areaId: IndustrialAreaId) => void;
}

export function MapPicker({
  plots = [],
  selectedPlotId,
  onSelect,
  allowClickOnBought = false,
  areaId,
  onAreaChange,
}: MapPickerProps) {
  const effectiveAreaId: IndustrialAreaId = areaId ?? "area-1";

  const areaConfig = getIndustrialAreaById(effectiveAreaId) ?? getIndustrialAreaById("area-1")!;

  const AREA_DIMENSIONS: Record<IndustrialAreaId, { width: number; height: number }> = {
    "area-1": { width: 1020, height: 872 },
    "area-2": { width: 1274, height: 564 },
    "area-3": { width: 1532, height: 479 }, // As specified in the requirements
  };

  const { width, height } = AREA_DIMENSIONS[effectiveAreaId];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-950 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-500/20 bg-slate-900/40 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Select Industrial Sector
        </h3>
        <select
          className="rounded-full border border-emerald-400/60 bg-slate-950 px-3 py-1 text-xs text-slate-100 outline-none ring-emerald-400/40 focus:border-emerald-400 focus:ring-1"
          value={effectiveAreaId}
          onChange={(e) => {
            const next = e.target.value as IndustrialAreaId;
            onAreaChange?.(next);
          }}
        >
          <option value="area-1">Industrial Sector 1</option>
          <option value="area-2">Industrial Sector 2</option>
          <option value="area-3">Industrial Sector 3</option>
        </select>
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full">
          <image href={areaConfig.officialMapPath} x="0" y="0" width={width} height={height} />

          {Array.isArray(plots) &&
            plots.map((plot) => {
              const isSelected = selectedPlotId === plot.plotId;
              const isBought = plot.bought;

              // Styles
              let fill = "rgba(16, 185, 129, 0.4)"; // Green
              let stroke = "#10b981";

              if (isBought) {
                fill = "rgba(239, 68, 68, 0.6)"; // Red
                stroke = "#ef4444";
              } else if (isSelected) {
                fill = "rgba(250, 204, 21, 0.7)"; // Yellow
                stroke = "#facc15";
              }

              const clickable = allowClickOnBought || !isBought;

              return (
                <polygon
                  key={plot._id}
                  points={plot.points}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? "3" : "1"}
                  className={`transition-all duration-300 outline-none ${
                    clickable
                      ? isSelected
                        ? "cursor-pointer"
                        : "cursor-pointer hover:fill-emerald-400/60"
                      : "cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (clickable) onSelect(plot);
                  }}
                />
              );
            })}
        </svg>
      </div>
    </div>
  );
}