"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Shield, UserCog, BookOpen, ArrowRight, HeadphonesIcon, Lock, HelpCircle } from "lucide-react";

interface RoleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

export default function HomePage() {
  const router = useRouter();

  const roles: RoleCard[] = [
    {
      id: "student",
      title: "Student Portal",
      description: "Access your learning, assignments, and personal dashboard.",
      icon: <GraduationCap size={28} className="text-gray-800" />,
      route: "/student/community",
    },
    {
      id: "teacher",
      title: "Teacher / Mentor Portal",
      description: "Manage classes, assignments, and student progress.",
      icon: <BookOpen size={28} className="text-gray-800" />,
      route: "/teacher/dashboard",
    },
    {
      id: "warden",
      title: "Warden Dashboard",
      description: "Oversee students, hostel activities, and wellbeing.",
      icon: <Shield size={28} className="text-gray-800" />,
      route: "/warden/community",
    },
    {
      id: "admin",
      title: "Admin Panel",
      description: "Manage system, users, and organization data.",
      icon: <UserCog size={28} className="text-gray-800" />,
      route: "/admin/dashboard",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-gray-200">
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
        <div className="w-full px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/bwf2.png"
              alt="BWF Logo"
              width={240}
              height={60}
              className="w-auto h-10 sm:h-14 object-contain"
              priority
            />
          </div>
          <a href="mailto:adhik@borderlessworldfoundation.org" className="flex items-center gap-1.5 text-sm font-bold text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-1.5 rounded-full transition-all">
            <HelpCircle size={16} /> Help
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
          
          {/* Welcome Section */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-[40px] font-extrabold text-gray-900 mb-3 tracking-tight">
              Welcome back
            </h2>
            <p className="text-base sm:text-lg text-gray-500 font-medium">
              Select your portal to continue
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 w-full mb-12">
            {roles.map((role, idx) => (
              <div
                key={role.id}
                onClick={() => router.push(role.route)}
                className="group relative bg-white rounded-[24px] p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 border border-gray-100"
              >
                {/* Icon Circle */}
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ease-out border border-gray-100">
                  {role.icon}
                </div>

                {/* Text Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
                  {role.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-gray-500 font-medium mb-10 px-2">
                  {role.description}
                </p>

                {/* Button */}
                <button
                  className="mt-auto w-full py-3.5 px-4 rounded-full flex items-center justify-center gap-2 text-[15px] font-bold transition-all duration-300 border bg-white text-gray-900 border-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-900"
                >
                  Login <ArrowRight size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Support Bar */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-white rounded-2xl sm:rounded-full px-6 py-4 sm:py-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 text-sm">
              <HeadphonesIcon size={20} className="text-gray-900" />
              <span className="font-bold text-gray-900">Need help?</span>
              <span className="text-gray-500 font-medium hidden sm:inline">Our support team is here for you.</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gray-200 mx-2"></div>
            <a href="https://www.borderlessworldfoundation.org/contact#contact-form" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:text-gray-600 transition-colors flex items-center gap-1.5">
              Contact Support <ArrowRight size={16} />
            </a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-transparent py-8 mt-auto border-t border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] font-medium text-gray-500">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-gray-400" />
            Your data is safe and secure with us.
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="text-[#476b92] hover:text-[#2d4a68] transition-colors">Privacy Policy</Link>
            <div className="w-px h-4 bg-gray-300"></div>
            <Link href="/terms-of-use" className="text-[#476b92] hover:text-[#2d4a68] transition-colors">Terms of Use</Link>
          </div>

          <div>
            © 2024 Borderless World Foundation. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
