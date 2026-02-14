"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPicker } from "@/components/MapPicker";
import { LandRequestForm } from "@/components/LandRequestForm";
import type { IndustrialAreaId } from "@/lib/config/areas";

interface UserViolation {
  areaId: string;
  plotId: string;
  violationStatus: boolean;
  reportPdfPath?: string | null;
  reportFileId?: string | null;
  reportUrl?: string | null;
  adminComments?: string | null;
  analyzedAt?: string;
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

  useEffect(() => {
    loadData(selectedAreaId); // Initial load
    loadViolation(); // Check violation status
    loadLease(); // Check lease status

    // Polling: Refresh data every 5 seconds to catch Admin approvals / updates
    const interval = setInterval(() => {
      loadData(selectedAreaId);
      loadViolation();
      loadLease();
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

  // Handle successful submission
  const handleRefresh = () => {
    loadData(selectedAreaId); // Update local state
    loadViolation(); // Refresh violation state
    loadLease(); // Refresh lease state
    router.refresh(); // Tell Next.js to refresh server cache
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
            {violation?.reportUrl && (
              <a
                href={violation.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Download Encroachment Report (PDF)
                <span className="text-base">↓</span>
              </a>
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

      <div className="border-t border-gray-300 pt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          Your Applications
        </h2>
        <div className="bg-gray-50 p-6 border border-gray-300 text-gray-600 text-sm">
          Fetching your active requests...
        </div>
      </div>
    </main>
  );
}