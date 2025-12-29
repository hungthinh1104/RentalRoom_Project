"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Search, MoreHorizontal, Eye, XCircle, X, Calendar } from "lucide-react";
import { useAdminContracts, useTerminateContract } from "@/features/admin/hooks/use-admin-contracts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Hoạt động",
    className: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  },
  EXPIRED: {
    label: "Hết hạn",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  },
  TERMINATED: {
    label: "Đã chấm dứt",
    className: "border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive/30",
  },
  DRAFT: {
    label: "Bản nháp",
    className: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
  PENDING_SIGNATURE: {
    label: "Chờ ký",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  },
  DEPOSIT_PENDING: {
    label: "Chờ đặt cọc",
    className: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
  },
};

export default function AdminContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [terminateId, setTerminateId] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const { data, isLoading } = useAdminContracts({ page, search, status: statusFilter });
  const terminateContract = useTerminateContract();

  const contracts = data?.items || [];
  const total = data?.total || 0;

  const handleSearchChange = (value: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
    setDebounceTimer(timer);
  };

  const handleTerminate = async () => {
    if (!terminateId) return;
    try {
      await terminateContract.mutateAsync({ contractId: terminateId });
      toast.success("Đã chấm dứt hợp đồng");
      setTerminateId(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể chấm dứt hợp đồng");
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_MAP[status] || STATUS_MAP.ACTIVE;
    return <Badge className={cn(config.className)}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: vi });
    } catch {
      return date;
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) {
      return `₫ ${(price / 1_000_000).toFixed(1)}M`;
    }
    return `₫ ${price.toLocaleString()}`;
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(undefined);
  };

  const hasFilters = search || statusFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý hợp đồng</h1>
          <p className="text-muted-foreground mt-1">
            Xem và quản lý toàn bộ hợp đồng cho thuê ({total} hợp đồng)
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã HD, tên người thuê..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                <SelectItem value="PENDING_SIGNATURE">Chờ ký</SelectItem>
                <SelectItem value="DEPOSIT_PENDING">Chờ đặt cọc</SelectItem>
                <SelectItem value="EXPIRED">Hết hạn</SelectItem>
                <SelectItem value="TERMINATED">Đã chấm dứt</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Danh sách hợp đồng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy hợp đồng nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã HĐ</TableHead>
                  <TableHead>Người thuê</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Thời hạn</TableHead>
                  <TableHead className="text-right">Tiền thuê</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-mono text-sm">{contract.contractNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.tenantName}</div>
                        <div className="text-sm text-muted-foreground">{contract.tenantEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{contract.roomNumber}</div>
                        <div className="text-sm text-muted-foreground">{contract.propertyName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(contract.rentAmount)}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {contract.status === "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={() => setTerminateId(contract.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Chấm dứt
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Terminate Confirmation */}
      <AlertDialog open={!!terminateId} onOpenChange={() => setTerminateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận chấm dứt?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn chấm dứt hợp đồng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Chấm dứt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
