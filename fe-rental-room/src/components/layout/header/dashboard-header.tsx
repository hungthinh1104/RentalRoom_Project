'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavMenu } from './nav-menu';
import { UserMenu } from './user-menu';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { useSession } from 'next-auth/react';
import { BrandLogo } from '@/components/brand-logo';

export function DashboardHeader() {
  const { data: session } = useSession();
  const name = session?.user?.fullName || session?.user?.name || "bạn";

  return (
    <header style={{ height: 'var(--height-header)' }} className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full gap-2 sm:gap-4">
        {/* Logo */}
        <BrandLogo href="/" className="py-2" />

        {/* Desktop Navigation (centered) - Flex grow to take space, but centered */}
        <div className="hidden md:flex flex-1 items-center justify-center px-4">
          <NavMenu role={session?.user?.role} />
        </div>

        {/* Right side - Flex shrink 0 */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 sm:gap-4">
          {name && (
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-sm font-medium leading-none">Xin chào,</span>
              <span className="text-xs text-muted-foreground max-w-[120px] truncate font-medium">{name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <UserMenu user={session?.user} />

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 pt-10">
                <NavMenu
                  className="flex flex-col space-y-3 mt-4"
                  role={session?.user?.role}
                  mobile
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}