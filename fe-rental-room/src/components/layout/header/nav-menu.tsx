'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';


interface NavMenuProps {
  role?: string;
  className?: string;
  mobile?: boolean;
}

export function NavMenu({ role, className, mobile = false }: NavMenuProps) {
  const pathname = usePathname();

  // Navigation items based on role
  const getNavItems = () => {

    switch (role) {
      case 'ADMIN':
        return [
          {
            title: 'Bảng điều khiển',
            href: '/dashboard/admin',
            icon: LayoutDashboard,
          },
          {
            title: 'Người dùng',
            href: '/dashboard/admin/users',
            icon: Users,
          },
          {
            title: 'Bất động sản',
            href: '/dashboard/admin/properties',
            icon: Building,
          },
          {
            title: 'Thống kê',
            href: '/dashboard/admin/analytics',
            icon: BarChart3,
          },
          {
            title: 'Báo cáo',
            href: '/dashboard/admin/reports',
            icon: BarChart3,
          },
        ];

      case 'LANDLORD':
        return [
          {
            title: 'Bảng điều khiển',
            href: '/dashboard/landlord',
            icon: LayoutDashboard,
          },
          {
            title: 'Bất động sản',
            href: '/dashboard/landlord/properties',
            icon: Building,
            children: [
              { title: 'Tất cả bất động sản', href: '/dashboard/landlord/properties' },
              { title: 'Thêm mới', href: '/dashboard/landlord/properties/new' },
            ],
          },
          {
            title: 'Đánh giá',
            href: '/dashboard/landlord/reviews',
            icon: Star,
          },
          {
            title: 'Hợp đồng',
            href: '/dashboard/landlord/contracts',
            icon: FileText,
          },
          {
            title: 'Thanh toán',
            href: '/dashboard/landlord/payments',
            icon: CreditCard,
          },
          {
            title: 'Bảo trì',
            href: '/dashboard/landlord/maintenance',
            icon: Wrench,
          },
        ];

      case 'TENANT':
        return [
          {
            title: 'Bảng điều khiển',
            href: '/dashboard/tenant',
            icon: LayoutDashboard,
          },
          {
            title: 'Đặt phòng của tôi',
            href: '/dashboard/tenant/bookings',
            icon: Building,
          },
          {
            title: 'Hợp đồng',
            href: '/dashboard/tenant/contracts',
            icon: FileText,
          },
          {
            title: 'Thanh toán',
            href: '/dashboard/tenant/payments',
            icon: CreditCard,
          },
          {
            title: 'Bảo trì',
            href: '/dashboard/tenant/maintenance',
            icon: Wrench,
          },
          {
            title: 'Yêu thích',
            href: '/dashboard/tenant/favorites',
            icon: Heart,
          },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Mobile Menu
  if (mobile) {
    return (
      <nav className={className}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.children) {
            return (
              <div key={item.title} className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {item.title}
                </div>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'flex items-center gap-2 px-6 py-2 text-sm transition-colors hover:bg-accent',
                      pathname === child.href && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent rounded-md',
                isActive && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    );
  }

  // Desktop Menu with dropdowns
  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.children) {
            return (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger
                  className={cn(
                    'group inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-48 p-2">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                            pathname === child.href && 'bg-accent'
                          )}
                        >
                          <div className="text-sm font-medium leading-none">
                            {child.title}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink asChild>
                <Link href={item.href}
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
