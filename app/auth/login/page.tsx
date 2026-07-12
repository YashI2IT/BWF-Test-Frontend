"use client";

import { loginUser } from "./service";
import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
        router.push(next);
        return;
      }

      // role-based redirect
      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "warden") {
        router.push("/warden/community");
      } else if (data.role === "teacher") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/student/community");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg animate-[fadeUp_0.6s_ease]">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/bwf2.png"
            alt="BWF Logo"
            width={220}
            height={140}
            priority
          />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="text"
            placeholder="Enter your ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:border-gray-700 focus:outline-none text-gray-700"
            required
          />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:border-gray-700 focus:outline-none text-gray-700"
            required
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-gray-800 py-3 font-semibold text-white transition hover:bg-gray-900"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 flex justify-between text-sm text-gray-500">
          <Link href="/forgot-password" className="hover:underline">
            Forgot Password?
          </Link>
          <Link href="/signup" className="hover:underline">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Animation */}
      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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
