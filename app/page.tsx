// app/student/profile/page.tsx (server component)
// import ProfilePage from "../profile/ProfilePage";
import HomePage from "./HomePage";
import WellBeingPage from "./HomePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BWF",
  description: "Education System",
};

export default function ServerProfilePage() {
  return <HomePage />;
}
