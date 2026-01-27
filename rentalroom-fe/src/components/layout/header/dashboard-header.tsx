'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarContent } from '@/components/layout/sidebar';
import { UserMenu } from './user-menu';
import { NotificationCenter } from '@/features/notifications';
import { useSession } from 'next-auth/react';
import { BrandLogo } from '@/components/brand-logo';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export function DashboardHeader() {
  const { data: session, status } = useSession();
  const name = session?.user?.fullName || session?.user?.name || "bạn";
  const role = session?.user?.role;
  const isLoading = status === "loading";

  // Role localization helper
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Quản trị viên', color: 'bg-destructive/10 text-destructive border-destructive-light' };
      case 'LANDLORD':
        return { label: 'Chủ nhà', color: 'bg-primary/10 text-primary border-primary/20' };
      case 'TENANT':
        return { label: 'Khách thuê', color: 'bg-success/10 text-success border-success/20' };
      default:
        return { label: 'Thành viên', color: 'bg-muted text-muted-foreground' };
    }
  };

  const roleInfo = getRoleBadge(role);

  return (
    <header className="sticky top-4 left-0 right-0 z-50 flex justify-center px-4 w-full pointer-events-none">
      {/* Pointer events none on wrapper to let clicks pass through to sidebar if transparent, 
           but pointer-events-auto on the actual header content container */}
      <div
        style={{ height: 'var(--height-header)' }}
        className="w-full max-w-[1600px] pointer-events-auto rounded-full border bg-background/80 backdrop-blur-xl shadow-sm transition-[width,box-shadow,background-color] duration-300 hover:shadow-md supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 gap-4"
      >
        {/* Left: Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger - Always render to prevent layout shift */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0 -ml-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 pt-10 p-0">
              <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
              <div className="h-full py-4 overflow-y-auto">
                <SidebarContent role={session?.user?.role} />
              </div>
            </SheetContent>
          </Sheet>

          <BrandLogo href="/" className="py-2" />

          {/* Desktop Role Badge */}
          <div className="hidden md:flex items-center">
            <div className="h-6 w-[1px] bg-border mx-4" />
            {isLoading ? (
              <div className="h-5 w-24 bg-muted/50 rounded animate-pulse" />
            ) : (
              <Badge variant="outline" className={`${roleInfo.color} border font-bold uppercase tracking-wider text-[10px] py-0.5 px-2`}>
                {roleInfo.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Right side Actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {isLoading ? (
            <div className="hidden lg:flex flex-col items-end mr-2 gap-1">
              <div className="h-3 w-12 bg-muted/50 rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
            </div>
          ) : name && (
            <div className="hidden lg:flex flex-col items-end mr-2 leading-tight">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Xin chào</span>
              <span className="text-sm font-bold max-w-[150px] truncate">{name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />

            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
            <UserMenu user={session?.user} />
          </div>
        </div>
      </div>
    </header>
  );
}