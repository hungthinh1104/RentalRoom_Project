'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavMenu } from './nav-menu';
import { UserMenu } from './user-menu';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export function DashboardHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const name = session?.user?.fullName || session?.user?.name || "bạn";

  return (
    <header style={{ height: 'var(--height-header)' }} className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-3 items-center gap-4 h-full">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2 py-2 pl-2">
          <Building2 className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">
            RentalRoom
          </span>
        </Link>

        {/* Desktop Navigation (centered) */}
        <div className="flex items-center justify-center">
          <NavMenu className="hidden md:flex" role={session?.user?.role} />
        </div>

        {/* Right side */}
        <div className="flex items-center justify-end gap-3">
          <span className="hidden sm:inline text-sm text-muted-foreground max-w-[160px] truncate min-w-0 mr-3">Xin chào, {name}</span>
          <div className="flex items-center gap-2 shrink-0">
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <UserMenu user={session?.user} />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <NavMenu 
                className="flex flex-col space-y-3 mt-8" 
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