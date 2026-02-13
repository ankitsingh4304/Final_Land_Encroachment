"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPicker } from "@/components/MapPicker";
import { LandRequestForm } from "@/components/LandRequestForm";

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
  const [lease, setLease] = useState<UserLease | null>(null);
  const [leaseLoading, setLeaseLoading] = useState(true);
  const router = useRouter();

  // Function to fetch latest data
  const loadData = async () => {
    try {
      const res = await fetch("/api/plots");
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
    loadData(); // Initial load
    loadViolation(); // Check violation status
    loadLease(); // Check lease status

    // Polling: Refresh data every 5 seconds to catch Admin approvals / updates
    const interval = setInterval(() => {
      loadData();
      loadViolation();
      loadLease();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle successful submission
  const handleRefresh = () => {
    loadData(); // Update local state
    loadViolation(); // Refresh violation state
    loadLease(); // Refresh lease state
    router.refresh(); // Tell Next.js to refresh server cache
  };

  const hasViolation = violation?.violationStatus;
  const leaseWarning =
    lease && (lease.status === "expired" || lease.status === "warning_sent");

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10 min-h-screen">
      <section className="space-y-4">
        {!leaseLoading && lease && (
          <div
            className={`rounded-3xl border p-4 text-sm shadow-[0_0_24px_rgba(59,130,246,0.3)] ${
              leaseWarning
                ? "border-amber-500 bg-amber-500/10 text-amber-50"
                : "border-blue-500/60 bg-blue-500/10 text-blue-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
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
            <p className="mt-1 text-xs text-slate-100/80">
              Winning bid: ₹{lease.bidPrice.toLocaleString("en-IN")}
            </p>
          </div>
        )}

        {!violationLoading && hasViolation && (
          <div className="rounded-3xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
              Encroachment Detected
            </p>
            <p className="mt-1 text-sm">
              Our encroachment analysis has flagged your allotted plot for
              potential violation. Please review the official report and contact
              the authority if you believe this is incorrect.
            </p>
            {violation?.adminComments && (
              <p className="mt-2 text-xs text-red-100/80 italic">
                Admin note: {violation.adminComments}
              </p>
            )}
            {violation?.reportUrl && (
              <a
                href={violation.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-red-400"
              >
                Download Encroachment Report (PDF)
                <span className="text-base">↓</span>
              </a>
            )}
          </div>
        )}

        {!violationLoading && !hasViolation && (
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm text-emerald-100">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
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
        />
      </section>

      <section>
        <LandRequestForm selectedPlot={selectedPlot} onSuccess={handleRefresh} />
      </section>

      <div className="border-t border-white/5 pt-10">
        <h2 className="text-xl font-bold mb-4 text-slate-200">
          Your Applications
        </h2>
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 text-slate-500 text-sm italic">
          Fetching your active requests...
        </div>
      </div>
    </main>
  );
}