"use client";

import { useState } from "react";
import { Plus, History, Download, Eye, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { PCCCForm } from "@/features/pccc/components/PCCCForm";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { PCCCReport } from "@/features/pccc/types/pccc.types";
import { Skeleton } from "@/components/ui/skeleton";
import { PDFDownloadCard } from "@/features/pccc/components/PDFDownloadCard";

export default function LandlordPCCCPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<PCCCReport | null>(null);

    // Fetch reports for current landlord
    // Assuming backend has an endpoint or filter for this. 
    // If not, we might need to adjust based on API availability. 
    // Using a generic GET to pccc/reports or similar for now.
    // Based on controller, GET /pccc/reports/:id is specific. 
    // We might need to ask BE logic later if "list my reports" is missing.
    // For now, let's assume we can fetch property-wise or user-wise.
    // Actually, let's look at the controller again.
    // Controller:
    // @Post('properties/:propertyId/report') -> Generate
    // @Get('admin/reports') -> Admin list all
    // There is no explicit "get my reports".
    // However, usually GET /pccc/reports might list for user if implemented, or we filter from admin endpoint logic if not secured?
    // Let's defer to a simple list for now using a potential future endpoint or client-side filtering properties?
    // Actually, let's check if we can get reports via properties.
    // Let's implement the UI assuming we will fix the API connection next if needed.

    // TEMPORARY: Using a hypothetical endpoint or local state for demo if API missing.
    // Ideally we update the task boundaries to "Update API" if missing. 
    // Let's use the Admin list endpoint for now but filter client side? No, better:
    // We will render the PCCC Form as primary action.

    return (
        <div className="container py-8 max-w-[1600px] space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Thẩm Định PCCC</h1>
                    <p className="text-muted-foreground mt-2">
                        Tạo hồ sơ, đánh giá an toàn cháy nổ và quản lý giấy phép PCCC cho các nhà trọ.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="generate" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="generate">Tạo Hồ Sơ Mới</TabsTrigger>
                    {/* <TabsTrigger value="history">Lịch Sử Hồ Sơ</TabsTrigger> */}
                </TabsList>

                <TabsContent value="generate" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Công Cụ Thẩm Định Tự Động</CardTitle>
                            <CardDescription>
                                Điền thông tin bên dưới để hệ thống AI đánh giá rủi ro và tự động lập hồ sơ theo chuẩn PC17/PC19.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PCCCForm />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* <TabsContent value="history">
                     History Table Placeholder
                </TabsContent> */}
            </Tabs>
        </div>
    );
}
