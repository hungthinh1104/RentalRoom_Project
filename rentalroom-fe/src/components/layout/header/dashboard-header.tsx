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
// import { NavMenu } from './nav-menu'; // Removed
import { SidebarContent } from '@/components/layout/sidebar'; // Imported
import { UserMenu } from './user-menu';
import { NotificationCenter } from '@/features/notifications';
import { useSession } from 'next-auth/react';
import { BrandLogo } from '@/components/brand-logo';
import { useState, useEffect } from 'react';

export function DashboardHeader() {
  const { data: session } = useSession();
  const name = session?.user?.fullName || session?.user?.name || "bạn";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <header style={{ height: 'var(--height-header)' }} className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full gap-2 sm:gap-4">
        {/* Logo */}
        <BrandLogo href="/" className="py-2" />

        {/* Desktop Navigation REMOVED - Moved to Sidebar */}
        <div className="hidden md:flex flex-1" />

        {/* Right side - Flex shrink 0 */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 sm:gap-4">
          {name && (
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-sm font-medium leading-none">Xin chào,</span>
              <span className="text-xs text-muted-foreground max-w-[120px] truncate font-medium">{name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notifications - Real-time with WebSocket fallback to polling */}
            <NotificationCenter />

            {/* User Menu */}
            <UserMenu user={session?.user} />

            {/* Mobile Menu - Only render after mount to avoid hydration mismatch */}
            {mounted && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 pt-10 p-0">
                  <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
                  <div className="h-full py-4 overflow-y-auto">
                    <SidebarContent role={session?.user?.role} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}