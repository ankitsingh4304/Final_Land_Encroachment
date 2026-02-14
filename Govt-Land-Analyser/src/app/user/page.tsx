"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPicker } from "@/components/MapPicker";
import { LandRequestForm } from "@/components/LandRequestForm";
import type { IndustrialAreaId } from "@/lib/config/areas";

interface UserViolation {
  id?: string;
  areaId: string;
  plotId: string;
  violationStatus: boolean;
  reportPdfPath?: string | null;
  reportFileId?: string | null;
  reportUrl?: string | null;
  adminComments?: string | null;
  analyzedAt?: string;
}

type RequestStage = "district_pending" | "state_pending" | "allocated" | "rejected";
interface UserRequest {
  id: string;
  plotId: number;
  quotedPrice: number;
  purpose: string;
  workflowStage: RequestStage;
  submittedAt: string;
}

type AppealStage =
  | "district_pending"
  | "district_approved"
  | "district_rejected"
  | "forwarded_to_state"
  | "state_pending"
  | "state_approved"
  | "state_rejected";
interface UserAppeal {
  id: string;
  violationId: string;
  userMessage: string;
  stage: AppealStage;
  districtRemark?: string | null;
  districtDecision?: string | null;
  stateRemark?: string | null;
  createdAt: string;
}

interface UserLease {
  id: string;
  plotId: number;
  areaId?: string | null;
  leaseYears: number;
  allotmentDate: string;
  leaseEndDate: string;
  status: "active" | "expired" | "warning_sent";
  bidPrice: number;
  remainingDays: number;
}

