"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ContractFormLandlord } from "@/features/contracts/components/contract-form-landlord";
import { showSuccess, showError } from "@/components/ui/toast-notification";
import api from "@/lib/api/client";
import type { ContractInput } from "@/features/contracts/schemas";

export default function CreateContractPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const applicationId = searchParams.get("applicationId") || undefined;
    const tenantId = searchParams.get("tenantId") || undefined;

    const handleSubmit = async (data: ContractInput) => {
        try {
            // 1. Create contract
            const response = await api.post("/contracts", data);
            const contract = response.data as { id: string };

            showSuccess("Hợp đồng đã được tạo thành công!");

            // 2. Auto-generate PDF (async - non-blocking)
            try {
                await api.post(`/contracts/${contract.id}/generate-pdf-async`);
            } catch (pdfError) {
                console.error("PDF generation failed:", pdfError);
                // Don't block user flow if PDF fails
            }

            // 3. Navigate to contract payment page
            router.push(`/contracts/${contract.id}/payment`);
        } catch (error: unknown) {
            console.error("Contract creation error:", error);
            if (error && typeof error === "object" && "response" in error) {
                const response = (error as { response: { data: { message: string } } })
                    .response;
                showError(response?.data?.message || "Có lỗi xảy ra khi tạo hợp đồng");
            } else {
                showError("Có lỗi xảy ra khi tạo hợp đồng");
            }
            throw error;
        }
    };

    return (
        <div className="container py-8 max-w-5xl">
            <div className="mb-8 space-y-4">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tạo hợp đồng mới</h1>
                    <p className="text-muted-foreground mt-2">
                        Điền thông tin để tạo hợp đồng thuê phòng
                    </p>
                </div>
            </div>

            <ContractFormLandlord
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                applicationId={applicationId}
                tenantId={tenantId}
            />
        </div>
    );
}
