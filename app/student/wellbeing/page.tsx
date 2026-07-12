// app/student/profile/page.tsx (server component)
// import ProfilePage from "../profile/ProfilePage";
import WellBeingPage from "./WellBeingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Well-Being",
  description: "Track your mood and emotional health.",
};

export default function ServerProfilePage() {
  return <WellBeingPage />;
}
