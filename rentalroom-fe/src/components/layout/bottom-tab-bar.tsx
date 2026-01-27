'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    Bell,
    MoreHorizontal,
    Building,
    Users,
} from 'lucide-react';

interface TabItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface BottomTabBarProps {
    role?: string;
    className?: string;
}

export function BottomTabBar({ role, className }: BottomTabBarProps) {
    const pathname = usePathname();

    const getTabItems = (): TabItem[] => {
        const baseHref = role ? `/dashboard/${role.toLowerCase()}` : '/dashboard';

        switch (role) {
            case 'ADMIN':
                return [
                    { title: 'Dashboard', href: `${baseHref}`, icon: LayoutDashboard },
                    { title: 'Users', href: `${baseHref}/users`, icon: Users },
                    { title: 'Properties', href: `${baseHref}/properties`, icon: Building },
                    { title: 'Reports', href: `${baseHref}/reports`, icon: FileText },
                    { title: 'More', href: `${baseHref}/settings`, icon: MoreHorizontal },
                ];

            case 'LANDLORD':
                return [
                    { title: 'Dashboard', href: `${baseHref}`, icon: LayoutDashboard },
                    { title: 'Properties', href: `${baseHref}/properties`, icon: Building },
                    { title: 'Contracts', href: `${baseHref}/contracts`, icon: FileText },
                    { title: 'Finance', href: `${baseHref}/finance`, icon: CreditCard },
                    { title: 'More', href: `${baseHref}/maintenance`, icon: MoreHorizontal },
                ];

            case 'TENANT':
                return [
                    { title: 'Home', href: `${baseHref}`, icon: LayoutDashboard },
                    { title: 'Contract', href: `${baseHref}/contracts`, icon: FileText },
                    { title: 'Payment', href: `${baseHref}/payments`, icon: CreditCard },
                    { title: 'Notify', href: `${baseHref}/maintenance`, icon: Bell },
                    { title: 'More', href: `${baseHref}/finance`, icon: MoreHorizontal },
                ];

            default:
                return [];
        }
    };

    const tabItems = getTabItems();

    return (
        <nav
            className={cn(
                'lg:hidden fixed bottom-0 left-0 right-0 z-50',
                'bg-card/80 backdrop-blur-md border-t border-border',
                'pb-safe', // Safe area padding for devices with notches
                className
            )}
            style={{
                // Ensure it stays above everything and docks properly
                position: 'fixed',
                bottom: 0,
                width: '100%',
            }}
        >
            <div className="grid grid-cols-5 h-16 w-full">
                {tabItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1',
                                'transition-all duration-200 ease-in-out',
                                'active:scale-95', // Touch feedback
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'h-5 w-5 transition-all duration-200',
                                    isActive && 'stroke-[2.5] scale-110'
                                )}
                            />
                            <span
                                className={cn(
                                    'text-[10px] font-medium transition-all duration-200',
                                    isActive && 'font-semibold'
                                )}
                            >
                                {item.title}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
