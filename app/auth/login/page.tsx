"use client";

import { loginUser } from "./service";
import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, ArrowRight } from "lucide-react";

function safeInternalRedirect(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

function LoginForm() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginUser(studentId, password);

      // optional: store token
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("role", data.role);
      localStorage.setItem("auth_id", data.auth_id);
      localStorage.setItem("studentId", studentId);

      const next = safeInternalRedirect(searchParams.get("redirect"));
      if (next) {
        // Prevent redirect loops: only redirect if the path prefix matches the role
        const isAllowed = 
          (data.role === "admin" && next.startsWith("/admin")) ||
          (data.role === "warden" && next.startsWith("/warden")) ||
          (data.role === "teacher" && next.startsWith("/teacher")) ||
          (data.role === "student" && next.startsWith("/student"));

        if (isAllowed) {
          router.push(next);
          return;
        }
      }

      // role-based redirect
      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "warden") {
        router.push("/warden/dashboard");
      } else if (data.role === "teacher") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <main className="flex min-h-screen relative overflow-hidden bg-[#F9FAFB]">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[100px] pointer-events-none" />

      <div className="flex w-full max-w-6xl mx-auto shadow-2xl rounded-2xl overflow-hidden bg-white my-12 relative z-10 border border-gray-100">
        
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px]" />
            <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-500/20 blur-[120px]" />
          </div>
          
          <div className="relative z-10">
            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mb-8">
              <Image
                src="/bwf2.png"
                alt="BWF Logo"
                width={160}
                height={80}
                className="w-auto h-12 object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Welcome back to the<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Borderless World
              </span>
            </h1>
            <p className="text-gray-300 text-lg max-w-md">
              Sign in to access your portal, manage activities, and continue your journey with us.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-sm text-gray-400 font-medium">
            <span>© 2024 BWF Management System</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span>Secure Access</span>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-md w-full mx-auto">
            
            {/* Mobile Logo */}
            <div className="flex lg:hidden justify-center mb-8">
              <Image
                src="/bwf2.png"
                alt="BWF Logo"
                width={200}
                height={80}
                className="w-auto h-16 object-contain"
                priority
              />
            </div>

            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Sign In</h2>
              <p className="text-gray-500 font-medium text-[15px]">Enter your credentials to access your account.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-4">
                {/* ID Input */}
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

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-900 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-full border border-gray-200 bg-gray-50/50 pl-12 pr-5 py-3.5 text-[15px] font-medium text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-[fadeUp_0.3s_ease]">
                  <div className="text-red-500 mt-0.5"><Lock size={16} /></div>
                  <p className="text-sm font-semibold text-red-700">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  <span className="text-sm font-medium text-gray-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-gray-900 py-4 font-bold text-white transition-all hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-6 group"
              >
                Sign In to Portal
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500 font-medium">
                Don't have an account?{" "}
                <a 
                  href="https://www.borderlessworldfoundation.org/contact" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-900 font-bold hover:underline transition-all"
                >
                  Contact admin
                </a>
              </p>
            </div>
            
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
          <p className="text-gray-600">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
