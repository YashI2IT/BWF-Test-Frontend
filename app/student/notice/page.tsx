// app/student/profile/page.tsx (server component)
import ProfilePage from "../profile/ProfilePage";
import NoticeBoardPage from "./NoticeBoardPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notice Board",
  description:
    "Stay updated with the latest announcements, events, and important information from your school. Check the notice board regularly to never miss out on any updates.",
};

export default function ServerNoticeBoardPage() {
  return <NoticeBoardPage />;
}
