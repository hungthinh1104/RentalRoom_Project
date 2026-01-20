"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, Search, MoreHorizontal, Eye, X } from "lucide-react";
import { useState } from "react";
import { AdminUser } from "@/features/admin/schemas";

export default function AdminUsersClient({ users: initialUsers }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "ADMIN":
        return { label: "Admin", bgVar: "color-mix(in oklab, var(--destructive) 10%, transparent)", textVar: "var(--destructive)" };
      case "LANDLORD":
        return { label: "Chủ nhà", bgVar: "color-mix(in oklab, var(--info) 10%, transparent)", textVar: "var(--info)" };
      case "TENANT":
        return { label: "Người thuê", bgVar: "color-mix(in oklab, var(--success) 10%, transparent)", textVar: "var(--success)" };
      default:
        return { label: role, bgVar: "color-mix(in oklab, var(--muted) 10%, transparent)", textVar: "var(--muted-foreground)" };
    }
  };

  const getStatusConfig = (status: string) => {
    return status === "Hoạt động"
      ? { label: "Hoạt động", bgVar: "color-mix(in oklab, var(--success) 10%, transparent)", textVar: "var(--success)" }
      : { label: "Vô hiệu", bgVar: "color-mix(in oklab, var(--muted) 10%, transparent)", textVar: "var(--muted-foreground)" };
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter(undefined);
  };

  const hasFilters = search || roleFilter;
  const total = initialUsers.length;

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Theo dõi, quản lý và kiểm soát quyền truy cập của người dùng hệ thống ({total} người dùng).
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo tên, email..." onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="LANDLORD">Chủ nhà</SelectItem>
                <SelectItem value="TENANT">Người thuê</SelectItem>
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
            <Users className="h-5 w-5" />
            Danh sách người dùng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initialUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialUsers.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  const statusConfig = getStatusConfig(user.status);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: roleConfig.bgVar, color: roleConfig.textVar, borderColor: `color-mix(in oklab, ${roleConfig.textVar} 30%, transparent)` }} variant="outline">
                          {roleConfig.label}
                        </Badge>
                      </TableCell>
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
