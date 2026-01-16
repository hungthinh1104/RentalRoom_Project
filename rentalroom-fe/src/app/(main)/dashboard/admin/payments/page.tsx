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
import { CreditCard, Search, MoreHorizontal, Eye, CheckCircle, X, AlertCircle } from "lucide-react";
import { useAdminPayments, useMarkPaymentPaid, type Payment } from "@/features/admin/hooks/use-admin-contracts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PAID: {
    label: "Đã thanh toán",
    className: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  },
  PENDING: {
    label: "Chưa thanh toán",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  },
  OVERDUE: {
    label: "Quá hạn",
    className: "border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive/30",
  },
};

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const { data, isLoading } = useAdminPayments({ page, search, status: statusFilter });
  const markPaid = useMarkPaymentPaid();

  const payments = data?.items || [];
  const total = data?.total || 0;

  const handleSearchChange = (value: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
    setDebounceTimer(timer);
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid.mutateAsync(id);
      toast.success("Đã ghi nhận thanh toán");
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error ? 
        (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(message || "Không thể cập nhật trạng thái");
    }
  };

  const getStatus = (payment: { status: string; dueDate: string; paidAt?: string }) => {
    if (payment.status === "PAID" || payment.paidAt) return "PAID";
    if (isPast(new Date(payment.dueDate))) return "OVERDUE";
    return "PENDING";
  };

  const getStatusBadge = (payment: { status: string; dueDate: string; paidAt?: string }) => {
    const status = getStatus(payment);
    const config = STATUS_MAP[status] || STATUS_MAP.PENDING;
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

  // Calculate stats
  const paidCount = payments.filter((p: Payment) => getStatus(p) === "PAID").length;
  const overdueCount = payments.filter((p: Payment) => getStatus(p) === "OVERDUE").length;
  const totalAmount = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý thanh toán</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi và quản lý các khoản thanh toán ({total} hóa đơn)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-lg", "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400")}>
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã thanh toán</p>
                <p className="text-2xl font-bold">{paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-lg", "bg-destructive/10 text-destructive")}>
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quá hạn</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-lg", "bg-primary/10 text-primary")}>
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng giá trị</p>
                <p className="text-2xl font-bold">{formatPrice(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã hóa đơn, tên người thuê..."
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
                <SelectItem value="PAID">Đã thanh toán</SelectItem>
                <SelectItem value="PENDING">Chưa thanh toán</SelectItem>
                <SelectItem value="OVERDUE">Quá hạn</SelectItem>
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

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Danh sách thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy thanh toán nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã HĐ</TableHead>
                  <TableHead>Người thuê</TableHead>
                  <TableHead>Bất động sản</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Hạn thanh toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: Payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">{payment.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{payment.tenantName}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.propertyName}</TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(payment.amount)}</TableCell>
                    <TableCell>{formatDate(payment.dueDate)}</TableCell>
                    <TableCell>{getStatusBadge(payment)}</TableCell>
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
                          {getStatus(payment) !== "PAID" && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(payment.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Đánh dấu đã thanh toán
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
    </div>
  );
}
