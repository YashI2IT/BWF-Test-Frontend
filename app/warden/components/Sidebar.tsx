"use client";

import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  Activity,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "Community", icon: MessageSquare, path: "/warden/community" },
  { name: "Dashboard", icon: LayoutDashboard, path: "/warden/dashboard" },
  { name: "Students", icon: Users, path: "/warden/students" },
  { name: "Staff", icon: BriefcaseBusiness, path: "/warden/staff" },
  { name: "Activities", icon: Activity, path: "/warden/activities" },
  { name: "Expenses", icon: DollarSign, path: "/warden/expenses" },
  { name: "Complaints", icon: AlertCircle, path: "/warden/complaints" },
  { name: "Moderation", icon: ShieldCheck, path: "/warden/moderation" },
];

export default function Sidebar({
  closeSidebar,
}: {
  closeSidebar?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="h-full w-full flex flex-col border-r border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Warden Portal
          </h1>
          <p className="text-xs text-gray-500">
            NGO Student Management
          </p>
        </div>

        {/* Close button (mobile only) */}
        <button
          className="md:hidden"
          onClick={closeSidebar}
        >
          <X className="text-black" />
        </button>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {menu.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}



