import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12 w-full">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 prose max-w-none">
          <p className="text-gray-600 mb-4">Last updated: August 2024</p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">1. Introduction</h2>
          <p className="text-gray-600 mb-4">
            Welcome to the Borderless World Foundation ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. Information We Collect</h2>
          <p className="text-gray-600 mb-4">
            We collect personal information that you voluntarily provide to us when you register on the dashboard, express an interest in obtaining information about us or our services, or otherwise when you contact us.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">
            We use personal information collected via our dashboard for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
        </div>
      </div>
    </div>
  );
}
