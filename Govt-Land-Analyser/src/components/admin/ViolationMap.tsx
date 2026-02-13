"use client";

import { useEffect, useState } from "react";
import { MapPicker } from "@/components/MapPicker";
import type { IndustrialAreaId } from "@/lib/config/areas";

interface Plot {
  _id: string;
  plotId: number;
  points: string;
  bought: boolean;
}

interface ViolationMapProps {
  areaId: IndustrialAreaId;
  /**
   * URL to view/download the latest PDF report for the analyzed area.
   * Typically points to /api/reports/[id] backed by GridFS.
   */
  reportUrl?: string | null;
  /**
   * GridFS file id used to persist the report in MongoDB.
   */
  reportFileId?: string | null;
}

export function ViolationMap({
  areaId,
  reportUrl,
  reportFileId,
}: ViolationMapProps) {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [isFlagging, setIsFlagging] = useState(false);
  const [adminComments, setAdminComments] = useState("");
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadPlots = async () => {
      try {
        const res = await fetch(`/api/plots?area=${areaId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlots(data);
        }
      } catch (err) {
        console.error("Failed to load plots for violation map", err);
      }
    };

    loadPlots();
  }, []);

  const handleConfirmFlag = async () => {
    if (!selectedPlot) return;

    try {
      setIsFlagging(true);
      setLastMessage(null);

      const res = await fetch("/api/violations/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId,
          plotId: String(selectedPlot.plotId),
          adminComments: adminComments || undefined,
          reportFileId,
        }),
      });

      if (!res.ok) {
        console.error("Failed to flag violation", await res.text());
        setLastMessage("Failed to flag violation. Please try again.");
        return;
      }

      const data = await res.json();
      setLastMessage(
        `Plot ${selectedPlot.plotId} flagged for violation for user ${data.userEmail ?? "N/A"}.`
      );
      setSelectedPlot(null);
      setAdminComments("");
    } catch (err) {
      console.error("Error flagging violation", err);
      setLastMessage("Unexpected error while flagging violation.");
    } finally {
      setIsFlagging(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-red-500/30 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">
            Flag Plots for Violations
          </h2>
          <p className="text-xs text-slate-400">
            Click on any plot in the layout to flag it for encroachment for the
            selected industrial area.
          </p>
        </div>
        {reportUrl && (
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-red-400/60 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-500/20"
          >
            View Latest PDF Report
          </a>
        )}
      </div>

      <MapPicker
        plots={plots}
        selectedPlotId={selectedPlot?.plotId ?? null}
        onSelect={setSelectedPlot as any}
        allowClickOnBought
      />

      {selectedPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-100">
              Flag Plot {selectedPlot.plotId} for Violation?
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              This will mark the plot as encroached and notify the associated
              citizen account, if linked.
            </p>

            <label className="mt-4 block text-xs font-medium text-slate-300">
              Admin comments (optional)
              <textarea
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none ring-emerald-400/40 focus:border-emerald-400 focus:ring-1"
                rows={3}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Example: Encroachment observed on north-east corner compared to official boundary."
              />
            </label>

            <div className="mt-4 flex justify-end gap-3 text-xs">
              <button
                type="button"
                className="rounded-full border border-slate-500/60 px-4 py-1.5 text-slate-200 hover:bg-slate-800/80"
                onClick={() => {
                  setSelectedPlot(null);
                  setAdminComments("");
                }}
                disabled={isFlagging}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-red-500 px-4 py-1.5 font-semibold text-slate-950 shadow-lg shadow-red-500/30 hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-red-500/60"
                onClick={handleConfirmFlag}
                disabled={isFlagging}
              >
                {isFlagging ? "Flagging..." : "Confirm Flag"}
              </button>
            </div>
          </div>
        </div>
      )}

      {lastMessage && (
        <p className="text-[11px] text-slate-300">
          {lastMessage}
        </p>
      )}
    </section>
  );
}

