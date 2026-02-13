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
    <section className="space-y-4 border border-red-600 bg-red-50 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-800">
            Flag Plots for Violations
          </h2>
          <p className="text-xs text-gray-700">
            Click on any plot in the layout to flag it for encroachment for the
            selected industrial area.
          </p>
        </div>
        {reportUrl && (
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-red-600 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md border border-gray-300 bg-white p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-900">
              Flag Plot {selectedPlot.plotId} for Violation?
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              This will mark the plot as encroached and notify the associated
              citizen account, if linked.
            </p>

            <label className="mt-4 block text-xs font-medium text-gray-700">
              Admin comments (optional)
              <textarea
                className="mt-1 w-full border border-gray-400 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                rows={3}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Example: Encroachment observed on north-east corner compared to official boundary."
              />
            </label>

            <div className="mt-4 flex justify-end gap-3 text-xs">
              <button
                type="button"
                className="border border-gray-400 px-4 py-1.5 text-gray-700 hover:bg-gray-50"
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
                className="bg-red-600 px-4 py-1.5 font-semibold text-white shadow-md hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        <p className="text-xs text-gray-700">
          {lastMessage}
        </p>
      )}
    </section>
  );
}

