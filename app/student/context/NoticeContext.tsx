"use client";
// app/student/context/NoticeContext.tsx
// ─────────────────────────────────────────────────────
// Single source of truth for unread notices.
// Wrap the student layout with <NoticeProvider>.
// Any component can call useNotices() to read / update.
// ─────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../../lib/api";
import { useProfile } from "./ProfileContext";

interface Notice {
  _id: string;
  title: string;
  description: string;
  date: string;
  isRead: boolean;
  category: "events" | "academic" | "welfare" | "general";
  authorRole?: string;
  deadline?: string;
}

interface NoticeContextValue {
  notices: Notice[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotice: (id: string) => void;
  fetchNotices: () => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const { authId } = useProfile();

  const fetchNotices = useCallback(async () => {
    if (!authId) return;
    try {
      const res = await api.get(`/student/noticeboard/${authId}`);
      // Map backend fields to frontend if necessary
      const mapped = (res.data.notices || []).map((n: any) => ({
        ...n,
        description: n.body, // backend used body
        date: n.publishedDate, // backend used publishedDate (string)
      }));
      setNotices(mapped);
    } catch (error) {
      console.error("Failed to fetch notices", error);
    }
  }, [authId]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const unreadCount = notices.filter(n => !n.isRead).length;

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.post(`/student/noticeboard/${authId}/notices/${id}/read`);
      setNotices(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  }, [authId]);

  const markAllRead = useCallback(async () => {
    try {
      await api.post(`/student/noticeboard/${authId}/read-all`);
      setNotices(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all read", error);
    }
  }, [authId]);

  const deleteNotice = useCallback((id: string) => {
    // Frontend only dismiss for now
    setNotices(prev => prev.filter(n => n._id !== id));
  }, []);

  return (
    <NoticeContext.Provider value={{ notices, unreadCount, markAsRead, markAllRead, deleteNotice, fetchNotices }}>
      {children}
    </NoticeContext.Provider>
  );
}

export function useNotices() {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useNotices must be used inside <NoticeProvider>");
  return ctx;
}