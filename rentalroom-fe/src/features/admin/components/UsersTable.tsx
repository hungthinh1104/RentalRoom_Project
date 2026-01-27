"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminUsersClient, banUser, unbanUser } from "@/features/admin/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Search, ShieldAlert, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useDebounce } from "@/hooks/use-debounce";
import { useLegalConfirmation } from "@/components/security/legal-finality-dialog";
import { useToast } from "@/hooks/use-toast";

interface User {
    id: string;
    fullName: string;
    email: string;
    role: "TENANT" | "LANDLORD" | "ADMIN";
    isActive?: boolean; // Or isBanned
    isBanned?: boolean;
    createdAt: string;
}

export function UsersTable() {
    const [searchTerm, setSearchTerm] = useState("");
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { confirm, Dialog } = useLegalConfirmation();
    const [banReason, setBanReason] = useState("");

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin", "users", searchTerm],
        queryFn: () => fetchAdminUsersClient(1, searchTerm),
        staleTime: 5000
    });

    const banMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => banUser(id, reason),
        onSuccess: (result: { snapshotId?: string }) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast({
                title: "✅ Đã chặn người dùng",
                description: result?.snapshotId
                    ? `Snapshot: ${result.snapshotId.substring(0, 8)}...`
                    : "Hành động đã được ghi nhận"
            });
        }
    });

    const unbanMutation = useMutation({
        mutationFn: (id: string) => unbanUser(id),
        onSuccess: (result: { snapshotId?: string }) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            toast({
                title: "✅ Đã mở khóa người dùng",
                description: result?.snapshotId
                    ? `Snapshot: ${result.snapshotId.substring(0, 8)}...`
                    : "Hành động đã được ghi nhận"
            });
        }
    });

    const handleBan = (user: User) => {
        confirm(
            {
                title: "Chặn tài khoản người dùng",
                description: `Bạn đang chặn tài khoản: ${user.fullName} (${user.email}). Hành động này sẽ được ghi vào audit log và có thể được hoàn tác sau.`,
                severity: "critical",
                consentText: "Tôi xác nhận chặn tài khoản này",
            },
            async (reason?: string) => {
                await banMutation.mutateAsync({ id: user.id, reason: reason || "Admin action" });
            }
        );
    };

    const handleUnban = (user: User) => {
        confirm(
            {
                title: "Mở khóa tài khoản người dùng",
                description: `Bạn đang mở khóa tài khoản: ${user.fullName} (${user.email}). Người dùng sẽ có thể đăng nhập lại.`,
                severity: "warning",
                consentText: "Tôi xác nhận mở khóa tài khoản này",
            },
            async () => {
                await unbanMutation.mutateAsync(user.id);
            }
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm người dùng..."
                        className="pl-8 bg-card/50 border-white/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border border-white/10 bg-card/30 backdrop-blur-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead>Tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày tham gia</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-white/10">
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : users?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Không tìm thấy người dùng
                                </TableCell>
                            </TableRow>
                        ) : (
                            users?.map((user: User) => (
                                <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium">{user.fullName}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'LANDLORD' ? 'secondary' : 'outline'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.isBanned ? (
                                            <Badge variant="destructive" className="gap-1">
                                                <ShieldAlert className="h-3 w-3" /> Banned
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-success border-success/30 gap-1">
                                                <CheckCircle className="h-3 w-3" /> Active
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-md border-white/10">
                                                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                    Copy ID
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-info">Xem chi tiết</DropdownMenuItem>
                                                {user.isBanned ? (
                                                    <DropdownMenuItem onClick={() => handleUnban(user)} className="text-success font-medium">
                                                        Mở khóa tài khoản
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleBan(user)} className="text-destructive font-medium">
                                                        Chặn tài khoản
                                                    </DropdownMenuItem>
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
            <Dialog />
        </div>
    );
}
