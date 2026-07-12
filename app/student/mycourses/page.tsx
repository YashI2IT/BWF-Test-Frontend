// app/student/mycourses/page.tsx (server component)
import AcademicJourneyPage from "./AcademicJourneyPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assignments & Courses",
  description: "View your assignments and courses.",
};

export default function ServerProfilePage() {
  return <AcademicJourneyPage />;
}
