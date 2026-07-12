"use client";
// app/student/layout.tsx
import React from "react";
import "./styles/global.css";
import "./styles/sidebar.css";
import "./styles/sos.css";
import { NoticeProvider } from "./context/NoticeContext";
import { ProfileProvider } from "./context/ProfileContext";
import StudentSidebar from "./components/Sidebar";
import DraggableSOS from "./components/DraggableSOS";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <NoticeProvider>
        <DraggableSOS />
        <div className="student-shell">
          <StudentSidebar />
          <div className="student-page-area">
            {children}
          </div>
        </div>
      </NoticeProvider>
    </ProfileProvider>
  );
}
