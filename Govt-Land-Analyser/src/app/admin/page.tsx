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

      const responseText = await res.text();
      let errorData;
      
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        // If response is not JSON, use the text as error message
        errorData = { error: responseText || "Unknown error occurred" };
      }

      if (!res.ok) {
        const errorMessage = errorData.details || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        const suggestion = errorData.suggestion || "";
        const fullMessage = `Analysis failed: ${errorMessage}${suggestion ? `\n\nSuggestion: ${suggestion}` : ""}`;
        alert(fullMessage);
        
        // Enhanced error logging
        const errorInfo = {
          status: res.status,
          statusText: res.statusText,
          errorData: errorData,
          responseText: responseText,
          url: res.url,
        };
        console.error("Analyze request failed", errorInfo);
        console.error("Full error details:", JSON.stringify(errorInfo, null, 2));
        return;
      }

      const data = JSON.parse(responseText) as AnalyzeResult;
      setLastAnalysis(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error occurred";
      alert(`Analysis error: ${errorMessage}`);
      console.error("Analyze request error (catch block):", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
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
      <div className="max-w-5xl mx-auto p-6 space-y-8 bg-white">
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
        <div className="p-10 text-blue-600 animate-pulse">
          SYNCING CONSOLE...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-white">
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
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Live Applications
          </h3>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 border border-blue-200 animate-pulse">
            ● Live Sync Active
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 border border-gray-300 bg-gray-50 text-gray-600 text-center">
            No pending requests.
          </div>
        ) : (
          requests.map((req: any) => (
            <div
              key={req._id}
              className="flex flex-wrap items-center justify-between gap-4 p-5 border border-gray-300 bg-white shadow-sm hover:border-blue-600 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 font-bold">
                    PLOT {req.plotId}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {req.quotedBy}
                  </span>
                </div>
                <p className="text-xs text-gray-600 italic">
                  "{req.purpose}"
                </p>
                <p className="text-blue-700 font-bold">
                  ₹{req.quotedPrice.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(req._id, "decline")}
                  className="px-5 py-2 border border-red-600 text-red-600 text-xs font-bold hover:bg-red-50 transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAction(req._id, "accept")}
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-md"
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