export default function UserDashboard() {
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [violation, setViolation] = useState<UserViolation | null>(null);
  const [violationLoading, setViolationLoading] = useState(true);
  const [showFlaggedDialog, setShowFlaggedDialog] = useState(false);
  const hasTriggeredDownload = useRef(false);
  const hasShownFlaggedDialog = useRef(false);

  const [lease, setLease] = useState<UserLease | null>(null);
  const [leaseLoading, setLeaseLoading] = useState(true);

  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [appeals, setAppeals] = useState<UserAppeal[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(true);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  const [selectedAreaId, setSelectedAreaId] = useState<IndustrialAreaId>("area-1");

  const router = useRouter();

  // Function to fetch latest data for the currently selected industrial area
  const loadData = async (areaId: IndustrialAreaId = selectedAreaId) => {
    try {
      const res = await fetch(`/api/plots?area=${areaId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlots(data);
      }
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  const loadViolation = async () => {
    try {
      setViolationLoading(true);
      const res = await fetch("/api/violations/mine");
      if (!res.ok) {
        setViolation(null);
        return;
      }
      const data = await res.json();
      setViolation(data.violation ?? null);
    } catch (error) {
      console.error("Violation fetch error:", error);
      setViolation(null);
    } finally {
      setViolationLoading(false);
    }
  };

  const loadLease = async () => {
    try {
      setLeaseLoading(true);
      const res = await fetch("/api/lease/mine");
      if (!res.ok) {
        setLease(null);
        return;
      }
      const data = await res.json();
      setLease(data.lease ?? null);
    } catch (error) {
      console.error("Lease fetch error:", error);
      setLease(null);
    } finally {
      setLeaseLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch("/api/requests/mine");
      if (!res.ok) {
        setRequests([]);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data.requests) ? data.requests : [];
      setRequests(list.map((r: any) => ({
        id: r.id || r._id?.toString() || "",
        plotId: r.plotId,
        quotedPrice: r.quotedPrice,
        purpose: r.purpose,
        workflowStage: (r.workflowStage || "district_pending") as RequestStage,
        submittedAt: r.submittedAt,
      })));
    } catch (error) {
      console.error("Requests fetch error:", error);
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadAppeals = async () => {
    try {
      setAppealsLoading(true);
      const res = await fetch("/api/appeals/mine");
      if (!res.ok) {
        setAppeals([]);
        return;
      }
      const data = await res.json();
      setAppeals(Array.isArray(data.appeals) ? data.appeals : []);
    } catch (error) {
      console.error("Appeals fetch error:", error);
      setAppeals([]);
    } finally {
      setAppealsLoading(false);
    }
  };

  const submitAppeal = async () => {
    if (!violation?.id || !appealMessage.trim()) return;
    setAppealSubmitting(true);
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          violationId: violation.id,
          userMessage: appealMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAppealForm(false);
        setAppealMessage("");
        loadAppeals();
        loadViolation();
        alert(data.message || "Appeal submitted.");
      } else {
        alert(data.error || "Failed to submit appeal.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit appeal.");
    } finally {
      setAppealSubmitting(false);
    }
  };

  useEffect(() => {
    loadData(selectedAreaId);
    loadViolation();
    loadLease();
    loadRequests();
    loadAppeals();

    const interval = setInterval(() => {
      loadData(selectedAreaId);
      loadViolation();
      loadLease();
      loadRequests();
      loadAppeals();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedAreaId]);

  // When user is flagged (violationStatus true), show dialog and trigger report download once per page load
  useEffect(() => {
    if (violationLoading || !violation?.violationStatus) return;
    if (hasShownFlaggedDialog.current) return;
    hasShownFlaggedDialog.current = true;
    setShowFlaggedDialog(true);
    if (violation.reportUrl && !hasTriggeredDownload.current) {
      hasTriggeredDownload.current = true;
      const link = document.createElement("a");
      link.href = violation.reportUrl;
      link.setAttribute("download", "encroachment-report.pdf");
      link.setAttribute("target", "_blank");
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [violationLoading, violation?.violationStatus, violation?.reportUrl]);

  const handleRefresh = () => {
    loadData(selectedAreaId);
    loadViolation();
    loadLease();
    loadRequests();
    loadAppeals();
    router.refresh();
  };

  const requestSteps = [
    { key: "district_pending", label: "Application under progress by District Authority" },
    { key: "state_pending", label: "Application under progress by State Admin" },
    { key: "allocated", label: "Allocated" },
  ];
  const appealStepLabels: Record<string, string> = {
    district_pending: "Appeal under review by District Authority",
    district_approved: "Forwarded to State Admin (District found correct)",
    district_rejected: "Rejected by District – You may appeal to State Admin",
    forwarded_to_state: "Forwarded to State Admin",
    state_pending: "Appeal under review by State Admin",
    state_approved: "Appeal upheld",
    state_rejected: "Appeal rejected by State Admin",
  };

  const hasViolation = violation?.violationStatus;
  const leaseWarning =
    lease && (lease.status === "expired" || lease.status === "warning_sent");

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8 min-h-screen bg-white">
      {/* Flagged violation dialog */}
      {showFlaggedDialog && violation?.violationStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="flagged-dialog-title"
        >
          <div className="w-full max-w-md rounded-lg border-2 border-red-600 bg-white p-6 shadow-xl">
            <h2
              id="flagged-dialog-title"
              className="text-lg font-bold text-red-800"
            >
              You have been flagged
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              Your plot has been flagged for an encroachment violation. Please
              review the report that has been downloaded and contact the
              authority if you need to clarify.
            </p>
            {violation.adminComments && (
              <div className="mt-3 rounded border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold uppercase text-red-800">
                  Reason
                </p>
                <p className="mt-1 text-sm text-red-900">
                  {violation.adminComments}
                </p>
              </div>
            )}
            <div className="mt-4 flex gap-3">
              {violation.reportUrl && (
                <a
                  href={violation.reportUrl}
                  download="encroachment-report.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Download report again
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowFlaggedDialog(false)}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-4">
        {!leaseLoading && lease && (
          <div
            className={`border p-4 text-sm shadow-sm ${
              leaseWarning
                ? "border-amber-500 bg-amber-50 text-amber-900"
                : "border-blue-600 bg-blue-50 text-blue-900"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide">
              {leaseWarning ? "Lease Warning" : "Lease Status"}
            </p>
            <p className="mt-1 text-sm">
              Your lease for plot {lease.plotId} is valid until{" "}
              {new Date(lease.leaseEndDate).toLocaleDateString()}.
            </p>
            {leaseWarning ? (
              <p className="mt-1 text-xs">
                This lease has reached its end date or has been flagged by the
                authority. Please contact the department for renewal or
                clarification.
              </p>
            ) : (
              <p className="mt-1 text-xs">
                Approximately {lease.remainingDays} days remaining on your
                lease.
              </p>
            )}
            <p className="mt-1 text-xs text-gray-700">
              Winning bid: ₹{lease.bidPrice.toLocaleString("en-IN")}
            </p>
          </div>
        )}

        {!violationLoading && hasViolation && (
          <div className="border border-red-600 bg-red-50 p-4 text-sm text-red-900 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
              Encroachment Detected
            </p>
            <p className="mt-1 text-sm">
              Our encroachment analysis has flagged your allotted plot for
              potential violation. Please review the official report and contact
              the authority if you believe this is incorrect.
            </p>
            {violation?.adminComments && (
              <p className="mt-2 text-xs text-red-800 italic">
                Admin note: {violation.adminComments}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {violation?.reportUrl && (
                <a
                  href={violation.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Download Encroachment Report (PDF)
                  <span className="text-base">↓</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowAppealForm(true)}
                className="inline-flex items-center gap-2 border-2 border-red-600 bg-white px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Appeal
              </button>
            </div>
            {!appealsLoading && appeals.length > 0 && (
              <div className="mt-4 border-t border-red-200 pt-3">
                <p className="text-xs font-semibold text-red-800">Appeal status</p>
                {appeals.slice(0, 2).map((a) => (
                  <div key={a.id} className="mt-2 rounded border border-red-200 bg-white p-3">
                    <p className="text-sm font-medium text-gray-900">{appealStepLabels[a.stage] || a.stage}</p>
                    {a.districtRemark && <p className="mt-1 text-xs text-gray-600">District: {a.districtRemark}</p>}
                    {a.stateRemark && <p className="mt-1 text-xs text-gray-600">State: {a.stateRemark}</p>}
                    {a.stage === "district_rejected" && (
                      <p className="mt-2 text-xs text-blue-700">You may submit another appeal to be sent directly to State Admin.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!violationLoading && !hasViolation && (
          <div className="border border-green-600 bg-green-50 p-4 text-sm text-green-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-800">
              No Violations Detected
            </p>
            <p className="mt-1 text-sm">
              There are currently no encroachment violations recorded against
              your allotted plot.
            </p>
          </div>
        )}
      </section>

      <section>
        <MapPicker
          plots={plots}
          selectedPlotId={selectedPlot?.plotId}
          onSelect={setSelectedPlot}
          areaId={selectedAreaId}
          onAreaChange={(area: IndustrialAreaId) => {
            setSelectedAreaId(area);
            setSelectedPlot(null);
            loadData(area);
          }}
        />
      </section>

      <section>
        <LandRequestForm
          selectedPlot={selectedPlot}
          onSuccess={handleRefresh}
          areaId={selectedAreaId}
          onAreaChange={(area: IndustrialAreaId) => {
            setSelectedAreaId(area);
            setSelectedPlot(null);
            loadData(area);
          }}
        />
      </section>

      <section className="border-t border-gray-300 pt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          Land request status
        </h2>
        {requestsLoading ? (
          <div className="bg-gray-50 p-6 border border-gray-300 text-gray-600 text-sm">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="bg-gray-50 p-6 border border-gray-300 text-gray-600 text-sm">
            You have not submitted any land requests yet. Select a plot above and submit an application.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="border border-gray-300 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="font-semibold text-gray-900">Plot #{req.plotId}</span>
                  <span className="text-sm text-gray-600">₹{req.quotedPrice?.toLocaleString("en-IN")} · {req.purpose}</span>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  {requestSteps.map((step, i) => {
                    const reached = req.workflowStage === step.key ||
                      (step.key === "state_pending" && req.workflowStage === "allocated") ||
                      (step.key === "district_pending" && req.workflowStage !== "district_pending");
                    const current = req.workflowStage === step.key;
                    const rejected = req.workflowStage === "rejected";
                    return (
                      <div key={step.key} className="flex items-center gap-2">
                        <span className={`inline-block h-3 w-3 rounded-full ${current ? "bg-blue-600 ring-2 ring-blue-300" : reached ? "bg-green-600" : "bg-gray-300"}`} />
                        <span className={`text-sm ${current ? "font-semibold text-blue-900" : reached ? "text-green-800" : "text-gray-500"}`}>
                          {step.key === "allocated" && rejected ? "Rejected" : step.label}
                        </span>
                        {i < requestSteps.length - 1 && <span className="text-gray-300">→</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAppealForm && violation?.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-gray-300 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Submit appeal</h3>
            <p className="mt-1 text-sm text-gray-600">Explain why you believe the flagging is incorrect. Your appeal will be reviewed by District Authority first.</p>
            <textarea
              value={appealMessage}
              onChange={(e) => setAppealMessage(e.target.value)}
              placeholder="Your reason for appeal..."
              className="mt-3 w-full border border-gray-300 p-3 text-sm rounded min-h-[100px]"
              rows={4}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={submitAppeal} disabled={appealSubmitting || !appealMessage.trim()} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Submit</button>
              <button type="button" onClick={() => { setShowAppealForm(false); setAppealMessage(""); }} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}