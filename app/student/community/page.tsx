import { Metadata } from "next";
import CommunityPage from "./CommunityPage";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Connect with your peers and share your experiences in the BWF community.",
};
export default function Page() {
  return <CommunityPage />;
}
