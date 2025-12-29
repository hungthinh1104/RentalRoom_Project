"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserFiltersProps {
    onSearchChange: (search: string) => void;
    onRoleChange: (role: string | undefined) => void;
    onStatusChange: (status: string | undefined) => void;
    initialSearch?: string;
    initialRole?: string;
    initialStatus?: string;
}

export function UserFilters({
    onSearchChange,
    onRoleChange,
    onStatusChange,
    initialSearch = "",
    initialRole,
    initialStatus,
}: UserFiltersProps) {
    const [search, setSearch] = useState(initialSearch);
    const [role, setRole] = useState<string | undefined>(initialRole);
    const [status, setStatus] = useState<string | undefined>(initialStatus);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    // Debounced search
    const handleSearchChange = useCallback(
        (value: string) => {
            setSearch(value);
            if (debounceTimer) clearTimeout(debounceTimer);
            const timer = setTimeout(() => {
                onSearchChange(value);
            }, 300);
            setDebounceTimer(timer);
        },
        [onSearchChange, debounceTimer]
    );

    const handleRoleChange = (value: string) => {
        const newRole = value === "all" ? undefined : value;
        setRole(newRole);
        onRoleChange(newRole);
    };

    const handleStatusChange = (value: string) => {
        const newStatus = value === "all" ? undefined : value;
        setStatus(newStatus);
        onStatusChange(newStatus);
    };

    const clearFilters = () => {
        setSearch("");
        setRole(undefined);
        setStatus(undefined);
        onSearchChange("");
        onRoleChange(undefined);
        onStatusChange(undefined);
    };

    const hasFilters = search || role || status;

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm theo tên, email..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Role Filter */}
            <Select value={role || "all"} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    <SelectItem value="TENANT">Người thuê</SelectItem>
                    <SelectItem value="LANDLORD">Chủ nhà</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={status || "all"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Vô hiệu</SelectItem>
                </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                    Xóa bộ lọc
                </Button>
            )}
        </div>
    );
}
