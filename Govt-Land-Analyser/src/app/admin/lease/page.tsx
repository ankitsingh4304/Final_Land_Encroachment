\"use client\";

import { useEffect, useState } from \"react\";
import { MapPicker } from \"@/components/MapPicker\";
import { INDUSTRIAL_AREAS, type IndustrialAreaId } from \"@/lib/config/areas\";

interface Plot {
  _id: string;
  plotId: number;
  points: string;
  bought: boolean;
}

interface LeaseDetails {
  id: string;
  userEmail: string;
  plotId: number;
  areaId?: string | null;
  leaseYears: number;
  allotmentDate: string;
  leaseEndDate: string;
  status: "active" | "expired" | "warning_sent";
  bidPrice: number;
  remainingDays: number;
}

type AdminRole = \"state_admin\" | \"district_admin\" | \"block_admin\" | \"user\" | null;

function filterAreasForRole(role: AdminRole) {
  if (role === \"district_admin\") {
    return INDUSTRIAL_AREAS.filter((a) => a.id === \"area-1\" || a.id === \"area-2\");
  }
  if (role === \"block_admin\") {
    return INDUSTRIAL_AREAS.filter((a) => a.id === \"area-1\");
  }
  return INDUSTRIAL_AREAS;
}

export default function LeaseAdminPage() {
  const [selectedAreaId, setSelectedAreaId] =
    useState<IndustrialAreaId>(\"area-1\");
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [isLoadingLease, setIsLoadingLease] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);

  useEffect(() => {
    const loadPlots = async () => {
      try {
        const res = await fetch("/api/plots");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlots(data);
        }
      } catch (err) {
        console.error("Failed to load plots for lease admin", err);
      }
    };

    loadPlots();
  }, []);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const res = await fetch(\"/api/auth/me\");
        if (!res.ok) return;
        const data = await res.json();
        const role = (data.user?.role ?? \"user\") as AdminRole;
        setAdminRole(role);
      } catch (err) {
        console.error(\"Failed to load admin role for lease areas\", err);
      }
    };
    loadRole();
  }, []);

  const visibleAreas = filterAreasForRole(adminRole);

  useEffect(() => {
    if (!visibleAreas.length) return;
    const exists = visibleAreas.some((a) => a.id === selectedAreaId);
    if (!exists) {
      setSelectedAreaId(visibleAreas[0].id);
    }
  }, [adminRole, selectedAreaId, visibleAreas]);

  const handleSelectPlot = async (plot: Plot) => {
    setSelectedPlot(plot);
    setLease(null);
    setIsLoadingLease(true);

    try {
      const res = await fetch(`/api/lease/plot?plotId=${plot.plotId}`);
      if (!res.ok) {
        console.error("Failed to load lease for plot", await res.text());
        return;
      }
      const data = await res.json();
      setLease(data.lease ?? null);
    } catch (err) {
      console.error("Error fetching lease for plot", err);
    } finally {
      setIsLoadingLease(false);
    }
  };

  const handleFlagLease = async () => {
    if (!lease) return;
    try {
      setFlagging(true);
      const res = await fetch("/api/lease/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId: lease.id }),
      });
      if (!res.ok) {
        console.error("Failed to flag lease", await res.text());
        return;
      }
      const data = await res.json();
      setLease((prev) =>
        prev ? { ...prev, status: data.status as LeaseDetails["status"] } : prev
      );
    } catch (err) {
      console.error("Error flagging lease", err);
    } finally {
      setFlagging(false);
    }
  };

  const selectedArea = visibleAreas.find(
    (a) => a.id === selectedAreaId
  ) ?? visibleAreas[0] ?? INDUSTRIAL_AREAS[0];

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
              Lease Overview
            </h1>
            <p className="text-xs text-slate-400">
              Inspect lease status for allotted plots and flag expired leases
              for follow-up with citizens.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="lease-area"
              className="text-[11px] font-medium text-slate-300"
            >
              Industrial Area
            </label>
            <select
              id=\"lease-area\"
              className=\"rounded-full border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 outline-none ring-emerald-400/40 focus:border-emerald-400 focus:ring-1\"
              value={selectedAreaId}
              onChange={(e) =>
                setSelectedAreaId(e.target.value as IndustrialAreaId)
              }
            >
              {visibleAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <MapPicker
          plots={plots}
          selectedPlotId={selectedPlot?.plotId ?? null}
          onSelect={handleSelectPlot}
          allowClickOnBought
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
        {!selectedPlot && (
          <p className="text-xs text-slate-400">
            Click on an allotted plot in the map above to view lease details.
          </p>
        )}

        {selectedPlot && (
          <div className="space-y-3 text-sm text-slate-200">
            <h2 className="text-sm font-semibold text-slate-100">
              Plot {selectedPlot.plotId} — Lease Details
            </h2>

            {isLoadingLease && (
              <p className="text-xs text-slate-400">Loading lease...</p>
            )}

            {!isLoadingLease && !lease && (
              <p className="text-xs text-slate-400">
                No lease record found for this plot.
              </p>
            )}

            {!isLoadingLease && lease && (
              <div className="space-y-2 text-xs">
                <p>
                  <span className="font-semibold text-slate-300">
                    Allotted to:
                  </span>{" "}
                  {lease.userEmail}
                </p>
                <p>
                  <span className="font-semibold text-slate-300">
                    Lease duration:
                  </span>{" "}
                  {lease.leaseYears} years
                </p>
                <p>
                  <span className="font-semibold text-slate-300">
                    Allotment date:
                  </span>{" "}
                  {new Date(lease.allotmentDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold text-slate-300">
                    Lease end date:
                  </span>{" "}
                  {new Date(lease.leaseEndDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold text-slate-300">
                    Remaining days:
                  </span>{" "}
                  {lease.remainingDays}
                </p>
                <p>
                  <span className="font-semibold text-slate-300">
                    Winning bid:
                  </span>{" "}
                  ₹{lease.bidPrice.toLocaleString("en-IN")}
                </p>
                <p>
                  <span className="font-semibold text-slate-300">
                    Status:
                  </span>{" "}
                  <span
                    className={
                      lease.status === "active"
                        ? "text-emerald-400"
                        : lease.status === "expired"
                        ? "text-red-400"
                        : "text-amber-400"
                    }
                  >
                    {lease.status}
                  </span>
                </p>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleFlagLease}
                    disabled={flagging || !lease}
                    className="rounded-full bg-amber-500 px-4 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-500/60"
                  >
                    {flagging ? "Flagging..." : "Flag Lease & Notify User"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

