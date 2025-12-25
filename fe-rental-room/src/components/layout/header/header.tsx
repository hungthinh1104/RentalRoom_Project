'use client';

import { useSession } from 'next-auth/react';
import { DashboardHeader } from './dashboard-header';
import { PublicHeader } from './public-header';
import { usePathname } from 'next/navigation';

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Show dashboard header for authenticated users in dashboard routes
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  
  if (isDashboardRoute && session?.user) {
    return <DashboardHeader />;
  }

  // Show public header for all other routes
  return <PublicHeader />;
}
