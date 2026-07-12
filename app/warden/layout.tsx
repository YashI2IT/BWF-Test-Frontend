"use client";

import { useState } from "react";
import { SidebarProvider } from "@/app/warden/Template/components/ui/sidebar";
import { WardenSidebar } from "./components/WardenSidebarNew";
import { TopNav } from "@/app/warden/Template/components/top-nav";
import AuthGuard from "./components/AuthGuard";

export default function WardenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <SidebarProvider>
        <WardenSidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col w-full md:ml-64">
          <TopNav onMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 bg-background">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
