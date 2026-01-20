"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Edit, Eye } from "lucide-react";
import { ContractTemplate } from "@/features/contracts/types/template.types";
import { templatesApi } from "@/features/contracts/api/templates-api";
import { formatDate } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";

export default function ContractTemplatesPage() {
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const { data } = await templatesApi.getAll();
            setTemplates(data);
        } catch (_error) {
            toast.error("Không thể tải danh sách mẫu hợp đồng");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mẫu Hợp Đồng</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý các mẫu văn bản pháp lý và phiên bản
                    </p>
                </div>
                {/* TODO: Add Create Button logic if needed, currently mostly seeded */}
                {/* <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm mới
        </Button> */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Danh sách mẫu hiện có
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có mẫu hợp đồng nào.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên mẫu</TableHead>
                                    <TableHead>Loại</TableHead>
                                    <TableHead>Phiên bản</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Cập nhật cuối</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">
                                            <div>{template.title}</div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {template.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{template.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">v{template.version}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {template.isActive ? (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                    Đang dùng
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Đã ẩn</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(new Date(template.updatedAt), "dd/MM/yyyy HH:mm", {
                                                locale: vi,
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Preview Button */}
                                                <Button variant="ghost" size="icon" title="Xem trước">
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                <Link href={`/dashboard/admin/contracts/templates/${template.id}`}>
                                                    <Button variant="ghost" size="icon" title="Chỉnh sửa">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
