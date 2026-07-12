// app/student/profile/page.tsx (server component)
import ProfilePage from "./ProfilePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "View your profile, interests, and personal journal reflections.",
};

export default function ServerProfilePage() {
  return <ProfilePage />;
}
