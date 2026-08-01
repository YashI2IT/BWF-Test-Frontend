/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, ChevronDown, User, Layout, LogOut, FileCheck2, Calendar } from 'lucide-react';
import { Button } from '@/app/teacher/Template/components/ui/button';
import api from '@/app/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/teacher/Template/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useSidebar, SidebarTrigger } from '@/app/teacher/Template/components/ui/sidebar';
import { useProfile } from '../context/ProfileContext';
import { getAvatarUrl } from '@/app/lib/avatar';

export function StudentTopNav() {
  const [profile, setProfile] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const router = useRouter();
  const { customAvatarUrl } = useProfile();

  const fetchProfile = async () => {
    try {
      const res = await api.get('/student/profile/me');
      setProfile(res.data);
    } catch (err) {
      // Fail silently
      setProfile({ name: 'Student', email: 'teacher@school.com', profilePic: 'https://i.pravatar.cc/150?img=11' });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    window.location.href = "/auth/login";
  };

  if (!mounted) {
    return (
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 h-[80px]" />
    );
  }

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 pt-4 pb-2">
      <div className="flex items-center justify-between h-14 px-4 md:px-8">
        
        <div className="flex items-center">
          <SidebarTrigger className="md:hidden" />
        </div>

        <div className="flex items-center gap-3">
          {/* Messages */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative bg-white shadow-sm shadow-slate-200 border-none rounded-full w-10 h-10 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 text-slate-700 stroke-[2.5px]" />
                {messages.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[10px] font-extrabold bg-blue-600 text-white rounded-full border-2 border-white -translate-y-1 translate-x-1 shadow-sm">
                    {messages.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-[min(320px,calc(100vw-24px))] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 duration-200 rounded-2xl border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-2">
              <div className="px-3 py-2.5 mb-1 flex items-center justify-between">
                <span className="text-[15px] font-bold text-slate-900 leading-none">Messages</span>
                {messages.length > 0 && (
                  <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{messages.length} New</span>
                )}
              </div>
              
              {messages.length > 0 ? messages.map((msg) => (
                <DropdownMenuItem 
                  key={msg.id}
                  onSelect={() => setMessages(messages.filter(m => m.id !== msg.id))}
                  className="flex items-start gap-3 p-2.5 cursor-pointer rounded-xl hover:bg-slate-50 focus:bg-slate-50 transition-colors outline-none"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.color.split(' ')[0]}`}>
                    <span className={`text-sm font-bold ${msg.color.split(' ')[1]}`}>{msg.initials}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-slate-900">{msg.sender}</p>
                      <span className="text-[11px] font-medium text-slate-400">{msg.time}</span>
                    </div>
                    <p className="text-[13px] text-slate-500 truncate">{msg.preview}</p>
                  </div>
                </DropdownMenuItem>
              )) : (
                <div className="p-4 text-center text-sm text-slate-500 font-medium">No new messages</div>
              )}

              <DropdownMenuSeparator className="bg-slate-100 my-1 mx-[-8px]" />
              
              <DropdownMenuItem className="flex items-center justify-center p-2.5 cursor-pointer rounded-xl hover:bg-slate-50 focus:bg-slate-50 transition-colors mt-1 outline-none">
                <span className="text-[13px] font-bold text-blue-600">View All Messages</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>



          {/* Divider */}
          <div className="h-8 w-px bg-slate-200 mx-1"></div>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="flex items-center gap-3 cursor-pointer transition-all">
                {!profile ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
                    <div className="hidden md:flex flex-col items-start mr-2 gap-1.5">
                      <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                      <div className="h-3 w-16 bg-slate-200 animate-pulse rounded" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={customAvatarUrl || profile.profilePic || getAvatarUrl(profile.name || "Student")} alt="Student" className="w-full h-full object-cover" />
                    </div>
                    <div className="hidden md:flex flex-col items-start mr-2">
                      <span className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight">{profile.name}</span>
                      <span className="text-[13px] font-medium text-slate-500 leading-tight mt-0.5">Student</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-600 ml-1" />
                  </>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 duration-200 rounded-2xl border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-2 origin-top-right">
              <div className="px-2 py-3 mb-1">
                <p className="text-[15px] font-bold text-slate-900 leading-none">{profile?.name?.split(' ')[0] || 'Student'}</p>
                <p className="text-[13px] font-medium text-slate-500 mt-1.5">{profile?.email || 'teacher@school.com'}</p>
              </div>
              
              <DropdownMenuItem 
                onSelect={() => router.push('/student/profile')}
                className="flex items-center justify-between p-2.5 cursor-pointer rounded-xl hover:bg-slate-50 focus:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-[18px] h-[18px] text-slate-700 stroke-[2px]" />
                  <span className="text-[14px] font-semibold text-slate-800">Edit profile</span>
                </div>
                <div className="flex gap-1 items-center">
                  <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500">⌘</kbd>
                  <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500">E</kbd>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-slate-100 my-1 mx-[-8px]" />
              
              <DropdownMenuItem 
                onSelect={handleLogout}
                className="flex items-center gap-2.5 p-2.5 mt-1 cursor-pointer rounded-xl hover:bg-slate-50 focus:bg-slate-50 transition-colors"
              >
                <LogOut className="w-[18px] h-[18px] text-slate-700 stroke-[2px]" />
                <span className="text-[14px] font-semibold text-slate-800">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </div>
  );
}
