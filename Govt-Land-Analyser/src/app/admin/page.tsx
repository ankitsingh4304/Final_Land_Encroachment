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

type AdminRole = "district_admin" | "state_admin" | "block_admin";

export default function AdminDashboard() {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [districtRequests, setDistrictRequests] = useState<any[]>([]);
  const [stateRequests, setStateRequests] = useState<any[]>([]);
  const [districtAppeals, setDistrictAppeals] = useState<any[]>([]);
  const [stateAppeals, setStateAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalyzeResult | null>(null);

  const loadMe = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setRole(data.user?.role || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadDistrictRequests = async () => {
    try {
      const res = await fetch("/api/requests/district");
      if (res.ok) {
        const data = await res.json();
        setDistrictRequests(Array.isArray(data) ? data : []);
      } else {
        setDistrictRequests([]);
      }
    } catch (e) {
      setDistrictRequests([]);
    }
  };

  const loadStateRequests = async () => {
    try {
      const res = await fetch("/api/requests/state");
      if (res.ok) {
        const data = await res.json();
        setStateRequests(Array.isArray(data) ? data : []);
      } else {
        setStateRequests([]);
      }
    } catch (e) {
      setStateRequests([]);
    }
  };

  const loadDistrictAppeals = async () => {
    try {
      const res = await fetch("/api/appeals/district");
      if (res.ok) {
        const data = await res.json();
        setDistrictAppeals(Array.isArray(data) ? data : []);
      } else {
        setDistrictAppeals([]);
      }
    } catch (e) {
      setDistrictAppeals([]);
    }
  };

  const loadStateAppeals = async () => {
    try {
      const res = await fetch("/api/appeals/state");
      if (res.ok) {
        const data = await res.json();
        setStateAppeals(Array.isArray(data) ? data : []);
      } else {
        setStateAppeals([]);
      }
    } catch (e) {
      setStateAppeals([]);
    }
  };

  const fetchAll = async () => {
    await loadMe();
    await loadDistrictRequests();
    await loadStateRequests();
    await loadDistrictAppeals();
    await loadStateAppeals();
    setLoading(false);
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
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { error: responseText || "Unknown error" };
      }
      if (!res.ok) {
        const msg = errorData.details || errorData.error || responseText;
        alert(`Analysis failed: ${msg}`);
        return;
      }
      const data = JSON.parse(responseText) as AnalyzeResult;
      setLastAnalysis(data);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDistrictRequestDecision = async (requestId: string, action: "approve" | "reject") => {
    const id = typeof requestId === "string" ? requestId : (requestId as any)?.toString?.() ?? requestId;
    const res = await fetch("/api/requests/district/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, action }),
    });
    const data = await res.json();
    if (res.ok) {
      loadDistrictRequests();
    } else {
      alert(data.error || "Action failed");
    }
  };

  const handleStateRequestDecision = async (requestId: string, action: "accept" | "decline") => {
    const res = await fetch("/api/admin/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: action === "accept" ? "accept" : "decline" }),
    });
    const data = await res.json();
    if (res.ok) {
      loadStateRequests();
    } else {
      alert(data.error || "Action failed");
    }
  };

  const handleDistrictAppealDecision = async (appealId: string, action: "approve" | "reject" | "forward") => {
    const res = await fetch("/api/appeals/district/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appealId, action }),
    });
    const data = await res.json();
    if (res.ok) {
      loadDistrictAppeals();
    } else {
      alert(data.error || "Action failed");
    }
  };

  const handleStateAppealDecision = async (appealId: string, action: "approve" | "reject") => {
    const res = await fetch("/api/appeals/state/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appealId, action }),
    });
    const data = await res.json();
    if (res.ok) {
      loadStateAppeals();
    } else {
      alert(data.error || "Action failed");
    }
  };

  const showDistrict = role === "district_admin" || role === "block_admin";
  const showState = role === "state_admin";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-white">
      <AreaAnalysisPanel onAnalyze={handleAnalyzeArea} isAnalyzing={isAnalyzing} />
      {lastAnalysis && (
        <ViolationMap
          areaId={lastAnalysis.areaId}
          reportUrl={lastAnalysis.reportUrl ?? undefined}
          reportFileId={lastAnalysis.reportFileId ?? undefined}
        />
      )}

      {loading && districtRequests.length === 0 && stateRequests.length === 0 && (
        <div className="p-10 text-blue-600 animate-pulse">Loading...</div>
      )}

      {showDistrict && (
        <>
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              District queue – Land requests
            </h3>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 border border-blue-200">● Live</span>
            {districtRequests.length === 0 ? (
              <div className="p-6 border border-gray-300 bg-gray-50 text-gray-600 text-center text-sm">
                No requests pending at District.
              </div>
            ) : (
              districtRequests.map((req: any) => (
                <div
                  key={req._id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 border border-gray-300 bg-white shadow-sm"
                >
                  <div>
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 font-bold">PLOT {req.plotId}</span>
                    <span className="ml-2 font-medium text-gray-900">{req.quotedBy}</span>
                    <p className="text-xs text-gray-600 mt-1">"{req.purpose}" – ₹{req.quotedPrice?.toLocaleString("en-IN")}</p>
                  </div>
                  {role === "district_admin" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDistrictRequestDecision(req._id, "reject")}
                        className="px-4 py-2 border border-red-600 text-red-600 text-xs font-bold hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDistrictRequestDecision(req._id, "approve")}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                      >
                        Approve → State Admin
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              District queue – Appeals
            </h3>
            {districtAppeals.length === 0 ? (
              <div className="p-6 border border-gray-300 bg-gray-50 text-gray-600 text-center text-sm">
                No appeals pending at District.
              </div>
            ) : (
              districtAppeals.map((a: any) => (
                <div key={a._id || a.id} className="flex flex-wrap items-center justify-between gap-4 p-4 border border-amber-200 bg-amber-50/50 shadow-sm">
                  <div>
                    <span className="text-xs font-semibold text-gray-700">{a.user?.email ?? a.user?.name ?? "User"}</span>
                    <p className="text-sm text-gray-800 mt-1">{a.userMessage}</p>
                    {a.violation && (
                      <p className="text-xs text-gray-600">Violation: Plot {a.violation.plotId}, Area {a.violation.areaId}</p>
                    )}
                  </div>
                  {role === "district_admin" && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleDistrictAppealDecision(a._id || a.id, "reject")}
                        className="px-3 py-1.5 border border-red-600 text-red-600 text-xs font-bold hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDistrictAppealDecision(a._id || a.id, "forward")}
                        className="px-3 py-1.5 border border-gray-600 text-gray-700 text-xs font-bold hover:bg-gray-100"
                      >
                        Forward to State
                      </button>
                      <button
                        onClick={() => handleDistrictAppealDecision(a._id || a.id, "approve")}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold hover:bg-green-700"
                      >
                        Approve (found correct) → State
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        </>
      )}

      {showState && (
        <>
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              State queue – Land requests (approve = allocate)
            </h3>
            {stateRequests.length === 0 ? (
              <div className="p-6 border border-gray-300 bg-gray-50 text-gray-600 text-center text-sm">
                No requests pending at State.
              </div>
            ) : (
              stateRequests.map((req: any) => (
                <div
                  key={req._id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 border border-gray-300 bg-white shadow-sm"
                >
                  <div>
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 font-bold">PLOT {req.plotId}</span>
                    <span className="ml-2 font-medium text-gray-900">{req.quotedBy}</span>
                    <p className="text-xs text-gray-600 mt-1">"{req.purpose}" – ₹{req.quotedPrice?.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStateRequestDecision(req._id, "decline")}
                      className="px-4 py-2 border border-red-600 text-red-600 text-xs font-bold hover:bg-red-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleStateRequestDecision(req._id, "accept")}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                    >
                      Approve & Allocate
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              State queue – Appeals
            </h3>
            {stateAppeals.length === 0 ? (
              <div className="p-6 border border-gray-300 bg-gray-50 text-gray-600 text-center text-sm">
                No appeals pending at State.
              </div>
            ) : (
              stateAppeals.map((a: any) => (
                <div key={a._id || a.id} className="flex flex-wrap items-center justify-between gap-4 p-4 border border-amber-200 bg-amber-50/50 shadow-sm">
                  <div>
                    <span className="text-xs font-semibold text-gray-700">{a.user?.email ?? a.user?.name ?? "User"}</span>
                    <p className="text-sm text-gray-800 mt-1">{a.userMessage}</p>
                    {a.districtRemark && <p className="text-xs text-gray-600 mt-1">District: {a.districtRemark}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStateAppealDecision(a._id || a.id, "reject")}
                      className="px-3 py-1.5 border border-red-600 text-red-600 text-xs font-bold hover:bg-red-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleStateAppealDecision(a._id || a.id, "approve")}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold hover:bg-green-700"
                    >
                      Approve (clear violation)
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}

      {role && role !== "district_admin" && role !== "state_admin" && role !== "block_admin" && (
        <div className="p-6 border border-gray-300 bg-gray-50 text-gray-600 text-center text-sm">
          No queue visible for your role. District Admin and State Admin see their respective queues.
        </div>
      )}
    </div>
  );
}
