"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingState } from "@/components/molecules";
import useAuth from "@/hooks/useAuth";

/** Renders its children only for a signed-in admin; otherwise redirects to login. */
function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, pathname, router]);

  if (!isAuthenticated) {
    return <LoadingState message="Checking your session..." minHeight="100vh" />;
  }
  return children;
}

export default AdminGuard;
