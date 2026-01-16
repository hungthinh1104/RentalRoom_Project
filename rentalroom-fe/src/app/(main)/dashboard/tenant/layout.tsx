import { redirect } from 'next/navigation';
import { auth } from '@/auth';

// Layouts under (main) already include a top-level <Header /> via the main layout.
// Avoid rendering <DashboardHeader /> here directly to prevent duplicate headers.

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Server-side auth check - redirect if not tenant
  if (!session || session.user?.role !== 'TENANT') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}