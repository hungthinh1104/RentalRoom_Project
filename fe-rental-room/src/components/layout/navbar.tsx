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
    LogOut,
    Settings,
    Scale,
    ShieldCheck,
    Wallet,
    MessageSquareWarning,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { signOut } from 'next-auth/react';
import React from 'react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

interface NavBarProps {
    role?: string;
    className?: string;
}

export function NavBar({ role, className }: NavBarProps) {
    const pathname = usePathname();

    const getNavConfig = (): { simple: NavItem[]; grouped: NavGroup[] } => {
        switch (role) {
            case 'ADMIN':
                return {
                    simple: [
                        { title: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
                    ],
                    grouped: [
                        {
                            title: 'Quản lý',
                            items: [
                                { title: 'Người dùng', href: '/dashboard/admin/users', icon: Users, description: 'Quản lý tài khoản' },
                                { title: 'Bất động sản', href: '/dashboard/admin/properties', icon: Building, description: 'Tất cả properties' },
                                { title: 'Báo cáo', href: '/dashboard/admin/reports', icon: FileText, description: 'Báo cáo hệ thống' },
                            ],
                        },
                        {
                            title: 'Hệ thống',
                            items: [
                                { title: 'Tài liệu pháp lý', href: '/dashboard/admin/legal-documents', icon: Scale, description: 'Quy định, chính sách' },
                                { title: 'Nhật ký', href: '/dashboard/admin/audit-logs', icon: ShieldCheck, description: 'Audit trail' },
                                { title: 'Thống kê', href: '/dashboard/admin/analytics', icon: BarChart3, description: 'Analytics' },
                            ],
                        },
                    ],
                };

            case 'LANDLORD':
                return {
                    simple: [
                        { title: 'Dashboard', href: '/dashboard/landlord', icon: LayoutDashboard },
                    ],
                    grouped: [
                        {
                            title: 'Quản lý',
                            items: [
                                { title: 'Bất động sản', href: '/dashboard/landlord/properties', icon: Building, description: 'Danh sách & Thêm mới' },
                                { title: 'Khách thuê', href: '/dashboard/landlord/tenants', icon: Users, description: 'Quản lý người thuê' },
                                { title: 'Hợp đồng', href: '/dashboard/landlord/contracts', icon: FileText, description: 'Contracts & Leases' },
                            ],
                        },
                        {
                            title: 'Tài chính',
                            items: [
                                { title: 'Giao dịch', href: '/dashboard/landlord/payments', icon: CreditCard, description: 'Payment history' },
                                { title: 'Báo cáo TC', href: '/dashboard/landlord/finance', icon: Coins, description: 'Financial reports' },
                            ],
                        },
                        {
                            title: 'Vận hành',
                            items: [
                                { title: 'Bảo trì', href: '/dashboard/landlord/maintenance', icon: Wrench, description: 'Maintenance requests' },
                                { title: 'Đánh giá', href: '/dashboard/landlord/reviews', icon: Star, description: 'Reviews & Ratings' },
                            ],
                        },
                    ],
                };

            case 'TENANT':
                return {
                    simple: [
                        { title: 'Dashboard', href: '/dashboard/tenant', icon: LayoutDashboard },
                        { title: 'Hợp đồng', href: '/dashboard/tenant/contracts', icon: FileText },
                        { title: 'Thanh toán', href: '/dashboard/tenant/payments', icon: CreditCard },
                    ],
                    grouped: [
                        {
                            title: 'More',
                            items: [
                                { title: 'Tài chính', href: '/dashboard/tenant/finance', icon: Wallet, description: 'Financial overview' },
                                { title: 'Khiếu nại', href: '/dashboard/tenant/complaints', icon: MessageSquareWarning, description: 'Submit complaints' },
                                { title: 'Bảo trì', href: '/dashboard/tenant/maintenance', icon: Wrench, description: 'Request maintenance' },
                                { title: 'Yêu thích', href: '/dashboard/tenant/favorites', icon: Heart, description: 'Saved properties' },
                            ],
                        },
                    ],
                };

            default:
                return { simple: [], grouped: [] };
        }
    };

    const { simple, grouped } = getNavConfig();

    return (
        <nav
            className={cn(
                'hidden lg:flex items-center gap-6 px-6 h-14 border-b bg-card',
                className
            )}
        >
            <NavigationMenu>
                <NavigationMenuList>
                    {/* Simple Links */}
                    {simple.map((item) => (
                        <NavigationMenuItem key={item.href}>
                            <Link href={item.href} legacyBehavior passHref>
                                <NavigationMenuLink
                                    className={cn(
                                        navigationMenuTriggerStyle(),
                                        pathname === item.href && 'bg-accent text-accent-foreground'
                                    )}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                    ))}

                    {/* Grouped Dropdowns */}
                    {grouped.map((group) => (
                        <NavigationMenuItem key={group.title}>
                            <NavigationMenuTrigger
                                className={cn(
                                    group.items.some((item) => pathname.startsWith(item.href)) &&
                                    'bg-accent/50'
                                )}
                            >
                                {group.title}
                                <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-[400px] gap-1 p-3 md:w-[500px] md:grid-cols-2">
                                    {group.items.map((item) => (
                                        <ListItem
                                            key={item.href}
                                            title={item.title}
                                            href={item.href}
                                            icon={item.icon}
                                            isActive={pathname === item.href}
                                        >
                                            {item.description}
                                        </ListItem>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>

            {/* Right Side - Settings & Logout */}
            <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/settings">
                        <Settings className="h-4 w-4" />
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-muted-foreground hover:text-destructive"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                </Button>
            </div>
        </nav>
    );
}

// ListItem Component for dropdown items
const ListItem = React.forwardRef<
    React.ElementRef<'a'>,
    React.ComponentPropsWithoutRef<'a'> & {
        title: string;
        icon: React.ComponentType<{ className?: string }>;
        isActive?: boolean;
    }
>(({ className, title, icon: Icon, children, href, isActive, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    ref={ref}
                    href={href!}
                    className={cn(
                        'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                        isActive && 'bg-accent/70 text-accent-foreground font-medium',
                        className
                    )}
                    {...props}
                >
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div className="text-sm font-medium leading-none">{title}</div>
                    </div>
                    <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    );
});
ListItem.displayName = 'ListItem';
