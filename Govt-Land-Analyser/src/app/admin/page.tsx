"use client";
import { useEffect, useState } from "react";
import type { IndustrialAreaId } from "@/lib/config/areas";
import { AreaAnalysisPanel } from "@/components/admin/AreaAnalysisPanel";
import { ViolationMap } from "@/components/admin/ViolationMap";

interface AnalyzeResult {
  success: boolean;
  areaId: IndustrialAreaId;
  usedMock: boolean;
  reportPdfPath?: string;
  outputImagePath?: string;
  reportFileId?: string | null;
  reportUrl?: string | null;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalyzeResult | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests/all");
      if (res.ok) {
        const data = await res.json();
        setRequests(data || []);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeArea = async (areaId: IndustrialAreaId) => {
    try {
      setIsAnalyzing(true);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaId }),
      });

      if (!res.ok) {
        console.error("Analyze request failed", await res.text());
        return;
      }

      const data = (await res.json()) as AnalyzeResult;
      setLastAnalysis(data);
    } catch (err) {
      console.error("Analyze request error", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchRequests(); // Initial load

    // DATABASE SYNC: Poll every 3 seconds to reflect changes immediately
    const interval = setInterval(() => {
      fetchRequests();
    }, 3000);

    return () => clearInterval(interval); // Cleanup timer on page leave
  }, []);

  const handleAction = async (
    requestId: string,
    action: "accept" | "decline"
  ) => {
    // Optimistic UI: Hide buttons immediately to prevent double-clicking
    const res = await fetch("/api/admin/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });

    if (res.ok) {
      fetchRequests(); // Trigger instant reload of the list
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <AreaAnalysisPanel
          onAnalyze={handleAnalyzeArea}
          isAnalyzing={isAnalyzing}
        />
        {lastAnalysis && (
          <ViolationMap
            areaId={lastAnalysis.areaId}
            reportUrl={lastAnalysis.reportUrl ?? undefined}
            reportFileId={lastAnalysis.reportFileId ?? undefined}
          />
        )}
        <div className="p-10 text-emerald-500 animate-pulse font-mono">
          SYNCING CONSOLE...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <AreaAnalysisPanel
        onAnalyze={handleAnalyzeArea}
        isAnalyzing={isAnalyzing}
      />

      {lastAnalysis && (
        <ViolationMap
          areaId={lastAnalysis.areaId}
          reportUrl={lastAnalysis.reportUrl ?? undefined}
          reportFileId={lastAnalysis.reportFileId ?? undefined}
        />
      )}

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-tighter">
            Live Applications
          </h3>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full animate-pulse">
            ● Live Sync Active
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 border border-white/5 bg-slate-900/20 rounded-3xl text-slate-500 text-center italic">
            No pending requests.
          </div>
        ) : (
          requests.map((req: any) => (
            <div
              key={req._id}
              className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-white/10 bg-slate-950/50 shadow-md hover:border-emerald-500/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black">
                    PLOT {req.plotId}
                  </span>
                  <span className="text-slate-200 font-medium">
                    {req.quotedBy}
                  </span>
                </div>
                <p className="text-xs text-slate-400 italic">
                  "{req.purpose}"
                </p>
                <p className="text-emerald-400 font-bold">
                  ₹{req.quotedPrice.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(req._id, "decline")}
                  className="px-5 py-2 rounded-full border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAction(req._id, "accept")}
                  className="px-5 py-2 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Approve & Clear Plot
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}