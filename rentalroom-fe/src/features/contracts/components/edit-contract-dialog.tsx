"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Contract } from "@/types";
import { contractsApi } from "../api/contracts-api";

const updateContractSchema = z.object({
    monthlyRent: z.coerce.number().min(0, "Giá thuê không hợp lệ"),
    deposit: z.coerce.number().min(0, "Tiền cọc không hợp lệ"),
    startDate: z.string().min(1, "Ngày bắt đầu không được để trống"),
    endDate: z.string().min(1, "Ngày kết thúc không được để trống"),
    terms: z.string().optional(),
});

type UpdateContractFormValues = z.infer<typeof updateContractSchema>;

interface EditContractDialogProps {
    contract: Contract;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditContractDialog({
    contract,
    open,
    onOpenChange,
    onSuccess,
}: EditContractDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form with current contract data
    const form = useForm<UpdateContractFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(updateContractSchema) as any,
        defaultValues: {
            monthlyRent: contract.monthlyRent ? Number(contract.monthlyRent) : 0,
            deposit: contract.deposit ? Number(contract.deposit) : 0,
            startDate: contract.startDate
                ? format(new Date(contract.startDate), "yyyy-MM-dd")
                : "",
            endDate: contract.endDate
                ? format(new Date(contract.endDate), "yyyy-MM-dd")
                : "",
            terms: contract.terms || "",
        },
    });

    const onSubmit = async (values: UpdateContractFormValues) => {
        try {
            setIsSubmitting(true);

            // Convert dates to ISO strings (or ensure backend handles yyyy-MM-dd)
            // Prisma usually expects ISO-8601 DateTime strings.
            // So we wrap them in new Date().toISOString()
            const payload = {
                monthlyRent: values.monthlyRent,
                deposit: values.deposit,
                startDate: new Date(values.startDate).toISOString(),
                endDate: new Date(values.endDate).toISOString(),
                terms: values.terms,
            };

            await contractsApi.updateContract(contract.id, payload);

            toast.success("Cập nhật hợp đồng thành công");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Không thể cập nhật hợp đồng");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa hợp đồng</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin hợp đồng trước khi gửi cho người thuê.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="monthlyRent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá thuê (VNĐ/tháng)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="deposit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tiền cọc (VNĐ)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày bắt đầu</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày kết thúc</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="terms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Điều khoản hợp đồng</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[100px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
