// app/student/dashboard/page.tsx
import Dashboard from "./Dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Welcome to your dashboard! Here you can view your courses, track your progress, and access your learning materials. Stay organized and make the most of your learning experience.",
};

export default function ServerProfilePage() {
  return <Dashboard />;
}
