import Link from "next/link";

export default function Home() {
  return (
    <div className="flex h-full flex-col justify-center bg-white">
      <section className="grid gap-8 border border-gray-300 bg-white p-8 shadow-sm md:grid-cols-[1.3fr,1fr] md:p-10">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 border border-blue-600 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Government-Citizen Land Encroachment Detection System with Land Allocation Platform
          </p>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
            
            <span className="text-blue-600">
              
            </span>{" "}
            Industrial Land Encroachment Detection System with Land Allocation Platform
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-gray-700 sm:text-base">
           Authorities can detect encroachment on industrial land using satellite imagery and compare it with official maps.
           They can also allocate land to citizens and track the allocation process.
           Citizens can submit a fair price proposal and track the allocation process.  

          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Get started as Citizen
              <span className="text-base transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <Link
              href="/login?role=admin"
              className="inline-flex items-center justify-center gap-2 border border-gray-400 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-blue-600 hover:bg-blue-50"
            >
              Government Admin Login
            </Link>
          </div>

          <div className="grid gap-3 pt-4 text-xs text-gray-700 sm:grid-cols-3">
            <div className="border border-gray-300 bg-gray-50 p-3">
              <p className="font-semibold text-blue-700">Map-based Encroachment Detection</p>
              <p className="mt-1 text-xs text-gray-600">
                Citizens pick an exact vacant parcel with interactive map
                selection instead of ambiguous text-only forms.
              </p>
            </div>
            <div className="border border-gray-300 bg-gray-50 p-3">
              <p className="font-semibold text-blue-700">
                Hierarchical Access
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Dedicated views for admins and applicants with clear status and
                audit trail.
              </p>
            </div>
            <div className="border border-gray-300 bg-gray-50 p-3">
              <p className="font-semibold text-blue-700">Appeal System</p>
              <p className="mt-1 text-xs text-gray-600">
                Built with modern technology for secure and efficient land allocation management.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border border-gray-300 bg-gray-50 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Quick Access
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              Choose how you want to continue
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <Link
              href="/login?role=user"
              className="group flex items-center justify-between border border-gray-300 bg-white px-3 py-2.5 transition hover:border-blue-600 hover:bg-blue-50"
            >
              <div>
                <p className="font-medium text-gray-900">Continue as Citizen</p>
                <p className="text-xs text-gray-600">
                  Track your land requests and approvals.
                </p>
              </div>
              <span className="bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                USER LOGIN
              </span>
            </Link>

            <Link
              href="/login?role=admin"
              className="group flex items-center justify-between border border-blue-600 bg-blue-50 px-3 py-2.5 transition hover:bg-blue-100"
            >
              <div>
                <p className="font-medium text-blue-900">
                  Continue as Government Admin
                </p>
                <p className="text-xs text-blue-700">
                  Review and decide on citizen proposals.
                </p>
              </div>
              <span className="bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
                ADMIN LOGIN
              </span>
            </Link>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            No installation required. Just log in and start exploring potential
            public land allocations.
          </p>
        </div>
      </section>
    </div>
  );
}
