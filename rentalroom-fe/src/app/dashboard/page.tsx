"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    // Only redirect if user is currently on the /dashboard root page
    if (pathname !== "/dashboard") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // Redirect to role-specific dashboard
    const userRole = session.user?.role as string;
    if (userRole === "TENANT") {
      router.push("/dashboard/tenant");
    } else if (userRole === "LANDLORD") {
      router.push("/dashboard/landlord");
    } else if (userRole === "ADMIN") {
      router.push("/dashboard/admin");
    } else {
      router.push("/login");
    }
  }, [session, status, router, pathname]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
