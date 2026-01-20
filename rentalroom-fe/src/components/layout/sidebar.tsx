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
    MessageSquare,
    Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

export interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: { title: string; href: string }[];
}

interface SidebarContentProps {
    role?: string;
    isCollapsed?: boolean;
}

export function SidebarContent({ role, isCollapsed = false }: SidebarContentProps) {
    const pathname = usePathname();

    const getNavItems = (): NavItem[] => {
        switch (role) {
            case 'ADMIN':
                return [
                    { title: 'Tổng quan', href: '/dashboard/admin', icon: LayoutDashboard },
                    { title: 'Người dùng', href: '/dashboard/admin/users', icon: Users },
                    { title: 'Bất động sản', href: '/dashboard/admin/properties', icon: Building },
                    { title: 'Thống kê', href: '/dashboard/admin/analytics', icon: BarChart3 },
                    { title: 'Pháp lý', href: '/dashboard/admin/legal-documents', icon: Scale },
                    { title: 'Nhật ký', href: '/dashboard/admin/audit-logs', icon: ShieldCheck },
                    { title: 'Báo cáo', href: '/dashboard/admin/reports', icon: FileText },
                    { title: 'Giám sát PCCC', href: '/dashboard/admin/pccc', icon: ShieldCheck },
                    { title: 'Hỗ trợ hệ thống', href: '/dashboard/admin/feedback', icon: MessageSquare },
                ];
            case 'LANDLORD':
                return [
                    { title: 'Tổng quan', href: '/dashboard/landlord', icon: LayoutDashboard },
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
                    { title: 'Thẩm định PCCC', href: '/dashboard/landlord/pccc', icon: ShieldCheck },
                    { title: 'Hỗ trợ', href: '/dashboard/landlord/feedback', icon: MessageSquare },
                ];
            case 'TENANT':
                return [
                    { title: 'Tổng quan', href: '/dashboard/tenant', icon: LayoutDashboard },
                    { title: 'Hợp đồng', href: '/dashboard/tenant/contracts', icon: FileText },
                    { title: 'Thanh toán', href: '/dashboard/tenant/payments', icon: CreditCard },
                    { title: 'Tài chính', href: '/dashboard/tenant/finance', icon: Wallet },
                    { title: 'Khiếu nại', href: '/dashboard/tenant/complaints', icon: MessageSquareWarning },
                    { title: 'Bảo trì', href: '/dashboard/tenant/maintenance', icon: Wrench },
                    { title: 'Đánh giá', href: '/dashboard/tenant/reviews', icon: Star },
                    { title: 'Yêu thích', href: '/dashboard/tenant/favorites', icon: Heart },
                    { title: 'Hỗ trợ', href: '/dashboard/tenant/feedback', icon: MessageSquare },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    return (
        <nav className={cn("grid gap-2 px-2", isCollapsed ? "justify-center" : "")}>
            {navItems.map((item, index) => (
                <SidebarItem key={index} item={item} pathname={pathname} isCollapsed={isCollapsed} />
            ))}

            {/* Divider for logout */}
            <div className="my-2 border-t border-border/40 mx-2" />

            {/* Logout Button */}
            {!isCollapsed ? (
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-xl px-4"
                    onClick={() => signOut({ callbackUrl: '/' })}
                >
                    <LogOut className="mr-3 h-4 w-4" />
                    Đăng xuất
                </Button>
            ) : (
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl mx-auto flex"
                                onClick={() => signOut({ callbackUrl: '/' })}
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Đăng xuất</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </nav>
    );
}

function SidebarItem({ item, pathname, isCollapsed }: { item: NavItem; pathname: string | null; isCollapsed: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const isActive = pathname === item.href;
    const isChildActive = item.children?.some(child => pathname === child.href);

    useEffect(() => {
        if (isChildActive) setIsOpen(true);
    }, [isChildActive]);

    if (isCollapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300",
                                isActive || isChildActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                        {item.title}
                        {item.children && (
                            <div className="mt-1 pt-1 border-t border-border/50 text-xs text-muted-foreground">
                                {item.children.length} mục con
                            </div>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (item.children) {
        return (
            <div className="space-y-1">
                <Button
                    variant={isActive || isChildActive ? "secondary" : "ghost"}
                    className={cn(
                        "w-full justify-between font-normal rounded-xl h-11 px-4 hover:bg-accent/50",
                        (isActive || isChildActive) && "text-primary bg-primary/5"
                    )}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="flex items-center overflow-hidden whitespace-nowrap">
                        <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0", (isActive || isChildActive) ? "text-primary" : "text-muted-foreground")} />
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {item.title}
                        </motion.span>
                    </span>
                    {isOpen ? <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 opacity-50 flex-shrink-0" />}
                </Button>

                <AnimatePresence>
                    {(isOpen || isChildActive) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-col gap-1 pl-4 mt-1 border-l-2 border-border/30 ml-6">
                                {item.children.map(child => (
                                    <Link
                                        key={child.href}
                                        href={child.href}
                                        className={cn(
                                            "flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200",
                                            pathname === child.href
                                                ? "bg-primary/10 text-primary font-bold"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <span className={cn("w-1.5 h-1.5 rounded-full mr-2", pathname === child.href ? "bg-primary" : "bg-muted-foreground/30")}></span>
                                        {child.title}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-200 relative overflow-hidden group z-0",
                isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            {/* Active Background - layoutId needs to be unique per list if multiple sidebars exist, but global here is fine for effect */}
            {isActive && (
                <motion.div
                    layoutId="sidebar-item-bg"
                    className="absolute inset-0 bg-primary shadow-lg shadow-primary/25 z-[-1] rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            )}

            {/* Hover Background - Subtle interaction */}
            {!isActive && (
                <div className="absolute inset-0 bg-accent/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl z-[-1]" />
            )}

            <item.icon className={cn("h-5 w-5 transition-colors z-10", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="z-10 relative">{item.title}</span>
        </Link>
    );
}

// Ensure the old Sidebar component is still verified exports correct stuff if referenced elsewhere
// But we primarily use SidebarContent now.
export function Sidebar({ role, className }: { role?: string, className?: string }) {
    return (
        <aside className={cn("w-64", className)}>
            <SidebarContent role={role} />
        </aside>
    )
}
