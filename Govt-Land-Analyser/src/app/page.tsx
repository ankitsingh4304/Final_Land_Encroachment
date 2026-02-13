import Link from "next/link";

export default function Home() {
  return (
    <div className="flex h-full flex-col justify-center">
      <section className="grid gap-10 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-900/40 p-8 shadow-2xl shadow-emerald-500/20 backdrop-blur-lg md:grid-cols-[1.3fr,1fr] md:p-10">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium tracking-tight text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            Govt–Citizen Land Allocation Platform
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Make{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
              public land
            </span>{" "}
            allocation transparent, fair & data‑driven.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-200/80 sm:text-base">
            Citizens can discover vacant government land, mark a precise
            location on the map, and submit a fair price proposal. Government
            administrators get a clean dashboard to review, approve or decline
            every application with full traceability.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-300"
            >
              Get started as Citizen
              <span className="text-base transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <Link
              href="/login?role=admin"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-emerald-400/60 hover:bg-emerald-500/10"
            >
              Government Admin Login
            </Link>
          </div>

          <div className="grid gap-3 pt-4 text-xs text-slate-200/80 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="font-semibold text-emerald-200">Map-first flows</p>
              <p className="mt-1 text-[11px] text-slate-300/80">
                Citizens pick an exact vacant parcel with interactive map
                selection instead of ambiguous text-only forms.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
              <p className="font-semibold text-emerald-200">
                Dual role access
              </p>
              <p className="mt-1 text-[11px] text-slate-300/80">
                Dedicated views for admins and applicants with clear status and
                audit trail.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <p className="font-semibold text-emerald-200">Hackathon ready</p>
              <p className="mt-1 text-[11px] text-slate-300/80">
                Built with Next.js App Router, Tailwind, and MongoDB—ready to
                demo in minutes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-400/20 bg-black/40 p-4 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
              Live preview
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-50">
              Choose how you want to continue
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <Link
              href="/login?role=user"
              className="group flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 transition hover:border-emerald-400/60 hover:bg-emerald-950/70"
            >
              <div>
                <p className="font-medium text-slate-50">Continue as Citizen</p>
                <p className="text-[11px] text-slate-300/80">
                  Track your land requests and approvals.
                </p>
              </div>
              <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                USER LOGIN
              </span>
            </Link>

            <Link
              href="/login?role=admin"
              className="group flex items-center justify-between rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2.5 transition hover:bg-emerald-500/20"
            >
              <div>
                <p className="font-medium text-emerald-100">
                  Continue as Govt Admin
                </p>
                <p className="text-[11px] text-emerald-100/80">
                  Review and decide on citizen proposals.
                </p>
              </div>
              <span className="rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-semibold text-slate-900">
                ADMIN LOGIN
              </span>
            </Link>
          </div>
          <p className="mt-2 text-[11px] text-slate-400/80">
            No installation required. Just log in and start exploring potential
            public land allocations.
          </p>
        </div>
      </section>
    </div>
  );
}
