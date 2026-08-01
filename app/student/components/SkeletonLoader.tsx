import React from "react";

export function SkeletonLoader() {
  return (
    <div className="w-full h-full min-h-screen p-6 bg-[#f4f5f8] flex flex-col gap-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-10 h-10 rounded-full bg-slate-200/70 shrink-0"></div>
        <div className="flex flex-col gap-2">
          <div className="w-48 h-4 rounded-md bg-slate-200/70"></div>
          <div className="w-32 h-3 rounded-md bg-slate-200/70"></div>
        </div>
      </div>

      {/* Top 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-28 rounded-2xl bg-slate-200/70"></div>
        <div className="h-28 rounded-2xl bg-slate-200/70"></div>
        <div className="h-28 rounded-2xl bg-slate-200/70"></div>
        <div className="h-28 rounded-2xl bg-slate-200/70"></div>
      </div>

      {/* Bottom Layout (Large left, Smaller right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        <div className="lg:col-span-2 rounded-3xl bg-slate-200/70"></div>
        <div className="rounded-3xl bg-slate-200/70"></div>
      </div>
    </div>
  );
}