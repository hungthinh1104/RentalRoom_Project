import { redirect } from 'next/navigation';
import { auth } from '@/auth';

// Dashboard header intentionally omitted here — the main layout renders <Header /> based on route.

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Server-side auth check - redirect if not landlord
  if (!session || session.user?.role !== 'LANDLORD') {
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