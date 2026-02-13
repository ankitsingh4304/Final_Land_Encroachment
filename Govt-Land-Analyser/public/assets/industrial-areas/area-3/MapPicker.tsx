"use client";
import React from "react";

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
}

export function MapPicker({ plots = [], selectedPlotId, onSelect }: MapPickerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-950 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
      <div className="relative w-full" style={{ aspectRatio: "1020 / 872" }}>
        <svg viewBox="0 0 1020 872" className="absolute inset-0 h-full w-full">
          <image href="/layout.png" x="0" y="0" width="1020" height="872" />

          {Array.isArray(plots) && plots.map((plot) => {
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

            return (
              <polygon
                key={plot._id}
                points={plot.points}
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected ? "3" : "1"}
                className={`transition-all duration-300 outline-none ${
                  isBought 
                    ? "cursor-not-allowed" 
                    : isSelected 
                      ? "cursor-pointer" // No hover class here keeps it yellow
                      : "cursor-pointer hover:fill-emerald-400/60"
                }`}
                onClick={() => !isBought && onSelect(plot)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}