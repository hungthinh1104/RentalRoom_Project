"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Save, FileCode, GitCompare, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ContractTemplate, ContractType, ContractHistoryLog } from "@/features/contracts/types/template.types";
import { templatesApi } from "@/features/contracts/api/templates-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";



const formSchema = z.object({
    title: z.string().min(1, "Vui lòng nhập tiêu đề"),
    name: z.string().min(1, "Vui lòng nhập mã template (VD: RENTAL_DEFAULT)"),
    type: z.nativeEnum(ContractType),
    content: z.string().min(10, "Nội dung quá ngắn"),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    isDefault: z.boolean().default(true),
});

export default function ContractTemplateEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const isNew = id === "new";

    const [isLoading, setIsLoading] = useState(false);
    const [template, setTemplate] = useState<ContractTemplate | null>(null);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            name: "",
            type: ContractType.RENTAL_AGREEMENT,
            content: "",
            description: "",
            isActive: true,
            isDefault: true,
        } as z.infer<typeof formSchema>,
    });

    useEffect(() => {
        const loadTemplate = async (templateId: string) => {
            try {
                setIsLoading(true);
                const { data } = await templatesApi.getOne(templateId);
                setTemplate(data);
                form.reset({
                    title: data.title,
                    name: data.name,
                    type: data.type,
                    content: data.content,
                    description: data.description || "",
                    isActive: data.isActive,
                    isDefault: data.isDefault,
                });
            } catch (_error) {
                toast.error("Không thể tải thông tin mẫu hợp đồng");
                router.push("/dashboard/admin/contracts/templates");
            } finally {
                setIsLoading(false);
            }
        };

        if (!isNew && id) {
            loadTemplate(id);
        }
    }, [id, isNew, form, router]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);
            if (isNew) {
                await templatesApi.create(values);
                toast.success("Tạo mới mẫu hợp đồng thành công");
            } else {
                await templatesApi.update(id, values);
                toast.success("Cập nhật mẫu hợp đồng thành công");
            }
            router.push("/dashboard/admin/contracts/templates");
        } catch (_error) {
            toast.error("Có lỗi xảy ra khi lưu mẫu hợp đồng");
        } finally {
            setIsLoading(false);
        }
    };

    const [history, setHistory] = useState<ContractHistoryLog[]>([]);
    const [compareData, setCompareData] = useState<{ old: string | null; new: string | null; info: ContractHistoryLog } | null>(null);

    const loadHistory = async () => {
        try {
            const { data } = await templatesApi.getHistory(id);
            setHistory(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/admin/contracts/templates">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isNew ? "Tạo Mẫu Mới" : `Chỉnh Sửa: ${template?.title}`}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Soạn thảo nội dung hợp đồng sử dụng HTML và Handlebars
                    </p>
                </div>
            </div>

            <Tabs defaultValue="editor" className="w-full" onValueChange={(val) => val === 'history' && loadHistory()}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="editor">Soạn thảo</TabsTrigger>
                        <TabsTrigger value="history" disabled={isNew}>Lịch sử thay đổi</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="editor">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left Column: Metadata */}
                                <div className="md:col-span-1 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Thông tin chung</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="title"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tiêu đề hiển thị</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Hợp đồng thuê trọ..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Mã mẫu (System Name)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="RENTAL_DEFAULT"
                                                                {...field}
                                                                disabled={!isNew}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            Dùng để định danh trong code (VD: RENTAL_DEFAULT)
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Loại hợp đồng</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                            disabled={!isNew}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Chọn loại" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {Object.values(ContractType).map((type) => (
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
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Mô tả</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Ghi chú về phiên bản này..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="isActive"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <div className="space-y-0.5">
                                                            <FormLabel>Hoạt động</FormLabel>
                                                            <FormDescription>
                                                                Cho phép sử dụng mẫu này
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="isDefault"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <div className="space-y-0.5">
                                                            <FormLabel>Mặc định</FormLabel>
                                                            <FormDescription>
                                                                Mẫu chính cho loại này
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                                    </Button>
                                </div>

                                {/* Right Column: Content Editor */}
                                <div className="md:col-span-2">
                                    <Card className="h-full flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <FileCode className="h-5 w-5" />
                                                Nội dung (HTML + Handlebars)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col min-h-[500px]">
                                            <FormField
                                                control={form.control}
                                                name="content"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1 flex flex-col">
                                                        <FormControl>
                                                            <Textarea
                                                                className="flex-1 font-mono text-sm leading-relaxed"
                                                                placeholder="<html>...</html>"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="history">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={cn("space-y-4 transition-all duration-300", compareData ? "md:col-span-1" : "md:col-span-3")}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Lịch sử thay đổi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {history.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                Chưa có lịch sử thay đổi nào.
                                            </div>
                                        ) : (
                                            history.map((log) => (
                                                <div
                                                    key={log.id}
                                                    className={cn(
                                                        "flex flex-col border p-3 rounded-lg transition-all cursor-pointer",
                                                        compareData?.info?.id === log.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                                                    )}
                                                    onClick={() => log.action === "EDIT" && setCompareData({ old: log.oldContent ?? null, new: log.newContent ?? null, info: log })}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={log.action === "DELETE" ? "destructive" : log.action === "CREATE" ? "default" : "outline"}>
                                                                {log.action}
                                                            </Badge>
                                                            <span className="font-medium text-sm">
                                                                {log.user?.fullName || "Admin"}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                            {new Date(log.timestamp).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' })}
                                                        </span>
                                                    </div>
                                                    {log.action === "EDIT" && (
                                                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                                            <span className="flex items-center gap-1 italic">
                                                                <GitCompare className="h-3 w-3" /> Click để xem thay đổi
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <AnimatePresence>
                            {compareData && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="md:col-span-2 space-y-4"
                                >
                                    <Card className="h-full flex flex-col min-h-[600px] border-primary/20 shadow-xl">
                                        <CardHeader className="py-3 flex flex-row items-center justify-between bg-primary/5 rounded-t-lg">
                                            <div>
                                                <CardTitle className="text-sm">So sánh phiên bản</CardTitle>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Thay đổi thực hiện bởi {compareData.info?.user?.fullName} lúc {new Date(compareData.info?.timestamp).toLocaleString("vi-VN")}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCompareData(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                                            <div className="grid grid-cols-2 text-[10px] bg-muted py-1 border-y">
                                                <div className="px-3 border-r font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                                    <span className="bg-red-500/20 text-red-600 px-1 rounded">Cũ</span> Previous Content
                                                </div>
                                                <div className="px-3 font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                                    <span className="bg-green-500/20 text-green-600 px-1 rounded">Mới</span> Updated Content
                                                </div>
                                            </div>
                                            <ScrollArea className="flex-1 h-[500px]">
                                                <div className="grid grid-cols-2 divide-x h-full">
                                                    <pre className="p-3 text-[11px] font-mono leading-relaxed bg-red-500/[0.02]">
                                                        {compareData.old || "(Trống)"}
                                                    </pre>
                                                    <pre className="p-3 text-[11px] font-mono leading-relaxed bg-green-500/[0.02]">
                                                        {compareData.new || "(Trống)"}
                                                    </pre>
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
