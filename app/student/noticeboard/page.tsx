// app/student/profile/page.tsx (server component)
// app/student/noticeboard/page.tsx
import NoticeBoardPage from "./NoticeBoardPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notice Board — BWF",
  description: "Stay updated with the latest announcements and events from your school.",
};

export default function ServerNoticeBoardPage() {
  return <NoticeBoardPage />;
}
