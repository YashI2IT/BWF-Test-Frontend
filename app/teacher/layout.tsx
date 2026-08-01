"use client";

import { SidebarProvider } from "@/app/teacher/Template/components/ui/sidebar";
import { TopNav } from "@/app/teacher/Template/components/top-nav";
import AuthGuard from "./components/AuthGuard";
import { TeacherSidebar } from "./components/TeacherSidebar";
import { CounsellingAlerts } from "./components/CounsellingAlerts";
import { Toaster } from "@/app/teacher/Template/components/ui/toaster";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <TeacherSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <TopNav />
          <main className="flex flex-1 flex-col min-w-0 bg-background">{children}</main>
        </div>
        <CounsellingAlerts />
        <Toaster />
      </SidebarProvider>
    </AuthGuard>
  );
}
