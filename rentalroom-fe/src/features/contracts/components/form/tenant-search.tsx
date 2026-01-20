"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { Tenant } from "@/types";
import api from "@/lib/api/client";

interface TenantSearchProps {
    onSelect: (tenant: Tenant) => void;
    error?: string;
    disabled?: boolean;
}

export function TenantSearch({ onSelect, error, disabled }: TenantSearchProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    // Fetch tenants based on search term
    const { data: tenants = [], isLoading } = useQuery({
        queryKey: ["tenants", debouncedSearch],
        queryFn: async () => {
            // Only search if we have a term or on initial load with empty term (optional)
            if (!debouncedSearch && !open) return [];

            const { data } = await api.get<{ data: Tenant[] }>("/tenants", {
                params: {
                    search: debouncedSearch || undefined,
                    limit: 10
                }
            });
            // data is PaginatedResponse { data: Tenant[], meta: ... }
            return data.data;
        },
        enabled: open,
    });

    const handleSelect = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        onSelect(tenant);
        setOpen(false);
        setSearchTerm("");
    };

    return (
        <div className="space-y-1">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between",
                            !selectedTenant && "text-muted-foreground",
                            error && "border-destructive ring-destructive"
                        )}
                        disabled={disabled}
                    >
                        {selectedTenant ? (
                            <div className="flex flex-col items-start transition-all overflow-hidden">
                                <span className="font-semibold truncate w-full text-left">{selectedTenant.user?.fullName}</span>
                                <span className="text-xs font-normal opacity-70 truncate w-full text-left">
                                    {selectedTenant.user?.phoneNumber || selectedTenant.user?.email}
                                </span>
                            </div>
                        ) : (
                            "Tìm kiếm người thuê (SĐT, Email)..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                            placeholder="Nhập tên, số điện thoại hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none shadow-none focus-visible:ring-0"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4 py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : tenants.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground py-6">
                                {searchTerm ? "Không tìm thấy người thuê nào." : "Nhập từ khóa để tìm kiếm."}
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {tenants.map((tenant: Tenant, index: number) => (
                                    <li
                                        key={`${tenant.id}-${index}`}
                                        onClick={() => handleSelect(tenant)}
                                        className={cn(
                                            "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                                            selectedTenant?.id === tenant.id && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium truncate">{tenant.user?.fullName}</p>
                                                {selectedTenant?.id === tenant.id && (
                                                    <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {tenant.user?.phoneNumber} • {tenant.user?.email}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        </div>
    );
}
