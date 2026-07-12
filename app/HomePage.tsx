// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { GraduationCap, Shield, UserCog, BookOpen, ArrowRight } from "lucide-react";

interface RoleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

export default function HomePage() {
  const router = useRouter();

  const roles: RoleCard[] = [
    {
      id: "student",
      title: "Student Portal",
      description: "Access your courses, assignments, and profile",
      icon: <GraduationCap size={24} />,
      route: "/student/community",
      color: "bg-blue-500",
    },
    {
      id: "warden",
      title: "Warden Dashboard",
      description: "Manage students, activities, and hostel operations",
      icon: <Shield size={24} />,
      route: "/warden/community",
      color: "bg-purple-500",
    },
    {
      id: "teacher",
      title: "Teacher / Mentor Portal",
      description:
        "Assignments, schedules, mentorship notes, resources, and student progress",
      icon: <BookOpen size={24} />,
      route: "/teacher/dashboard",
      color: "bg-amber-500",
    },
    {
      id: "admin",
      title: "Admin Panel",
      description: "Complete system administration and oversight",
      icon: <UserCog size={24} />,
      route: "/admin/dashboard",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <Image
              src="/bwf2.png"
              alt="BWF Logo"
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Borderless World Foundation
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Educational Management System
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl w-full">
          {/* Welcome Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Select your role to continue
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => router.push(role.route)}
                className="group bg-white border border-gray-200 rounded-lg p-6 text-left hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                {/* Icon */}
                <div
                  className={`${role.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                >
                  <div className="text-white">{role.icon}</div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {role.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-900 transition-colors">
                  <span className="mr-2">Continue</span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Login Link */}
          <div className="text-center mt-8 sm:mt-12">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/auth/login")}
                className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-center text-xs sm:text-sm text-gray-500">
            © 2024 Borderless World Foundation. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
