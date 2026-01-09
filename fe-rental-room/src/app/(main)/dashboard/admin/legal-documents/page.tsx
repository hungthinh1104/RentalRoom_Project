"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LegalDocumentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tài liệu pháp lý</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý và tra cứu các văn bản pháp luật, biểu mẫu hợp đồng.
                </p>
            </div>

            <Tabs defaultValue="regulations" className="w-full">
                <TabsList>
                    <TabsTrigger value="regulations">Quy định pháp luật</TabsTrigger>
                    <TabsTrigger value="templates">Biểu mẫu hợp đồng</TabsTrigger>
                    <TabsTrigger value="policy">Chính sách nền tảng</TabsTrigger>
                </TabsList>

                <TabsContent value="regulations" className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <DocumentCard
                            title="Luật Nhà ở 2023"
                            description="Các quy định mới nhất về sở hữu, quản lý, sử dụng nhà ở."
                            date="01/01/2025"
                            type="PDF"
                            fileUrl="/legal-docs/sample-contract.pdf"
                        />
                        <DocumentCard
                            title="Luật Kinh doanh BĐS 2023"
                            description="Quy định về kinh doanh bất động sản, quyền và nghĩa vụ."
                            date="01/01/2025"
                            type="PDF"
                            fileUrl="/legal-docs/sample-contract.pdf"
                        />
                        <DocumentCard
                            title="Nghị định 96/2023/NĐ-CP"
                            description="Quy định chi tiết một số điều của Luật Khám bệnh, chữa bệnh."
                            date="15/12/2023"
                            type="PDF"
                            fileUrl="/legal-docs/sample-contract.pdf"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <DocumentCard
                            title="Mẫu Hợp đồng thuê trọ"
                            description="Mẫu chuẩn theo quy định mới nhất, bao gồm các điều khoản bảo vệ quyền lợi."
                            date="Update: 15/01/2025"
                            type="DOCX"
                            fileUrl="/legal-docs/sample-contract.pdf"
                        />
                        <DocumentCard
                            title="Biên bản bàn giao tài sản"
                            description="Dùng khi nhận phòng hoặc trả phòng."
                            date="Update: 10/01/2025"
                            type="DOCX"
                            fileUrl="/legal-docs/sample-contract.pdf"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="policy" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Điều khoản sử dụng</CardTitle>
                            <CardDescription>Cập nhật lần cuối: 01/01/2025</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Nội dung điều khoản sử dụng nền tảng...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function DocumentCard({ title, description, date, type, fileUrl }: {
    title: string,
    description: string,
    date: string,
    type: string,
    fileUrl?: string
}) {
    const handleView = () => {
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    };

    const handleDownload = () => {
        if (fileUrl) {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = `${title}.${type.toLowerCase()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-start justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        {title}
                    </span>
                    <span className="text-xs font-normal border px-2 py-0.5 rounded bg-muted">
                        {type}
                    </span>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">{date}</span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={handleView}
                            disabled={!fileUrl}
                        >
                            <FileText className="h-4 w-4 mr-1" />
                            Xem
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={handleDownload}
                            disabled={!fileUrl}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Tải về
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
