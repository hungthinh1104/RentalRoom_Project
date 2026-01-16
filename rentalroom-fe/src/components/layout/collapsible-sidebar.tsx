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
    Pin,
    PinOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: { title: string; href: string }[];
}

interface CollapsibleSidebarProps {
    role?: string;
    className?: string;
}

export function CollapsibleSidebar({ role, className }: CollapsibleSidebarProps) {
    const [isPinned, setIsPinned] = useState<boolean>(() => (typeof window !== 'undefined' ? localStorage.getItem('sidebar-pinned') === 'true' : false));
    const [isExpanded, setIsExpanded] = useState<boolean>(() => (typeof window !== 'undefined' ? localStorage.getItem('sidebar-pinned') === 'true' : false));


    const handlePinToggle = () => {
        const newPinned = !isPinned;
        setIsPinned(newPinned);
        localStorage.setItem('sidebar-pinned', String(newPinned));
        setIsExpanded(newPinned);
    };

    const shouldExpand = isExpanded || isPinned;

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    'hidden lg:flex flex-col border-r bg-card h-[calc(100vh-var(--height-header))] sticky top-[var(--height-header)] transition-all duration-300 ease-in-out',
                    shouldExpand ? 'w-64' : 'w-16',
                    className
                )}
                onMouseEnter={() => !isPinned && setIsExpanded(true)}
                onMouseLeave={() => !isPinned && setIsExpanded(false)}
            >
                {/* Pin Button */}
                <div className="p-2 border-b flex justify-end">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePinToggle}
                                className={cn(
                                    'h-8 w-8',
                                    !shouldExpand && 'opacity-0 pointer-events-none'
                                )}
                            >
                                {isPinned ? (
                                    <PinOff className="h-4 w-4" />
                                ) : (
                                    <Pin className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Navigation Items */}
                <ScrollArea className="flex-1 py-4">
                    <SidebarContent role={role} isExpanded={shouldExpand} />
                </ScrollArea>

                {/* Logout Button */}
                <div className="p-2 border-t">
                    {shouldExpand ? (
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-destructive"
                            onClick={() => signOut({ callbackUrl: '/' })}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Đăng xuất
                        </Button>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-full text-muted-foreground hover:text-destructive"
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Đăng xuất</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </aside>
        </TooltipProvider>
    );
}

function SidebarContent({ role, isExpanded }: { role?: string; isExpanded: boolean }) {
    const pathname = usePathname();

    const getNavItems = (): NavItem[] => {
        switch (role) {
            case 'ADMIN':
                return [
                    { title: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
                    { title: 'Người dùng', href: '/dashboard/admin/users', icon: Users },
                    { title: 'Bất động sản', href: '/dashboard/admin/properties', icon: Building },
                    { title: 'Thống kê', href: '/dashboard/admin/analytics', icon: BarChart3 },
                    { title: 'Tài liệu pháp lý', href: '/dashboard/admin/legal-documents', icon: Scale },
                    { title: 'Nhật ký', href: '/dashboard/admin/audit-logs', icon: ShieldCheck },
                    { title: 'Báo cáo', href: '/dashboard/admin/reports', icon: FileText },
                ];
            case 'LANDLORD':
                return [
                    { title: 'Dashboard', href: '/dashboard/landlord', icon: LayoutDashboard },
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
                    { title: 'An toàn PCCC', href: '/pccc', icon: ShieldCheck },
                    { title: 'Bảo trì', href: '/dashboard/landlord/maintenance', icon: Wrench },
                    { title: 'Đánh giá', href: '/dashboard/landlord/reviews', icon: Star },
                ];
            case 'TENANT':
                return [
                    { title: 'Dashboard', href: '/dashboard/tenant', icon: LayoutDashboard },
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
                <SidebarItem key={index} item={item} pathname={pathname} isExpanded={isExpanded} />
            ))}
        </nav>
    );
}

function SidebarItem({
    item,
    pathname,
    isExpanded,
}: {
    item: NavItem;
    pathname: string | null;
    isExpanded: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const isActive = pathname === item.href;
    const isChildActive = item.children?.some((child) => pathname === child.href);

    // Auto-expand if child is active (deferred to avoid synchronous setState in effect)
    useEffect(() => {
        let id: number | undefined;
        if (isChildActive) {
            id = window.setTimeout(() => setIsOpen(true), 0);
        } else {
            id = window.setTimeout(() => setIsOpen(false), 0);
        }
        return () => {
            if (id) clearTimeout(id);
        };
    }, [isChildActive]);

    if (item.children) {
        // Item with children
        if (!isExpanded) {
            // Collapsed: Show only icon with tooltip
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                'flex items-center justify-center h-10 w-10 rounded-md transition-colors',
                                isActive || isChildActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <div className="space-y-1">
                            <p className="font-medium">{item.title}</p>
                            {item.children.map((child) => (
                                <p key={child.href} className="text-xs text-muted-foreground">
                                    {child.title}
                                </p>
                            ))}
                        </div>
                    </TooltipContent>
                </Tooltip>
            );
        }

        // Expanded: Show full menu with children
        return (
            <div className="space-y-1">
                <Button
                    variant={isActive || isChildActive ? 'secondary' : 'ghost'}
                    className={cn(
                        'w-full justify-between font-normal',
                        (isActive || isChildActive) && 'font-medium'
                    )}
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
                        {item.children.map((child) => (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                                    pathname === child.href
                                        ? 'bg-accent text-accent-foreground font-medium'
                                        : 'text-muted-foreground'
                                )}
                            >
                                {child.title}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Simple item without children
    if (!isExpanded) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={item.href}
                        className={cn(
                            'flex items-center justify-center h-10 w-10 rounded-md transition-colors',
                            isActive
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Link
            href={item.href}
            className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-accent/80 text-accent-foreground' : 'text-muted-foreground'
            )}
        >
            <item.icon className="h-4 w-4" />
            {item.title}
        </Link>
    );
}
