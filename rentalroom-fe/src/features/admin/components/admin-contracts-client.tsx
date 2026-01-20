"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Search, MoreHorizontal, Eye, X } from "lucide-react";
import { useState } from "react";
import { AdminContract } from "@/features/admin/schemas";

export default function AdminContractsClient({ contracts: initialContracts }: { contracts: AdminContract[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Hoạt động":
        return { label: "Hoạt động", bgVar: "color-mix(in oklab, var(--success) 10%, transparent)", textVar: "var(--success)" };
      case "Sắp hết hạn":
        return { label: "Sắp hết hạn", bgVar: "color-mix(in oklab, var(--warning) 10%, transparent)", textVar: "var(--warning)" };
      case "Hết hạn":
        return { label: "Hết hạn", bgVar: "color-mix(in oklab, var(--destructive) 10%, transparent)", textVar: "var(--destructive)" };
      default:
        return { label: status, bgVar: "color-mix(in oklab, var(--muted) 10%, transparent)", textVar: "var(--muted-foreground)" };
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(undefined);
  };

  const hasFilters = search || statusFilter;
  const total = initialContracts.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý hợp đồng</h1>
          <p className="text-muted-foreground mt-1">Xem và quản lý toàn bộ hợp đồng cho thuê ({total} hợp đồng)</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo người thuê, phòng..." onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Hoạt động">Hoạt động</SelectItem>
                <SelectItem value="Sắp hết hạn">Sắp hết hạn</SelectItem>
                <SelectItem value="Hết hạn">Hết hạn</SelectItem>
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
            <FileText className="h-5 w-5" />
            Danh sách hợp đồng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initialContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy hợp đồng nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người thuê</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Bắt đầu</TableHead>
                  <TableHead>Kết thúc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialContracts.map((contract) => {
                  const statusConfig = getStatusConfig(contract.status);
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.tenant}</TableCell>
                      <TableCell className="text-muted-foreground">{contract.property}</TableCell>
                      <TableCell>{contract.startDate}</TableCell>
                      <TableCell>{contract.endDate}</TableCell>
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
