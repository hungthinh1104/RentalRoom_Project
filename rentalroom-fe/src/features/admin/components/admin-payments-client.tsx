"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CreditCard, Search, MoreHorizontal, Eye, X, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { AdminPayment } from "@/features/admin/schemas";

export default function AdminPaymentsClient({ payments: initialPayments }: { payments: AdminPayment[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Đã thanh toán":
        return { label: "Đã thanh toán", bgVar: "color-mix(in oklab, var(--success) 10%, transparent)", textVar: "var(--success)" };
      case "Chưa thanh toán":
        return { label: "Chưa thanh toán", bgVar: "color-mix(in oklab, var(--warning) 10%, transparent)", textVar: "var(--warning)" };
      case "Quá hạn":
        return { label: "Quá hạn", bgVar: "color-mix(in oklab, var(--destructive) 10%, transparent)", textVar: "var(--destructive)" };
      default:
        return { label: status, bgVar: "color-mix(in oklab, var(--muted) 10%, transparent)", textVar: "var(--muted-foreground)" };
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) return `₫ ${(price / 1_000_000).toFixed(1)}M`;
    return `₫ ${price.toLocaleString()}`;
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(undefined);
  };

  const hasFilters = search || statusFilter;
  const total = initialPayments.length;
  const paidCount = initialPayments.filter(p => p.status === "Đã thanh toán").length;
  const overdueCount = initialPayments.filter(p => p.status === "Quá hạn").length;
  const totalAmount = initialPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý thanh toán</h1>
          <p className="text-muted-foreground mt-1">Theo dõi và quản lý các khoản thanh toán ({total} hóa đơn)</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: "color-mix(in oklab, var(--success) 10%, transparent)", color: "var(--success)" }}>
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
              <div className="p-3 rounded-lg" style={{ backgroundColor: "color-mix(in oklab, var(--destructive) 10%, transparent)", color: "var(--destructive)" }}>
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
              <div className="p-3 rounded-lg" style={{ backgroundColor: "color-mix(in oklab, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng số tiền</p>
                <p className="text-2xl font-bold">{formatPrice(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo người thuê..." onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Đã thanh toán">Đã thanh toán</SelectItem>
                <SelectItem value="Chưa thanh toán">Chưa thanh toán</SelectItem>
                <SelectItem value="Quá hạn">Quá hạn</SelectItem>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Danh sách thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initialPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy thanh toán nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người thuê</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Hạn thanh toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialPayments.map((payment) => {
                  const statusConfig = getStatusConfig(payment.status);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.tenant}</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(payment.amount)}</TableCell>
                      <TableCell>{payment.dueDate}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: statusConfig.bgVar, color: statusConfig.textVar, borderColor: `color-mix(in oklab, ${statusConfig.textVar} 30%, transparent)` }} variant="outline">
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
