"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useDisputes, useResolveDispute } from "@/features/disputes/hooks/use-disputes";
import type { DisputeItem } from "@/features/disputes/api/disputes-api";
import { useLegalConfirmation } from "@/components/security/legal-finality-dialog";
import { isActionAllowed } from "@/lib/security/action-matrix";
import { sanitizeText } from "@/lib/security/sanitize";

const DISPUTE_CATEGORIES = [
  { value: "MAINTENANCE", label: "Bảo trì / Sửa chữa" },
  { value: "PAYMENT", label: "Vấn đề thanh toán" },
  { value: "LANDLORD", label: "Khiếu nại chủ nhà" },
  { value: "FACILITIES", label: "Tiện ích / Cơ sở vật chất" },
  { value: "NOISE", label: "Tiếng ồn" },
  { value: "CLEANLINESS", label: "Vệ sinh" },
  { value: "OTHER", label: "Khác" },
];

const RESOLUTION_OPTIONS = [
  { value: "APPROVED", label: "Chấp nhận toàn bộ" },
  { value: "PARTIAL", label: "Chấp nhận một phần" },
  { value: "REJECTED", label: "Từ chối" },
];

export default function AdminDisputesClient() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    resolution: "APPROVED",
    approvedAmount: 0,
    reason: "",
  });
  const { confirm, Dialog: LegalDialog } = useLegalConfirmation();

  const { data: disputesData, isLoading } = useDisputes();
  const disputes: DisputeItem[] = useMemo(() => {
    let filtered: DisputeItem[] = disputesData || [];

    if (statusFilter) {
      filtered = filtered.filter((d: DisputeItem) => d.status === statusFilter);
    }

    if (search) {
      filtered = filtered.filter(
        (d: DisputeItem) =>
          d.description.toLowerCase().includes(search.toLowerCase()) ||
          d.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [disputesData, statusFilter, search]);

  const resolveDispute = useResolveDispute();

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
            Một phần
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            Từ chối
          </Badge>
        );
      case "ESCALATED":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Chuyển cấp
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Mở
          </Badge>
        );
    }
  };

  const handleResolve = (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    setResolutionData({
      resolution: "APPROVED",
      approvedAmount: dispute.claimAmount,
      reason: "",
    });
    setResolutionModalOpen(true);
  };

  const handleSubmitResolution = () => {
    if (!selectedDispute) return;

    if (!resolutionData.reason.trim()) {
      toast.error("Vui lòng nhập lý do giải quyết");
      return;
    }

    if (
      resolutionData.resolution !== "REJECTED" &&
      (!resolutionData.approvedAmount || resolutionData.approvedAmount < 0)
    ) {
      toast.error("Nhập số tiền chấp nhận hợp lệ");
      return;
    }

    // Use LegalFinalityDialog for confirmation
    confirm(
      {
        title: "Giải quyết tranh chấp",
        description: `Bạn đang giải quyết tranh chấp ${selectedDispute.id.substring(0, 8)}... với kết luận: ${resolutionData.resolution}. Hành động này sẽ tạo snapshot pháp lý và không thể hoàn tác.`,
        severity: "legal",
        consentText: "Tôi xác nhận giải quyết tranh chấp này",
      },
      async () => {
        resolveDispute.mutate(
          {
            disputeId: selectedDispute.id,
            resolution: resolutionData.resolution as "APPROVED" | "PARTIAL" | "REJECTED",
            approvedAmount:
              resolutionData.resolution === "REJECTED" ? 0 : resolutionData.approvedAmount,
            resolutionReason: resolutionData.reason,
          },
          {
            onSuccess: (result: { snapshotId?: string }) => {
              toast.success(
                result?.snapshotId
                  ? `Đã giải quyết - Snapshot: ${result.snapshotId.substring(0, 8)}...`
                  : "Đã giải quyết tranh chấp"
              );
              setResolutionModalOpen(false);
              setSelectedDispute(null);
              setResolutionData({
                resolution: "APPROVED",
                approvedAmount: 0,
                reason: "",
              });
            },
            onError: () => toast.error("Không thể giải quyết tranh chấp"),
          }
        );
      }
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(undefined);
  };

  const hasFilters = search || statusFilter;
  const openCount = disputes.filter((d) => d.status === "OPEN").length;
  const escalatedCount = disputes.filter((d) => d.status === "ESCALATED").length;
  const resolvedCount = disputes.filter(
    (d) => d.status === "APPROVED" || d.status === "PARTIAL" || d.status === "REJECTED"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-primary" />
            Quản lý Tranh Chấp
          </h1>
          <p className="text-muted-foreground mt-1">
            Xử lý và giải quyết các tranh chấp giữa khách thuê và chủ nhà (
            {disputes.length} tranh chấp)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor:
                    "color-mix(in oklab, var(--warning) 10%, transparent)",
                  color: "var(--warning)",
                }}
              >
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang mở</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor:
                    "color-mix(in oklab, var(--destructive) 10%, transparent)",
                  color: "var(--destructive)",
                }}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chuyển cấp</p>
                <p className="text-2xl font-bold">{escalatedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor:
                    "color-mix(in oklab, var(--success) 10%, transparent)",
                  color: "var(--success)",
                }}
              >
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã giải quyết</p>
                <p className="text-2xl font-bold">{resolvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo ID tranh chấp hoặc mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter || "ALL"} onValueChange={(v) => setStatusFilter(v === "ALL" ? undefined : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="OPEN">Đang mở</SelectItem>
                <SelectItem value="APPROVED">Chấp nhận</SelectItem>
                <SelectItem value="PARTIAL">Một phần</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
                <SelectItem value="ESCALATED">Chuyển cấp</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Tranh Chấp</CardTitle>
          <CardDescription>
            Xem và quản lý tất cả tranh chấp trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID / Loại</TableHead>
                  <TableHead>Yêu cầu</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Giải quyết</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : disputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không có tranh chấp nào
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((dispute) => (
                    <TableRow key={dispute.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm">
                            {dispute.id.substring(0, 8)}...
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {DISPUTE_CATEGORIES.find(
                              (c) => c.value === dispute.category
                            )?.label || dispute.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {/* 🛡️ SECURITY: Sanitize user input to prevent XSS */}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {sanitizeText(dispute.description)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">
                            {dispute.claimAmount.toLocaleString("vi-VN")} VND
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dispute.evidence && dispute.evidence.length > 0
                              ? `${dispute.evidence.length} bằng chứng`
                              : "Không có bằng chứng"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(dispute.createdAt), "dd/MM/yyyy", {
                          locale: vi,
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {dispute.resolvedAt ? (
                          format(new Date(dispute.resolvedAt), "dd/MM/yyyy", {
                            locale: vi,
                          })
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled className="gap-2">
                              <Eye className="h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            {dispute.status === "OPEN" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleResolve(dispute)}
                                  className="gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Giải quyết
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled
                                  className="gap-2"
                                >
                                  <ArrowUpRight className="h-4 w-4" />
                                  Chuyển cấp
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resolution Modal */}
      <Dialog open={resolutionModalOpen} onOpenChange={setResolutionModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Giải Quyết Tranh Chấp</DialogTitle>
            <DialogDescription>
              {selectedDispute && (
                <>
                  ID: {selectedDispute.id.substring(0, 16)}...
                  <br />
                  Yêu cầu: {selectedDispute.claimAmount.toLocaleString("vi-VN")}{" "}
                  VND
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kết luận</Label>
              <Select
                value={resolutionData.resolution}
                onValueChange={(value) =>
                  setResolutionData({ ...resolutionData, resolution: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kết luận" />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_OPTIONS.filter((opt) => opt.value.trim() !== "").map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {resolutionData.resolution !== "REJECTED" && (
              <div className="space-y-2">
                <Label>Số tiền chấp nhận (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  max={selectedDispute?.claimAmount}
                  value={resolutionData.approvedAmount}
                  onChange={(e) =>
                    setResolutionData({
                      ...resolutionData,
                      approvedAmount: Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Lý do giải quyết</Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do/giải thích chi tiết..."
                value={resolutionData.reason}
                onChange={(e) =>
                  setResolutionData({ ...resolutionData, reason: e.target.value })
                }
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolutionModalOpen(false)}
              disabled={resolveDispute.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitResolution}
              disabled={resolveDispute.isPending}
            >
              {resolveDispute.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Giải quyết"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LegalDialog />
    </div>
  );
}
