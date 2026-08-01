"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import api from "../../lib/api"; // Note: Adjust the relative path to your api.ts file if needed

// Using your test user ID for now
const STUDENT_ID = "BWF-2024-001";

interface Notice {
  _id: string;
  title: string;
  body: string; // Updated to match your backend DB schema
  publishedDate: string; // Updated to match your backend DB schema
  isRead: boolean;
}

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get(`/student/noticeboard/me`);
      // Assuming your backend returns { notices: [...] } or just the array [...]
      setNotices(res.data.notices || res.data || []);
    } catch (error) {
      // Fail silently
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/student/noticeboard/me/notices/${id}/read`);
      setNotices((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      // Fail silently
    }
  };

  const deleteNotice = async (id: string) => {
    try {
      await api.delete(`/student/noticeboard/me/notices/${id}`);
      setNotices((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      // Fail silently
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-10 px-4 md:px-0">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="text-[11px] font-extrabold tracking-[2.5px] uppercase text-purple-600 mb-1"
        >
          Updates & Alerts
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
        >
          Notice Board
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[15px] text-slate-500 mt-2"
        >
          {notices.length} {notices.length === 1 ? "notice" : "notices"} available
        </motion.p>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center mt-4">Loading notices...</p>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex justify-between items-start ${
                notice.isRead ? "opacity-70" : ""
              }`}
            >
              <div>
                <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                <p className="text-gray-700 text-sm mt-1">{notice.body}</p>
                <span className="text-xs text-gray-400 mt-1 block">
                  {notice.publishedDate}
                </span>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {!notice.isRead && (
                  <button
                    onClick={() => markAsRead(notice._id)}
                    className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => deleteNotice(notice._id)}
                  className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
          {notices.length === 0 && (
            <p className="text-gray-500 text-center mt-4">
              No notices available
            </p>
          )}
        </div>
      )}
    </div>
  );
}
