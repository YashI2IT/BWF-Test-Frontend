"use client";

import { SidebarProvider } from "@/app/warden/Template/components/ui/sidebar";
import { WardenSidebar } from "./components/WardenSidebarNew";
import { TopNav } from "@/app/warden/Template/components/top-nav";
import AuthGuard from "./components/AuthGuard";

export default function WardenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <WardenSidebar />
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
