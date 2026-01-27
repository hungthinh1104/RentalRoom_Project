import React from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/brand-logo';

// Disable static generation for auth pages (use Framer Motion client-side only)
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex overflow-hidden font-sans selection:bg-primary/20 relative">
      {/* Floating Logo */}
      <div className="fixed top-6 left-6 z-50">
        <BrandLogo href="/" size="sm" variant="white" className="opacity-70 hover:opacity-100 transition-opacity" />
      </div>

      {/* Floating Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main Content Area - Full Width */}
      <div className="relative flex-1 flex flex-col min-h-screen w-full">
        {/* Content Container - Allow children to control layout */}
        <div className="flex-1 flex items-center justify-center relative z-10 w-full">
          {children}
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground/60 z-50 pointer-events-none">
          © 2026 Rental Room. All rights reserved.
        </div>
      </div>
    </div>
  );
}

