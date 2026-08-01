// app/admin/components/PageSkeleton.tsx
// Animated skeleton shown while API data is loading — eliminates blank page flash.

import { Skeleton } from "@/app/warden/Template/components/ui/skeleton";

export default function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex-1 overflow-auto bg-[#F4F5F7] min-h-screen text-slate-900 font-sans">
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Skeleton className="h-10 w-64 rounded-xl mb-3" />
            <Skeleton className="h-5 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border-none shadow-sm overflow-hidden bg-white p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Table / List Area */}
        <div className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white p-6 space-y-4">
          <div className="flex gap-4 border-b border-slate-100 pb-4">
            <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
            <Skeleton className="h-10 w-full sm:w-40 rounded-xl" />
          </div>
          <div className="space-y-4 pt-2">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-50">
                <Skeleton className="h-4 flex-1 rounded bg-slate-100" />
                <Skeleton className="h-4 w-20 rounded bg-slate-100" />
                <Skeleton className="h-4 w-16 rounded bg-slate-100" />
                <Skeleton className="h-4 w-24 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

