"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Service, ServiceType, BillingMethod } from "@/features/services/api/services-api";
import { useCreateService, useUpdateService } from "@/features/services/api/services-queries";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    serviceName: z.string().min(1, "Tên dịch vụ là bắt buộc"),
    serviceType: z.nativeEnum(ServiceType),
    billingMethod: z.nativeEnum(BillingMethod),
    unitPrice: z.coerce.number().min(0, "Đơn giá không được âm"),
    unit: z.string().optional(),
    description: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof formSchema>;

interface ServiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service?: Service; // If provided, running in Edit mode
    propertyId: string;
}

export function ServiceDialog({ open, onOpenChange, service, propertyId }: ServiceDialogProps) {
    const isEditing = !!service;
    const createServiceMutation = useCreateService();
    const updateServiceMutation = useUpdateService();

    const form = useForm<ServiceFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            serviceName: "",
            serviceType: ServiceType.OTHER,
            billingMethod: BillingMethod.METERED,
            unitPrice: 0,
            unit: "",
            description: "",
        },
    });

    // Reset form when service changes or dialog opens/closes
    useEffect(() => {
        if (service) {
            form.reset({
                serviceName: service.serviceName,
                serviceType: service.serviceType,
                billingMethod: service.billingMethod,
                unitPrice: service.unitPrice,
                unit: service.unit || "",
                description: service.description || "",
            });
        } else {
            form.reset({
                serviceName: "",
                serviceType: ServiceType.OTHER,
                billingMethod: BillingMethod.METERED,
                unitPrice: 0,
                unit: "",
                description: "",
            });
        }
    }, [service, open, form]);

    const onSubmit = async (values: ServiceFormValues) => {
        try {
            if (isEditing) {
                await updateServiceMutation.mutateAsync({
                    id: service.id,
                    dto: values,
                });
                toast.success("Cập nhật dịch vụ thành công");
            } else {
                await createServiceMutation.mutateAsync({
                    propertyId,
                    ...values,
                });
                toast.success("Thêm dịch vụ thành công");
            }
            onOpenChange(false);
        } catch (error) {
            toast.error(isEditing ? "Cập nhật thất bại" : "Thêm mới thất bại");
            console.error(error);
        }
    };

    const isLoading = createServiceMutation.isPending || updateServiceMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Cập nhật thông tin chi tiết cho dịch vụ này."
                            : "Thêm một dịch vụ mới vào nhà trọ để tính phí cho khách."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="serviceName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên dịch vụ</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: Điện sinh hoạt, Nước máy..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="serviceType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại dịch vụ</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(ServiceType).map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="billingMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cách tính</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn cách tính" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={BillingMethod.METERED}>Theo chỉ số (Metered)</SelectItem>
                                                <SelectItem value={BillingMethod.FIXED}>Cố định (Fixed)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="unitPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Đơn giá</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Đơn vị tính</FormLabel>
                                        <FormControl>
                                            <Input placeholder="kwh, m3, người, phòng..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả (tùy chọn)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ghi chú thêm về dịch vụ..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Lưu thay đổi" : "Thêm dịch vụ"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
