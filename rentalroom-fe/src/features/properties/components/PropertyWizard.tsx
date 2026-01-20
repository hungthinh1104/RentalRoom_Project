"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProperties } from "../hooks/use-properties";
import { PropertyType } from "../types";
import { Loader2, Check, ArrowRight, Building2, MapPin, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/common/ImageUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const propertySchema = z.object({
    name: z.string().min(3, "Tên bất động sản phải có ít nhất 3 ký tự"),
    propertyType: z.nativeEnum(PropertyType),
    description: z.string().optional(),
    address: z.string().min(5, "Địa chỉ quá ngắn"),
    city: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),
    ward: z.string().min(1, "Vui lòng chọn Phường/Xã"),
    images: z.array(z.string()).optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STEPS = [
    { id: 1, title: "Thông tin cơ bản", icon: Building2 },
    { id: 2, title: "Vị trí", icon: MapPin },
    { id: 3, title: "Hình ảnh", icon: ImageIcon },
];

export function PropertyWizard({ open, onOpenChange }: PropertyWizardProps) {
    const [step, setStep] = useState(1);
    const { createProperty, isCreating } = useProperties();

    const form = useForm<PropertyFormValues>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            name: "",
            propertyType: PropertyType.APARTMENT,
            address: "",
            city: "Hồ Chí Minh", // Default for MVP
            ward: "",
            images: [],
            description: "",
        },
    });

    const onSubmit = async (data: PropertyFormValues) => {
        try {
            await createProperty(data);
            toast.success("Tạo bất động sản thành công!");
            onOpenChange(false);
            form.reset();
            setStep(1);
        } catch (error) {
            toast.error("Có lỗi xảy ra", { description: "Vui lòng thử lại sau." });
        }
    };

    const nextStep = async () => {
        const fields = (step === 1
            ? ["name", "propertyType", "description"]
            : step === 2
                ? ["address", "city", "ward"]
                : []) as Array<keyof PropertyFormValues>;

        const isValid = await form.trigger(fields);
        if (isValid) setStep((s) => s + 1);
    };

    const prevStep = () => setStep((s) => s - 1);

    // Images Handler
    const images = form.watch("images") || [];
    const addImage = (url: string) => {
        form.setValue("images", [...images, url]);
    };
    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        form.setValue("images", newImages);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background/95 backdrop-blur-3xl border-border/40">
                {/* Header with Steps */}
                <div className="bg-muted/30 p-6 border-b border-border/40">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl">Thêm Bất Động Sản Mới</DialogTitle>
                        <DialogDescription>Quản lý tài sản của bạn dễ dàng hơn.</DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center justify-between relative px-2">
                        {/* Progress Bar Line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border/50 -z-10" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-500 transition-all duration-300 -z-10"
                            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                        />

                        {STEPS.map((s) => {
                            const isActive = s.id === step;
                            const isCompleted = s.id < step;

                            return (
                                <div key={s.id} className="flex flex-col items-center gap-2 bg-background p-2 rounded-full">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                        isActive ? "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/20" :
                                            isCompleted ? "border-amber-500 bg-background text-amber-500" : "border-muted-foreground/30 text-muted-foreground bg-background"
                                    )}>
                                        {isCompleted ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium absolute -bottom-6 w-32 text-center",
                                        isActive ? "text-amber-500" : "text-muted-foreground"
                                    )}>{s.title}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 pt-8">
                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên tòa nhà / Căn hộ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ví dụ: Chung cư Sunrise City" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="propertyType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại hình</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại hình" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={PropertyType.APARTMENT}>Chung cư (Apartment)</SelectItem>
                                                <SelectItem value={PropertyType.HOUSE}>Nhà nguyên căn (House)</SelectItem>
                                                <SelectItem value={PropertyType.STUDIO}>Căn hộ dịch vụ (Studio)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mô tả (Tùy chọn)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Mô tả ngắn về tiện ích, vị trí..." className="resize-none h-24" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        )}

                        {/* Step 2: Location */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <FormField control={form.control} name="city" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tỉnh / Thành phố</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn Tỉnh/Thành" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Hồ Chí Minh">TP. Hồ Chí Minh</SelectItem>
                                                <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                                                <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                                                {/* Add more as needed */}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="ward" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phường / Xã</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập Phường/Xã" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    {/* Address input needs to be full descriptive */}
                                </div>

                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Địa chỉ chi tiết</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số nhà, tên đường..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        )}

                        {/* Step 3: Images */}
                        {step === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <Label>Hình ảnh mô tả</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {images.map((url, idx) => (
                                        <ImageUpload
                                            key={idx}
                                            value={url}
                                            onSuccess={() => { }}
                                            onRemove={() => removeImage(idx)}
                                        />
                                    ))}
                                    {/* Allow adding up to 4 images for now */}
                                    {images.length < 4 && (
                                        <ImageUpload
                                            folder="/properties"
                                            onSuccess={(url) => addImage(url)}
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    *Hình đầu tiên sẽ được chọn làm ảnh đại diện.
                                </p>
                            </div>
                        )}

                        <DialogFooter className="flex items-center justify-between sm:justify-between pt-4 border-t border-border/40">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                disabled={step === 1 || isCreating}
                                className="w-24"
                            >
                                Quay lại
                            </Button>

                            {step < 3 ? (
                                <Button type="button" onClick={nextStep} className="w-24 bg-amber-500 hover:bg-amber-600">
                                    Tiếp tục <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isCreating} className="w-32 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hoàn tất"}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
