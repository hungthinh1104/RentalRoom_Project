"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { NewTenantMaintenanceForm } from '@/features/maintenance/components/new-maintenance-form';
import { useRouter } from 'next/navigation';

export default function NewTenantMaintenancePage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Tạo yêu cầu bảo trì mới</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Gửi yêu cầu bảo trì đến ban quản lý. Vui lòng cung cấp thông tin chi tiết để giúp chúng tôi xử lý nhanh chóng.</p>

          <NewTenantMaintenanceForm onSuccess={() => router.push('/dashboard/tenant/maintenance')} />
        </CardContent>
      </Card>
    </div>
  );
}
