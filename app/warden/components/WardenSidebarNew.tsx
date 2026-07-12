'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  BriefcaseBusiness,
  Calendar,
  ChevronDown,
  DollarSign,
  Home,
  MessageSquare,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/app/warden/Template/components/ui/button';

const mainItems = [
  { icon: MessageSquare, label: 'Community', href: '/warden/community' },
  { icon: Home, label: 'Dashboard', href: '/warden/dashboard' },
];

const manageItems = [
  { icon: Users, label: 'Students', href: '/warden/students' },
  { icon: BriefcaseBusiness, label: 'Staff', href: '/warden/staff' },
  { icon: Calendar, label: 'Activities', href: '/warden/activities' },
  { icon: DollarSign, label: 'Expenses', href: '/warden/expenses' },
];

const workspaceItems = [
  { icon: AlertCircle, label: 'Complaints', href: '/warden/complaints', color: 'bg-rose-50 text-rose-700' },
  { icon: ShieldCheck, label: 'Moderation', href: '/warden/moderation', color: 'bg-blue-50 text-blue-700' },
];

type WardenSidebarProps = {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function WardenSidebar({ isMobileOpen = false, onCloseMobile }: WardenSidebarProps) {
  const pathname = usePathname();
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);

  const isRouteActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (isActive: boolean) =>
    `flex h-9 items-center gap-3 rounded-xl px-2.5 text-[13px] transition-colors ${
      isActive ? 'bg-blue-50 text-slate-950 font-semibold' : 'text-slate-700 hover:bg-slate-50'
    }`;

  const sidebarContent = (
    <>
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
              <span className="text-[14px] font-bold leading-none">W</span>
            </div>
            <p className="truncate text-[15px] font-medium text-slate-900">Warden</p>
          </div>

          <Button variant="ghost" size="icon" onClick={onCloseMobile} className="h-8 w-8 rounded-lg md:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 py-4 md:overflow-hidden max-md:overflow-y-auto">
        <nav className="space-y-1.5">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.href);

            return (
              <Link key={item.href} href={item.href} onClick={onCloseMobile} className={navLinkClass(isActive)}>
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-5">
          <p className="px-2.5 pb-1.5 text-[12px] font-medium text-slate-500">Manage</p>
          <nav className="space-y-1.5">
            {manageItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.href);

              return (
                <Link key={item.href} href={item.href} onClick={onCloseMobile} className={navLinkClass(isActive)}>
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setIsWorkspaceOpen((current) => !current)}
            className="flex w-full items-center gap-2 px-2.5 pb-1.5 text-left text-[12px] font-medium text-slate-700"
          >
            <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isWorkspaceOpen ? '' : '-rotate-90'}`} />
            <span>Workspaces</span>
          </button>

          {isWorkspaceOpen && (
            <nav className="space-y-1.5">
              {workspaceItems.map((item) => {
                const Icon = item.icon;
                const isActive = isRouteActive(item.href);

                return (
                  <Link key={item.href} href={item.href} onClick={onCloseMobile} className={navLinkClass(isActive)}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 px-4 py-3">
        <Link href="/warden/profile" onClick={onCloseMobile} className={navLinkClass(isRouteActive('/warden/profile'))}>
          <User className={`h-4 w-4 ${isRouteActive('/warden/profile') ? 'text-blue-600' : 'text-slate-500'}`} />
          <span className="truncate">Profile</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-slate-100 bg-white">
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/45" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[82vw] flex-col rounded-r-2xl border-r border-slate-100 bg-white shadow-2xl animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}


