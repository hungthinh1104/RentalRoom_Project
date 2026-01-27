"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquareWarning, Plus, Send, Image as ImageIcon, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { useDisputes, useCreateDispute } from "@/features/disputes/hooks/use-disputes";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DisputeItem {
  id: string;
  description: string;
  category?: string;
  status: "OPEN" | "APPROVED" | "REJECTED" | "PARTIAL" | "ESCALATED";
  claimAmount: number;
  approvedAmount?: number | null;
  contractId: string;
  evidence?: Array<{ id: string; url: string }>;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionReason?: string | null;
}

const DISPUTE_CATEGORIES = [
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    contractId: "",
    claimAmount: 0,
    description: "",
    category: "MAINTENANCE",
    evidenceUrlsText: "",
  });

  const { data: disputesData, isLoading } = useDisputes();
  const disputes: DisputeItem[] = disputesData || [];

  const { data: contractsData } = useContracts({ tenantId: session?.user?.id });
  const contractOptions = contractsData?.data || contractsData || [];

  const createDispute = useCreateDispute();

  const handleSubmit = () => {
    if (!formData.contractId) {
      toast.error("Chọn hợp đồng cần khiếu nại");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Mô tả chi tiết vấn đề");
      return;
    }
    if (!formData.claimAmount || formData.claimAmount <= 0) {
      toast.error("Nhập số tiền yêu cầu bồi hoàn");
      return;
    }
    const evidenceList = formData.evidenceUrlsText
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (evidenceList.length === 0) {
      toast.error("Cần ít nhất 1 bằng chứng (link ảnh/tài liệu)");
      return;
    }

    createDispute.mutate(
      {
        contractId: formData.contractId,
        claimantRole: "TENANT",
        claimAmount: Number(formData.claimAmount),
        description: formData.description,
        evidenceUrls: evidenceList,
      },
      {
        onSuccess: () => {
          toast.success("Đã gửi khiếu nại (dispute) thành công");
          setDialogOpen(false);
          setFormData({
            contractId: "",
            claimAmount: 0,
            description: "",
            category: "MAINTENANCE",
            evidenceUrlsText: "",
          });
        },
        onError: () => toast.error("Không thể gửi dispute"),
      },
    );
  };

  const getStatusBadge = (status: DisputeItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Chấp nhận
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge className="bg-blue/10 text-blue border-blue/20">
            <Clock className="h-3 w-3 mr-1" />
            Chấp nhận một phần
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Từ chối
          </Badge>
        );
      case "ESCALATED":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Đã chuyển cấp
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Đang mở
          </Badge>
        );
    }
  };

  const pendingCount = disputes.filter((d: DisputeItem) => d.status === "OPEN").length;
  const resolvedCount = disputes.filter((d: DisputeItem) => d.status === "APPROVED" || d.status === "PARTIAL").length;

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
                <Label>Hợp đồng</Label>
                <Select
                  value={formData.contractId}
                  onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hợp đồng" />
                  </SelectTrigger>
                  <SelectContent>
                    {(!contractOptions || contractOptions.length === 0) && (
                      <SelectItem value="NONE" disabled>
                        Chưa có hợp đồng
                      </SelectItem>
                    )}
                    {contractOptions
                      ?.filter((c: { id: string }) => typeof c?.id === "string" && c.id.trim() !== "")
                      .map((c: { id: string; code?: string; room?: { name?: string } }) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code || c.id.substring(0, 8)} - {c.room?.name || "Phòng"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số tiền yêu cầu (VND)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.claimAmount || ""}
                    onChange={(e) => setFormData({ ...formData, claimAmount: Number(e.target.value) })}
                    placeholder="Ví dụ: 500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại tranh chấp</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPUTE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="space-y-2">
                <Label>Bằng chứng (mỗi dòng một link)</Label>
                <Textarea
                  placeholder="https://...\nhttps://..."
                  value={formData.evidenceUrlsText}
                  onChange={(e) => setFormData({ ...formData, evidenceUrlsText: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Dán link ảnh/tài liệu (Google Drive, S3, Imgur...). Tối đa 10 link.</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={createDispute.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createDispute.isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {createDispute.isPending ? "Đang gửi..." : "Gửi khiếu nại"}
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
            <p className="text-3xl font-bold">{disputes.length}</p>
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
          ) : disputes.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquareWarning className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">Chưa có khiếu nại nào</p>
              <p className="text-sm text-muted-foreground mt-2">
                Nhấn &quot;Gửi khiếu nại mới&quot; để bắt đầu
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute: DisputeItem) => (
                <Card key={dispute.id} className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {DISPUTE_CATEGORIES.find((c) => c.value === dispute.category)?.label || dispute.category || "Không xác định"}
                            </h3>
                            {getStatusBadge(dispute.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Yêu cầu: {dispute.claimAmount.toLocaleString('vi-VN')} VND
                            {dispute.approvedAmount && ` • Chấp nhận: ${dispute.approvedAmount.toLocaleString('vi-VN')} VND`}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(dispute.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                      </div>

                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {dispute.description}
                      </p>

                      {dispute.evidence && dispute.evidence.length > 0 && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-info" />
                            Bằng chứng ({dispute.evidence.length}):
                          </p>
                          <div className="space-y-2">
                            {dispute.evidence.map((ev, idx) => (
                              <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">
                                Bằng chứng {idx + 1}: {ev.url.substring(0, 50)}...
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {dispute.resolutionReason && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            Lý do giải quyết:
                          </p>
                          <p className="text-sm text-muted-foreground">{dispute.resolutionReason}</p>
                          {dispute.resolvedAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Giải quyết lúc: {format(new Date(dispute.resolvedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
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
