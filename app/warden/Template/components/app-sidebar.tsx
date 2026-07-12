'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  MessageSquare,
  User,
  Menu,
  X,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/app/warden/Template/components/ui/sidebar';
import { Button } from '@/app/warden/Template/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Students', href: '/students' },
  { icon: Calendar, label: 'Activities', href: '/activities' },
  { icon: DollarSign, label: 'Expenses', href: '/expenses' },
  { icon: AlertCircle, label: 'Complaints', href: '/complaints' },
  { icon: MessageSquare, label: 'Moderation', href: '/moderation' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-10 h-10 bg-white/80 backdrop-blur-sm border border-border hover:bg-secondary"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        className={`border-r border-border bg-sidebar animate-slide-in-left ${
          isMobileOpen
            ? 'fixed left-0 top-0 h-screen z-40 w-64'
            : 'hidden md:flex'
        }`}
      >
        <SidebarHeader className="border-b border-border py-3 px-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary via-accent to-primary rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-xs">W</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-sidebar-foreground truncate">Warden</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem 
                      key={item.href}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`transition-all duration-300 rounded-md ${
                          isActive
                            ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-sm'
                            : 'text-sidebar-foreground hover:bg-secondary/60'
                        }`}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <Link href={item.href} className="flex items-center gap-2.5 px-3 py-2">
                          <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
