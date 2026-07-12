"use client";
// app/student/components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  BookOpen, 
  Bell, 
  Settings, 
  HeartPulse, 
  Megaphone, 
  Menu, 
  X, 
  Users,   
  MessageSquareWarning,
  LogOut,
} from "lucide-react";
import { useNotices } from "../context/NoticeContext";
import { useProfile } from "../context/ProfileContext";
import { getAvatar } from "../constants/avatars";
import Image from 'next/image';

const NAV_LINKS = [
  { href: "/student/community",   label: "Community",                Icon: Users      },
  { href: "/student/dashboard",   label: "Home",                     Icon: Home       },
  { href: "/student/mycourses",   label: "Assignments",              Icon: BookOpen   },
  { href: "/student/noticeboard", label: "Notice Board",             Icon: Megaphone  },
  { href: "/student/wellbeing",   label: "Wellbeing/Help",           Icon: HeartPulse },
  { href: "/student/complaints",  label: "Activities & Complaints",  Icon: MessageSquareWarning   },
  { href: "/student/profile",     label: "Profile",                  Icon: Settings   }
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile state
  
  const { unreadCount } = useNotices();
  const { avatarId, customAvatarUrl } = useProfile();
  const av = getAvatar(avatarId);
  const hasUnread = unreadCount > 0;

  // Add/remove sidebar-open class from html element
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isMobileOpen) {
      htmlElement.classList.add("sidebar-open");
    } else {
      htmlElement.classList.remove("sidebar-open");
    }
    return () => {
      htmlElement.classList.remove("sidebar-open");
    };
  }, [isMobileOpen]);

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  const openMobile = () => {
    setIsMobileOpen(true);
  };

  const handleNavClick = () => {
    // Small delay to ensure smooth transition
    setTimeout(() => closeMobile(), 100);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    router.push("/auth/login");
  };

  return (
    <>
      {/* ── MOBILE HEADER (Only visible via CSS media query) ── */}
      <div className="mobile-top-bar">
        <button 
          className="mobile-menu-btn" 
          onClick={openMobile}
          aria-label="Open menu"
          type="button"
        >
          <Menu size={24} />
        </button>
        <div className="mobile-logo-text">BWF</div>
        <button 
          className="mobile-avatar-btn" 
          onClick={() => { router.push("/student/profile"); closeMobile(); }}
          aria-label="Go to profile"
          type="button"
        >
          {customAvatarUrl ? (
            <Image src={customAvatarUrl} alt="Profile photo" width={26} height={26} className="mobile-avatar-img" />
          ) : (
            <span>{av.emoji}</span>
          )}
        </button>
      </div>

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${isMobileOpen ? "mobile-active" : ""}`}>
        {/* Close button for mobile drawer */}
        <button 
          className="mobile-close-btn" 
          onClick={closeMobile}
          aria-label="Close menu"
          type="button"
        >
          <X size={20} />
        </button>

        <div className="sidebar-logo">
          <div className="logo-icon">
            <Image 
              src="/logo.png" 
              alt="BWF Logo" 
              width={42} 
              height={42}
              priority
            />
          </div>
          <h2 className="sidebar-title">BWF</h2>
        </div> 

        <nav className="sidebar-nav">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const isNotice = href.includes("noticeboard");
            return (
              <Link 
                key={href} 
                href={href} 
                className={`nav-item${isActive ? " active" : ""}`}
                onClick={handleNavClick} // Closes sidebar on link click (mobile)
              >
                <span className="nav-icon-wrap">
                  <Icon size={19} />
                  {isNotice && hasUnread && (
                    <span className="nav-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`sb-bell${hasUnread ? " sb-bell--on" : ""}`}
            onClick={() => { router.push("/student/noticeboard"); handleNavClick(); }}
            title={hasUnread ? `${unreadCount} unread notices` : "All caught up!"}
            type="button"
          >
            <Bell size={17} />
            {hasUnread && (
              <span className="sb-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>

          <button
            className="sb-avatar"
            style={{ background: av.bg }}
            onClick={() => { router.push("/student/profile"); handleNavClick(); }}
            title="My Profile"
            type="button"
          >
            {customAvatarUrl ? (
              <Image src={customAvatarUrl} alt="Profile photo" width={40} height={40} className="sb-avatar-img" />
            ) : (
              <span>{av.emoji}</span>
            )}
          </button>

          <button
            className="sb-bell"
            style={{ color: "#ef4444" }}
            onClick={handleLogout}
            title="Log Out"
            type="button"
          >
            <LogOut size={17} />
          </button>
        </div>

        <div className="sb-foot-blob" />
      </aside>

      {/* ── OVERLAY (Always in DOM, hidden via CSS) ── */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? "active" : ""}`} 
        onClick={closeMobile}
        aria-hidden="true"
        role="presentation"
      />
    </>
  );
}