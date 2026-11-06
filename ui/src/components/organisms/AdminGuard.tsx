"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingState } from "@/components/molecules";
import useAuth from "@/hooks/useAuth";
import { isOperator } from "@/types/admin";

/**
 * Renders its children only for a signed-in account of the right kind; otherwise redirects to
 * login. The admin console is for the BusWatch team; bus operators go to their own portal.
 */
function AdminGuard({
  children,
  area = "console",
}: {
  children: ReactNode;
  area?: "console" | "operator";
}) {
  const { isAuthenticated, loading, admin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const wrongArea = admin !== null && isOperator(admin) !== (area === "operator");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    } else if (wrongArea) {
      router.replace(area === "operator" ? "/admin/dashboard" : "/operator");
    }
  }, [loading, isAuthenticated, wrongArea, area, pathname, router]);

  if (!isAuthenticated || wrongArea) {
    return <LoadingState message="Checking your session..." minHeight="100vh" />;
  }
  return children;
}

export default AdminGuard;
