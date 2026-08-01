"use client";
// app/admin/media/page.tsx
// Community post moderation — approve, reject, delete with one click.

import { useEffect, useState } from "react";
import { adminAPI } from "../lib/api";
import StatusBadge from "../components/StatusBadge";

interface Post {
  _id: string; studentId: string; studentName: string; home: string;
  mediaType: string; caption: string; platform: string;
  status: string; submittedOn: string; rejectionReason: string;
  reviewedBy: string; reviewedOn: string;
}

export default function MediaPage() {
  const [posts, setPosts]           = useState<Post[]>([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterHome, setFilterHome] = useState("");
  const [error, setError]           = useState("");
  const [msg, setMsg]               = useState("");

  const load = () => {
    const p: Record<string, string> = {};
    if (filterStatus) p.status = filterStatus;
    if (filterHome)   p.home   = filterHome;
    adminAPI.getPosts(p).then(d => setPosts(d as Post[])).catch(e => setError(e.message));
  };
  useEffect(() => { load(); }, [filterStatus, filterHome]);

  const review = async (id: string, status: "approved" | "rejected") => {
    let rejectionReason = "";
    if (status === "rejected") {
      const r = prompt("Reason for rejection (optional):");
      if (r === null) return; // user cancelled
      rejectionReason = r;
    }
    try {
      await adminAPI.reviewPost(id, { status, rejectionReason });
      setMsg(`Post ${status}.`);
      load();
    } catch (e: unknown) { setError((e as Error).message); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    try { await adminAPI.deletePost(id); setMsg("Post deleted."); load(); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  const counts = {
    pending:  posts.filter(p => p.status === "pending").length,
    approved: posts.filter(p => p.status === "approved").length,
    rejected: posts.filter(p => p.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#2f2a24]">Media Oversight</h1>
        <p className="text-sm text-[#8c6d4f]">Review and moderate community posts with dignity and safeguarding checks.</p>
      </header>

      {msg   && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">{error}</div>}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending Review", value: counts.pending, warn: true },
          { label: "Approved",       value: counts.approved },
          { label: "Rejected",       value: counts.rejected },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border bg-white p-4 shadow-sm ${k.warn && k.value > 0 ? "border-amber-200" : "border-[#efe3d5]"}`}>
            <p className="text-xs text-[#8c6d4f]">{k.label}</p>
            <p className={`text-2xl font-bold ${k.warn && k.value > 0 ? "text-amber-600" : "text-[#2f2a24]"}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border border-[#dfd1c2] overflow-hidden text-sm">
          {["", "pending", "approved", "rejected"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 transition ${filterStatus === s ? "bg-[#8c6d4f] text-white" : "hover:bg-[#f5ece1] text-[#6e5034]"}`}>
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select className="rounded-lg border border-[#dfd1c2] px-3 py-2 text-sm outline-none focus:border-[#8c6d4f]"
          value={filterHome} onChange={e => setFilterHome(e.target.value)}>
          <option value="">All Homes</option>
          {["Jammu", "Anantnag", "Kupwara", "Beerwah"].map(h => <option key={h}>{h}</option>)}
        </select>
      </div>

      {/* Cards */}
      {posts.length === 0 ? (
        <div className="rounded-xl border border-[#efe3d5] bg-white p-8 text-center text-[#8c6d4f] shadow-sm">
          No posts found for selected filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map(p => (
            <article key={p._id} className="rounded-xl border border-[#efe3d5] bg-white p-5 shadow-sm space-y-3">
              {/* Media placeholder */}
              <div className="grid h-36 place-items-center rounded-lg bg-[#f8efe5] text-sm font-medium text-[#8c6d4f]">
                {p.mediaType === "image" ? "Image" : p.mediaType === "video" ? "Video" : "Text Post"}
              </div>

              {/* Meta */}
              <div>
                <p className="font-semibold text-[#2f2a24]">{p.studentName}</p>
                <p className="text-xs text-[#8c6d4f]">{p.home} · {p.submittedOn?.slice(0, 10)} · {p.platform}</p>
              </div>
              {p.caption && <p className="text-sm text-[#4a3f35] leading-relaxed">{p.caption}</p>}

              <StatusBadge status={p.status} />

              {p.status === "rejected" && p.rejectionReason && (
                <p className="text-xs text-red-500 border border-red-100 bg-red-50 rounded px-2 py-1">
                  Reason: {p.rejectionReason}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {p.status === "pending" && (
                  <>
                    <button onClick={() => review(p._id, "approved")}
                      className="flex-1 rounded-lg bg-emerald-50 text-emerald-700 py-1.5 text-xs font-medium hover:bg-emerald-100 transition">
                      Approve
                    </button>
                    <button onClick={() => review(p._id, "rejected")}
                      className="flex-1 rounded-lg bg-red-50 text-red-600 py-1.5 text-xs font-medium hover:bg-red-100 transition">
                      Reject
                    </button>
                  </>
                )}
                {p.status === "rejected" && (
                  <button onClick={() => review(p._id, "approved")}
                    className="flex-1 rounded-lg bg-[#f5ece1] text-[#6e5034] py-1.5 text-xs font-medium hover:bg-[#ede0d0] transition">
                    Approve Anyway
                  </button>
                )}
                <button onClick={() => del(p._id)}
                  className="rounded-lg bg-gray-100 text-gray-500 px-3 py-1.5 text-xs font-medium hover:bg-gray-200 transition">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
