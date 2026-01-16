"use client";

import { UseFormReturn } from "react-hook-form";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import type { ContractInput } from "../../schemas";

import { TenantSearch } from "./tenant-search";

interface ContractPartiesProps {
    form: UseFormReturn<ContractInput>;
    tenantId?: string;
}

export function ContractParties({ form, tenantId }: ContractPartiesProps) {
    const { data: session } = useSession();

    useEffect(() => {
        // Auto-fill landlord from session
        if (session?.user?.id) {
            form.setValue("landlordId", session.user.id);
        }

        // Auto-fill tenant if provided (from application)
        if (tenantId) {
            form.setValue("tenantId", tenantId);
        }
    }, [session, tenantId, form]);

    return (
        <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-semibold">Chủ nhà (Bên A)</p>
                        <p className="text-sm text-muted-foreground">
                            {session?.user?.fullName || "Đang tải..."}
                        </p>
                    </div>



                    <div>
                        <p className="text-sm font-semibold mb-1">Người thuê (Bên B)</p>
                        {tenantId ? (
                            <p className="text-sm text-muted-foreground p-2 bg-background border rounded-md">
                                {tenantId ? "Đã chọn từ đơn xin thuê" : "Chọn từ danh sách"}
                            </p>
                        ) : (
                            <TenantSearch
                                onSelect={(tenant) => {
                                    if (tenant.userId) { // Ensure we pick userId as per schema Relation
                                        form.setValue("tenantId", tenant.userId, { shouldValidate: true });
                                    }
                                }}
                                error={form.formState.errors.tenantId?.message}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden fields */}
            <input type="hidden" {...form.register("landlordId")} />
            <input type="hidden" {...form.register("tenantId")} />
        </div>
    );
}
