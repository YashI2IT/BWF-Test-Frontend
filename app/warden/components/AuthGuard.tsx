"use client";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  // For now: always allow (no backend)
  return <>{children}</>;
}
