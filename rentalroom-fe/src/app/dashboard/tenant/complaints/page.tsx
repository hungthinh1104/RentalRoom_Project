"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquareWarning, Plus, Send, Image as ImageIcon, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  response?: string;
}

const COMPLAINT_CATEGORIES = [
  { value: "MAINTENANCE", label: "Bảo trì / Sửa chữa" },
  { value: "PAYMENT", label: "Vấn đề thanh toán" },
  { value: "LANDLORD", label: "Khiếu nại chủ nhà" },
  { value: "FACILITIES", label: "Tiện ích / Cơ sở vật chất" },
  { value: "NOISE", label: "Tiếng ồn" },
  { value: "CLEANLINESS", label: "Vệ sinh" },
  { value: "OTHER", label: "Khác" },
];

export default function TenantComplaintsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "MAINTENANCE",
  });

  // Fetch complaints
  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ["tenant-complaints", session?.user?.id],
    queryFn: async () => {
      const { data } = await api.get("/feedback");
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const complaints: Complaint[] = complaintsData?.items || complaintsData || [];

  // Create complaint mutation
  const createComplaint = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string }) => {
      const response = await api.post("/feedback", {
        type: "COMPLAINT",
        ...data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-complaints"] });
      toast.success("Đã gửi khiếu nại thành công");
      setDialogOpen(false);
      setFormData({ title: "", description: "", category: "MAINTENANCE" });
    },
    onError: () => {
      toast.error("Không thể gửi khiếu nại");
    },
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    createComplaint.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã giải quyết
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue/10 text-blue border-blue/20">
            <Clock className="h-3 w-3 mr-1" />
            Đang xử lý
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Từ chối
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Chờ xử lý
          </Badge>
        );
    }
  };

  const pendingCount = complaints.filter((c: Complaint) => c.status === "PENDING").length;
  const resolvedCount = complaints.filter((c: Complaint) => c.status === "RESOLVED").length;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-7xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquareWarning className="h-8 w-8 text-primary" />
            </div>
            Khiếu Nại & Phản Ánh
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Gửi khiếu nại về phòng trọ, chủ nhà hoặc dịch vụ
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Gửi khiếu nại mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Gửi Khiếu Nại Mới</DialogTitle>
              <DialogDescription>
                Mô tả chi tiết vấn đề bạn gặp phải. Chúng tôi sẽ xử lý trong 24-48 giờ.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Loại khiếu nại</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Textarea
                  id="title"
                  placeholder="Tóm tắt vấn đề (vd: Điều hòa không hoạt động)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả chi tiết</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết vấn đề, thời gian xảy ra, mức độ ảnh hưởng..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                />
              </div>

              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Tính năng upload ảnh đang phát triển
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={createComplaint.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createComplaint.isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {createComplaint.isPending ? "Đang gửi..." : "Gửi khiếu nại"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng khiếu nại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{complaints.length}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang chờ xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã giải quyết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{resolvedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-primary" />
            Danh Sách Khiếu Nại
          </CardTitle>
          <CardDescription>
            Theo dõi trạng thái và phản hồi từ chủ nhà/quản lý
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquareWarning className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">Chưa có khiếu nại nào</p>
              <p className="text-sm text-muted-foreground mt-2">
                Nhấn &quot;Gửi khiếu nại mới&quot; để bắt đầu
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint: Complaint) => (
                <Card key={complaint.id} className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{complaint.title}</h3>
                            {getStatusBadge(complaint.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {COMPLAINT_CATEGORIES.find((c) => c.value === complaint.category)?.label || complaint.category}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(complaint.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                      </div>

                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {complaint.description}
                      </p>

                      {complaint.response && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            Phản hồi từ quản lý:
                          </p>
                          <p className="text-sm text-muted-foreground">{complaint.response}</p>
                          {complaint.resolvedAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Giải quyết lúc: {format(new Date(complaint.resolvedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
