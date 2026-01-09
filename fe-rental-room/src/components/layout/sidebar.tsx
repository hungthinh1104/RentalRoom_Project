'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building,
    FileText,
    CreditCard,
    Wrench,
    Users,
    BarChart3,
    Heart,
    Star,
    Coins,
    ChevronDown,
    ChevronRight,
    LogOut,
    Settings,
    Scale,
    ShieldCheck,
    Wallet,
    MessageSquareWarning,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
// Collapsible imports removed as we use custom state
import { useState } from 'react';
import { signOut } from 'next-auth/react';

// Since Collapsible might not be in UI, I'll implement a simple one or use Accordion if needed.
// Checking file list: accordion.tsx IS present. I can use Accordion or build simple state.
// Simple state is often cleaner for sidebar submenus.

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: { title: string; href: string }[];
}

interface SidebarProps {
    role?: string;
    className?: string;
}

export function Sidebar({ role, className }: SidebarProps) {
    return (
        <aside className={cn("hidden lg:flex flex-col w-64 border-r bg-card h-[calc(100vh-var(--height-header))] sticky top-[var(--height-header)]", className)}>
            <ScrollArea className="flex-1 py-4">
                <SidebarContent role={role} />
            </ScrollArea>
            <div className="p-4 border-t">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                    onClick={() => signOut({ callbackUrl: '/' })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                </Button>
            </div>
        </aside>
    );
}

export function SidebarContent({ role }: { role?: string }) {
    const pathname = usePathname();

    const getNavItems = (): NavItem[] => {
        switch (role) {
            case 'ADMIN':
                return [
                    { title: 'Bảng điều khiển', href: '/dashboard/admin', icon: LayoutDashboard },
                    { title: 'Người dùng', href: '/dashboard/admin/users', icon: Users },
                    { title: 'Bất động sản', href: '/dashboard/admin/properties', icon: Building },
                    { title: 'Thống kê', href: '/dashboard/admin/analytics', icon: BarChart3 },
                    { title: 'Tài liệu pháp lý', href: '/dashboard/admin/legal-documents', icon: Scale },
                    { title: 'Nhật ký hệ thống', href: '/dashboard/admin/audit-logs', icon: ShieldCheck }, // Added
                    { title: 'Báo cáo', href: '/dashboard/admin/reports', icon: FileText },
                ];
            case 'LANDLORD':
                return [
                    { title: 'Bảng điều khiển', href: '/dashboard/landlord', icon: LayoutDashboard },
                    {
                        title: 'Bất động sản',
                        href: '/dashboard/landlord/properties',
                        icon: Building,
                        children: [
                            { title: 'Danh sách', href: '/dashboard/landlord/properties' },
                            { title: 'Thêm mới', href: '/dashboard/landlord/properties/new' },
                        ],
                    },
                    { title: 'Khách thuê', href: '/dashboard/landlord/tenants', icon: Users },
                    { title: 'Hợp đồng', href: '/dashboard/landlord/contracts', icon: FileText },
                    { title: 'Thanh toán', href: '/dashboard/landlord/payments', icon: CreditCard },
                    { title: 'Thu Chi', href: '/dashboard/landlord/finance', icon: Coins },
                    { title: 'Bảo trì', href: '/dashboard/landlord/maintenance', icon: Wrench },
                    { title: 'Đánh giá', href: '/dashboard/landlord/reviews', icon: Star },
                ];
            case 'TENANT':
                return [
                    { title: 'Bảng điều khiển', href: '/dashboard/tenant', icon: LayoutDashboard },
                    { title: 'Hợp đồng', href: '/dashboard/tenant/contracts', icon: FileText },
                    { title: 'Thanh toán', href: '/dashboard/tenant/payments', icon: CreditCard },
                    { title: 'Tài chính', href: '/dashboard/tenant/finance', icon: Wallet },
                    { title: 'Khiếu nại', href: '/dashboard/tenant/complaints', icon: MessageSquareWarning },
                    { title: 'Bảo trì', href: '/dashboard/tenant/maintenance', icon: Wrench },
                    { title: 'Yêu thích', href: '/dashboard/tenant/favorites', icon: Heart },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    return (
        <nav className="grid gap-1 px-2">
            {navItems.map((item, index) => (
                <SidebarItem key={index} item={item} pathname={pathname} />
            ))}
        </nav>
    );
}

function SidebarItem({ item, pathname }: { item: NavItem; pathname: string | null }) {
    const [isOpen, setIsOpen] = useState(false);
    // Auto-expand if child is active
    const isActive = pathname === item.href;
    const isChildActive = item.children?.some(child => pathname === child.href);

    // Initialize open state if child is active (simple effect or init state)
    // For simplicity, just letting user toggle, but could default to open.

    if (item.children) {
        return (
            <div className="space-y-1">
                <Button
                    variant={isActive || isChildActive ? "secondary" : "ghost"}
                    className={cn("w-full justify-between font-normal", (isActive || isChildActive) && "font-medium")}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                    </span>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                {(isOpen || isChildActive) && (
                    <div className="pl-4 space-y-1">
                        {item.children.map(child => (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                                    pathname === child.href ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                                )}
                            >
                                {child.title}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent/80 text-accent-foreground" : "text-muted-foreground"
            )}
        >
            <item.icon className="h-4 w-4" />
            {item.title}
        </Link>
    );
}
