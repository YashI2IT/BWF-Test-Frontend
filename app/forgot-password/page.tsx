"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, User, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [studentId, setStudentId] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim()) {
      setIsSubmitted(true);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl relative z-10 border border-gray-100 animate-[fadeUp_0.4s_ease]">
        
        {/* Back to Login */}
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-8">
          <ArrowLeft size={16} /> Back to login
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/bwf2.png"
            alt="BWF Logo"
            width={200}
            height={80}
            className="w-auto h-16 object-contain"
            priority
          />
        </div>

        {isSubmitted ? (
          <div className="text-center animate-[fadeUp_0.4s_ease]">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-6">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Request Sent!</h2>
            <p className="text-gray-500 font-medium text-[15px] mb-8">
              If an account exists for <span className="font-bold text-gray-900">{studentId}</span>, your admin will be notified to assist you with a password reset.
            </p>
            <Link
              href="/auth/login"
              className="w-full rounded-full bg-gray-900 py-4 font-bold text-white transition-all hover:bg-black hover:shadow-lg active:scale-[0.98] flex items-center justify-center"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Forgot Password?</h2>
              <p className="text-gray-500 font-medium text-[15px]">No worries, we'll help you get back in. Enter your ID below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Student or Staff ID</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-900 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. STU12345"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full rounded-full border border-gray-200 bg-gray-50/50 pl-12 pr-5 py-3.5 text-[15px] font-medium text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-gray-900 py-4 font-bold text-white transition-all hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
              >
                Reset Password
              </button>
            </form>
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
