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
    <div className="relative overflow-hidden border border-gray-300 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-300 bg-gray-50 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
          Select Industrial Sector
        </h3>
        <select
          className="border border-gray-400 bg-white px-3 py-1 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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
              let fill = "rgba(59, 130, 246, 0.3)"; // Light blue
              let stroke = "#3b82f6";

              if (isBought) {
                fill = "rgba(239, 68, 68, 0.4)"; // Light red
                stroke = "#dc2626";
              } else if (isSelected) {
                fill = "rgba(251, 191, 36, 0.5)"; // Light yellow
                stroke = "#f59e0b";
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
                        : "cursor-pointer hover:fill-blue-400/50"
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