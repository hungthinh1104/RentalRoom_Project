import React from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthFeatureShowcase } from '@/features/auth/components/auth-feature-showcase';
import { BrandLogo } from '@/components/brand-logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Left Side: Feature Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] h-screen relative flex-col">
        <AuthFeatureShowcase />
      </div>

      {/* Right Side: Auth Content */}
      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto">
        {/* Top Navigation */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
          {/* Logo visible only on mobile/tablet when sidebar is hidden, or if we want it here too. 
                 Let's keep logo here for Mobile specifically or just general branding on the form side if needed.
             */}
          <div className="lg:hidden">
            <BrandLogo href="/" size="sm" />
          </div>
          <ThemeToggle />
        </div>

        {/* Content Container */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-[550px] mx-auto animate-fade-in">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 text-center text-xs text-muted-foreground">
          © 2026 Rental Room. All rights reserved.
        </div>
      </div>
    </div>
  );
}

