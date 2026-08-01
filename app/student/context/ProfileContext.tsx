"use client";
// app/student/context/ProfileContext.tsx
// ─────────────────────────────────────────────────────
// Single source of truth for the student's avatar & name.
// Any page (Sidebar, Dashboard header, MyCourses header)
// reads avatarId from here so they all stay in sync.
// ─────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../../lib/api";

interface ProfileContextValue {
  avatarId: string;
  customAvatarUrl: string | null;
  name: string;
  authId: string;
  setAvatarId: (id: string) => void;
  setCustomAvatarUrl: (url: string | null) => void;
  setName: (name: string) => void;
  setAuthId: (id: string) => void;
}

const mockData = {
  defaultProfile: {
    avatarId: "cat",
    customAvatarUrl: null as string | null,
    name: "",
    authId: ""
  }
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [avatarId, setAvatarId] = useState(mockData.defaultProfile.avatarId);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(mockData.defaultProfile.customAvatarUrl);
  const [name, setName] = useState(mockData.defaultProfile.name);
  const [authId, setAuthId] = useState(mockData.defaultProfile.authId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedAvatarId = localStorage.getItem("studentAvatarId");
    const savedCustomAvatar = localStorage.getItem("studentCustomAvatar");
    const savedName = localStorage.getItem("studentName");
    const savedId = localStorage.getItem("studentId") || localStorage.getItem("auth_id");
    if (savedAvatarId) setAvatarId(savedAvatarId);
    if (savedCustomAvatar) setCustomAvatarUrl(savedCustomAvatar);
    if (savedName) setName(savedName);
    if (savedId) setAuthId(savedId);
  }, []);

  // Fetch real profile data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authId || authId === "") return;
      try {
        const { data } = await api.get(`/student/profile/me`);
        if (data && data.name) {
          setName(data.name);
        }
      } catch (error) {
        // Fail silently
      }
    };
    fetchProfile();
  }, [authId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("studentAvatarId", avatarId);
  }, [avatarId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (customAvatarUrl) localStorage.setItem("studentCustomAvatar", customAvatarUrl);
    else localStorage.removeItem("studentCustomAvatar");
  }, [customAvatarUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("studentName", name);
  }, [name]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("studentId", authId);
  }, [authId]);

  return (
    <ProfileContext.Provider value={{ avatarId, customAvatarUrl, name, authId, setAvatarId, setCustomAvatarUrl, setName, setAuthId }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    // Provide a fallback for non-student dashboards (Warden, Teacher)
    return {
      avatarId: "bunny",
      customAvatarUrl: null,
      name: "Staff Member",
      authId: "",
      setAvatarId: () => { },
      setCustomAvatarUrl: () => { },
      setName: () => { },
      setAuthId: () => { }
    };
  }
  return ctx;
}