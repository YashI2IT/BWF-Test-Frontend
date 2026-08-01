"use client";

import { SidebarProvider } from "@/app/warden/Template/components/ui/sidebar";
import { TopNav } from "@/app/warden/Template/components/top-nav";
import AuthGuard from "./components/AuthGuard";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <TopNav />
          <main className="flex flex-1 flex-col min-w-0 bg-background">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
