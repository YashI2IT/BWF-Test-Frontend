"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role  = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.replace("/auth/login?redirect=" + pathname);
      return;
    }

    setReady(true);
  }, [pathname, router]);

  // Show nothing while redirecting or checking auth
  if (!ready) return null;

  return <>{children}</>;
}
