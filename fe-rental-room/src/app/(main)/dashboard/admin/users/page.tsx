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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users } from "lucide-react";
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import { UserFilters } from "@/features/admin/components/user-filters";
import { AddUserModal } from "@/features/admin/components/add-user-modal";
import { EditUserModal } from "@/features/admin/components/edit-user-modal";
import { UserActions } from "@/features/admin/components/user-actions";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading, error } = useAdminUsers({
    page,
    search,
    role: roleFilter,
    status: statusFilter,
  });

  const users = data?.items || [];
  const total = data?.total || 0;

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge className={cn(
            "border-purple-200 bg-purple-50 text-purple-700",
            "dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400"
          )}>
            Admin
          </Badge>
        );
      case "LANDLORD":
        return (
          <Badge className={cn(
            "border-blue-200 bg-blue-50 text-blue-700",
            "dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
          )}>
            Chủ nhà
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Người thuê
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Hoạt động") {
      return (
        <Badge className={cn(
          "border-green-200 bg-green-50 text-green-700",
          "dark:border-green-800 dark:bg-green-950 dark:text-green-400"
        )}>
          Hoạt động
        </Badge>
      );
    }
    return (
      <Badge className={cn(
        "border-destructive/20 bg-destructive/10 text-destructive",
        "dark:border-destructive/30 dark:bg-destructive/20"
      )}>
        Vô hiệu
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tài khoản và phân quyền người dùng ({total} người dùng)
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <UserFilters
            onSearchChange={setSearch}
            onRoleChange={setRoleFilter}
            onStatusChange={setStatusFilter}
            initialSearch={search}
            initialRole={roleFilter}
            initialStatus={statusFilter}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách người dùng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-destructive py-8 text-center">
              Có lỗi xảy ra khi tải dữ liệu
            </p>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddModalOpen(true)}
              >
                Thêm người dùng đầu tiên
              </Button>
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
                {users.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <UserActions
                        userId={user.id}
                        userName={user.name}
                        isActive={user.status === "Hoạt động"}
                        onEdit={() => handleEdit(user)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddUserModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      <EditUserModal user={selectedUser} open={editModalOpen} onOpenChange={setEditModalOpen} />
    </div>
  );
}
