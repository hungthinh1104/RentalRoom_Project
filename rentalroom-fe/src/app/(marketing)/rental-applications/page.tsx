"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { ApplicationsList } from "@/features/rental-applications/components/application-list";
import { UserRole } from "@/types";

export default function RentalApplicationsPage() {
    const { data: session } = useSession();
    const userRole = session?.user?.role;

    // Determine view mode based on role
    // If ADMIN, might want to see all or landlord view. Defaulting to tenant view for tenants, landlord for landlords.
    const view = userRole === UserRole.TENANT ? "tenant" : "landlord";

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Quản lý Đơn thuê</h1>
                <p className="text-muted-foreground">
                    {view === "tenant"
                        ? "Theo dõi trạng thái các đơn đăng ký thuê phòng của bạn."
                        : "Duyệt và quản lý các yêu cầu thuê phòng từ khách hàng."}
                </p>
            </div>

            <ApplicationsList view={view} />
        </div>
    );
}
