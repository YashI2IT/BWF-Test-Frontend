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
  imageUrl?: string;
  mediaType?: 'image' | 'video' | 'pdf';
}

interface NoticeContextValue {
  notices: Notice[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotice: (id: string) => void;
  fetchNotices: (silent?: boolean) => void;
  isLoading: boolean;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const { authId } = useProfile();
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotices = useCallback(async (silent = false) => {
    if (!authId) return;
    if (!silent) setIsLoading(true);
    try {
      const [res] = await Promise.all([
        api.get(`/student/noticeboard/me`),
        silent ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, 1000))
      ]);
      // Map backend fields to frontend if necessary
      const mapped = (res.data.notices || []).map((n: any) => ({
        ...n,
        description: n.body, // backend used body
        date: n.publishedDate, // backend used publishedDate (string)
      }));
      setNotices(mapped);
    } catch (error) {
      // Fail silently
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [authId]);

  useEffect(() => {
    fetchNotices();
    const intervalId = setInterval(() => {
      fetchNotices(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchNotices]);

  const unreadCount = notices.filter(n => !n.isRead).length;

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.post(`/student/noticeboard/me/notices/${id}/read`);
      setNotices(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      // Fail silently
    }
  }, [authId]);

  const markAllRead = useCallback(async () => {
    try {
      await api.post(`/student/noticeboard/me/read-all`);
      setNotices(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      // Fail silently
    }
  }, [authId]);

  const deleteNotice = useCallback((id: string) => {
    // Frontend only dismiss for now
    setNotices(prev => prev.filter(n => n._id !== id));
  }, []);

  return (
    <NoticeContext.Provider value={{ notices, unreadCount, markAsRead, markAllRead, deleteNotice, fetchNotices, isLoading }}>
      {children}
    </NoticeContext.Provider>
  );
}

export function useNotices() {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useNotices must be used inside <NoticeProvider>");
  return ctx;
}