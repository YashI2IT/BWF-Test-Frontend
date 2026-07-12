"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  MessageSquare,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calendar,
  AlertCircle,
  FileCheck2,
  FileText,
  ListTodo,
  Bell,
  Menu,
  X,
  LayoutGrid,
  GraduationCap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/teacher/Template/components/ui/sidebar";
import { useSidebar } from "@/app/teacher/Template/components/ui/sidebar";
import { Button } from "@/app/teacher/Template/components/ui/button";

const menuGroups = [
  {
    label: "Overview",
    items: [
      { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/teacher/community", label: "Community", icon: MessageSquare, badge: { count: 3, color: 'bg-orange-200 text-orange-700' } },
      { href: "/teacher/notices", label: "Notices", icon: Bell },
    ]
  },
  {
    label: "Academics",
    items: [
      { href: "/teacher/students", label: "Students", icon: Users },
      { href: "/teacher/submissions", label: "Assignments", icon: FileCheck2 },
      { href: "/teacher/schedule", label: "Schedule", icon: Calendar, badge: { count: 8, color: 'bg-emerald-200 text-emerald-700' } },
      { href: "/teacher/notes", label: "Mentor Notes", icon: FileText },
    ]
  },
  {
    label: "Management",
    items: [
      { href: "/teacher/activities", label: "Activities", icon: CalendarCheck },
      { href: "/teacher/complaints", label: "Complaints", icon: AlertCircle },
    ]
  }
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Overview': true,
    'Academics': true,
    'Management': true
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      <Sidebar className="border-r border-slate-200 bg-[#F3F4F6]">
        <SidebarHeader className="pt-8 pb-6 px-6 border-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100">
              <LayoutDashboard className="w-[18px] h-[18px] text-slate-700 stroke-[2px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[18px] text-slate-900 tracking-tight">Teacher Dashboard</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4 py-2">
          {menuGroups.map((group, groupIndex) => (
            <SidebarGroup key={groupIndex} className="pt-0 pb-6">
              {group.label && (
                <SidebarGroupLabel 
                  className="flex items-center justify-between text-slate-800 font-semibold text-[15px] px-2 mb-3 h-auto py-0 cursor-pointer hover:text-blue-600 transition-colors select-none"
                  onClick={() => toggleGroup(group.label)}
                >
                  <div className="flex items-center gap-3">
                    {group.label === 'Overview' && <LayoutGrid className="w-[18px] h-[18px] text-slate-700 stroke-[2px]" />}
                    {group.label === 'Academics' && <GraduationCap className="w-[18px] h-[18px] text-slate-700 stroke-[2px]" />}
                    {group.label === 'Management' && <ListTodo className="w-[18px] h-[18px] text-slate-700 stroke-[2px]" />}
                    {group.label}
                  </div>
                  <div className={`w-4 h-4 flex items-center justify-center text-slate-400 transition-transform duration-200 ${!expandedGroups[group.label] ? '-rotate-90' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </SidebarGroupLabel>
              )}
              {expandedGroups[group.label] && (
                <SidebarGroupContent className="pl-6 relative overflow-hidden">
                  <SidebarMenu className="relative z-10">
                    {group.items.map((item, index) => {
                      const isActive = pathname === item.href;
                      const isFirst = index === 0;
                      const isLast = index === group.items.length - 1;
                      
                      return (
                        <SidebarMenuItem
                          key={item.href}
                          className="relative mb-1"
                        >
                          {/* Perfect SVG Tree Line */}
                          <svg 
                            className="absolute pointer-events-none" 
                            style={{ left: '-24px', top: 0, width: '24px', height: '100%', overflow: 'visible' }}
                          >
                            {/* Top part of vertical line */}
                            <line 
                              x1="17" 
                              y1={isFirst ? "-16" : "-4"} 
                              x2="17" 
                              y2={isLast ? "8" : "48"} 
                              stroke="#cbd5e1" 
                              strokeWidth="2" 
                            />
                            {/* The curved branch */}
                            <path 
                              d="M 17 8 Q 17 20 24 20" 
                              fill="none" 
                              stroke="#cbd5e1" 
                              strokeWidth="2" 
                            />
                          </svg>

                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={`transition-all duration-200 h-10 px-4 rounded-xl flex items-center justify-between ${
                              isActive
                                ? "bg-white text-slate-900 font-semibold shadow-sm shadow-slate-200/50"
                                : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 font-medium"
                            }`}
                            onClick={() => setOpenMobile(false)}
                          >
                            <Link href={item.href} className="w-full flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <item.icon className={`w-[18px] h-[18px] stroke-[2px] ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                                <span className={`text-[14.5px] ${isActive ? 'text-blue-700 font-bold' : ''}`}>{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${item.badge.color}`}>
                                  {item.badge.count}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
    </>
  );
}
