"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Home, Calendar, DollarSign, UserPlus, FileText, CheckCircle2 } from "lucide-react";
import { contractSchema, type ContractInput } from "../schemas";
import { ContractParties } from "./form/contract-parties";
import { ContractRoomSelection } from "./form/contract-room-selection";
import { ContractBasicInfo } from "./form/contract-basic-info";
import { ContractFinancial } from "./form/contract-financial";
import { ContractResidents } from "./form/contract-residents";
import { ContractTermsEditor } from "./form/contract-terms-editor";
import { useState, useEffect } from "react";
// Import dynamically inside useEffect to avoid circular dependency issues if any,
// or better yet, import normally if possible.
// Given strict structure, I will use dynamic import within the effect for safety as seen before.

interface ContractFormLandlordProps {
    applicationId?: string;
    tenantId?: string;
    onSubmit: (data: ContractInput) => Promise<void>;
    onCancel?: () => void;
}

const FORM_SECTIONS = [
    { id: 1, title: "Các bên tham gia", icon: Users, description: "Chủ nhà và người thuê" },
    { id: 2, title: "Chọn phòng", icon: Home, description: "Phòng cho thuê" },
    { id: 3, title: "Thời hạn hợp đồng", icon: Calendar, description: "Ngày bắt đầu và kết thúc" },
    { id: 4, title: "Thông tin tài chính", icon: DollarSign, description: "Giá thuê và tiền cọc" },
    { id: 5, title: "Danh sách cư dân", icon: UserPlus, description: "Người ở cùng" },
    { id: 6, title: "Điều khoản hợp đồng", icon: FileText, description: "Các điều khoản và quy định" },
];

export function ContractFormLandlord({
    applicationId,
    tenantId,
    onSubmit,
    onCancel,
}: ContractFormLandlordProps) {
    const form = useForm<ContractInput>({
        resolver: zodResolver(contractSchema),
        defaultValues: {
            tenantId: tenantId || "",
            landlordId: "",
            roomId: "",
            applicationId: applicationId || "",
            startDate: "",
            endDate: "",
            monthlyRent: 0,
            deposit: 0,
            paymentDay: 5,
            residents: [],
            maxOccupants: 2,
            terms: "",
        },
    });

    useEffect(() => {
        const fetchApplication = async () => {
            if (applicationId) {
                try {
                    const appData = await import("@/features/rental-applications/api/rental-applications").then(m => m.rentalApplicationsApi.getOne(applicationId));
                    if (appData) {
                        const currentValues = form.getValues();
                        form.reset({
                            ...currentValues,
                            applicationId: appData.id,
                            tenantId: appData.tenantId,
                            roomId: appData.roomId,
                            // Pre-fill fields if available
                            monthlyRent: (appData.room?.pricePerMonth) ?? currentValues.monthlyRent,
                            deposit: (appData.room?.deposit) ?? currentValues.deposit,
                            landlordId: (appData.room?.property?.landlordId) ?? currentValues.landlordId,
                            maxOccupants: (appData.room?.maxOccupants) ?? currentValues.maxOccupants,
                        });
                    }
                } catch (err) {
                    console.error("Failed to load application details", err);
                }
            }
        };
        fetchApplication();
    }, [applicationId, form]);

    // Track completed sections based on form values (Derived State)
    const values = form.watch();
    const completedSections = new Set<number>();

    if (values.tenantId && values.landlordId) completedSections.add(1);
    if (values.roomId) completedSections.add(2);
    if (values.startDate && values.endDate) completedSections.add(3);
    if (values.monthlyRent > 0 && values.deposit > 0) completedSections.add(4);
    // Section 5 (residents) is optional
    if (values.terms && values.terms.length > 10) completedSections.add(6);

    const handleSubmit = async (data: ContractInput) => {
        try {
            await onSubmit(data as ContractInput);
        } catch (error) {
            console.error("Contract submission error:", error);
        }
    };

    const progress = (completedSections.size / FORM_SECTIONS.length) * 100;

    return (
        <div className="space-y-8">
            {/* Progress Indicator */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-6 -mt-2">
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">
                            Tiến độ hoàn thành
                        </span>
                        <span className="font-semibold text-primary">
                            {completedSections.size}/{FORM_SECTIONS.length} phần
                        </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}% ` }}
                        />
                    </div>
                </div>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* 1. Parties */}
                <SectionCard
                    section={FORM_SECTIONS[0]}
                    isCompleted={completedSections.has(1)}
                >
                    <ContractParties form={form} tenantId={tenantId} />
                </SectionCard>

                {/* 2. Room Selection */}
                <SectionCard
                    section={FORM_SECTIONS[1]}
                    isCompleted={completedSections.has(2)}
                >
                    <ContractRoomSelection form={form} />
                </SectionCard>

                {/* 3. Basic Info (Dates) */}
                <SectionCard
                    section={FORM_SECTIONS[2]}
                    isCompleted={completedSections.has(3)}
                >
                    <ContractBasicInfo form={form} />
                </SectionCard>

                {/* 4. Financial */}
                <SectionCard
                    section={FORM_SECTIONS[3]}
                    isCompleted={completedSections.has(4)}
                >
                    <ContractFinancial form={form} />
                </SectionCard>

                {/* 5. Residents */}
                <SectionCard
                    section={FORM_SECTIONS[4]}
                    isCompleted={false}
                    isOptional
                >
                    <ContractResidents form={form} />
                </SectionCard>

                {/* 6. Terms */}
                <SectionCard
                    section={FORM_SECTIONS[5]}
                    isCompleted={completedSections.has(6)}
                >
                    <ContractTermsEditor form={form} />
                </SectionCard>

                {/* Actions */}
                <div className="flex gap-3 justify-end sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6 border-t rounded-lg shadow-lg">
                    {onCancel && (
                        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
                            Hủy
                        </Button>
                    )}
                    <Button
                        type="submit"
                        size="lg"
                        disabled={form.formState.isSubmitting}
                        className="min-w-[200px]"
                    >
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang tạo hợp đồng...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Tạo hợp đồng
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

// Section Card Component
interface SectionCardProps {
    section: typeof FORM_SECTIONS[0];
    isCompleted: boolean;
    isOptional?: boolean;
    children: React.ReactNode;
}

function SectionCard({ section, isCompleted, isOptional, children }: SectionCardProps) {
    const Icon = section.icon;

    return (
        <div className="group relative p-8 border rounded-xl bg-card hover:shadow-md transition-all duration-200">
            {/* Completion Indicator */}
            {isCompleted && (
                <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Hoàn thành
                    </div>
                </div>
            )}

            {/* Section Header */}
            <div className="mb-6 space-y-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold tracking-tight">
                                {section.id}. {section.title}
                            </h3>
                            {isOptional && (
                                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                                    Tùy chọn
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {section.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Section Content */}
            <div>{children}</div>
        </div>
    );
}
