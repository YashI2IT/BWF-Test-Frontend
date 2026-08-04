import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12 w-full">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 prose max-w-none">
          <p className="text-gray-600 mb-4">Last updated: August 2024</p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
          <p className="text-gray-600 mb-4">
            By accessing or using our Borderless World Foundation dashboard, you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to these terms, please do not use our services.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. User Responsibilities</h2>
          <p className="text-gray-600 mb-4">
            As a user of the system, you agree to provide accurate and complete information and keep this information up to date. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Prohibited Activities</h2>
          <p className="text-gray-600 mb-4">
            You may not access or use the dashboard for any purpose other than that for which we make it available. The dashboard may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
          </p>
        </div>
      </div>
    </div>
  );
}
