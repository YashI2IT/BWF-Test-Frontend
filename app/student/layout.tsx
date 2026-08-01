"use client";
import React from "react";
import "./styles/global.css";
import "./styles/sidebar.css";
import "./styles/sos.css";
import { NoticeProvider } from "./context/NoticeContext";
import { ProfileProvider } from "./context/ProfileContext";
import { StudentSidebar } from "./components/Sidebar";
import { StudentTopNav } from "./components/StudentTopNav";
import DraggableSOS from "./components/DraggableSOS";
import AuthGuard from "./components/AuthGuard";
import { SidebarProvider } from "@/app/teacher/Template/components/ui/sidebar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ProfileProvider>
        <NoticeProvider>
          <SidebarProvider>
            <StudentSidebar />
            <div className="flex flex-1 flex-col min-w-0 bg-[#F8F9FB]">
              <StudentTopNav />
              <main className="flex flex-1 flex-col min-w-0 bg-[#F8F9FB] relative">
                <DraggableSOS />
                {children}
              </main>
            </div>
          </SidebarProvider>
        </NoticeProvider>
      </ProfileProvider>
    </AuthGuard>
  );
}
