import { Metadata } from "next";
import ComplaintsPage from "./ComplaintPage";

export const metadata: Metadata = {
  title: "Activities & Complaints",
  description:
    "Request for activities and submit complaints or feedback to help us improve.",
};
export default function Page() {
  return <ComplaintsPage />;
}
