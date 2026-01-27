'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { contractsApi } from '@/features/contracts/api/contracts-api';
import {
  UtilityInvoiceGenerator,
  MeterReadingInputForm,
} from '@/features/utilities/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Zap } from 'lucide-react';

export default function LandlordUtilitiesPage() {
  const { data: session } = useSession();

  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: ['landlord-contracts'],
    queryFn: () => contractsApi.getContracts({ status: 'ACTIVE' }),
    enabled: !!session?.user?.id,
  });

  if (contractsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Zap className="h-12 w-12 mx-auto mb-2 opacity-40" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const contracts = contractsData || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Quản lý tiền điện nước</h1>
        <p className="text-muted-foreground mt-2">
          Ghi chỉ số đồng hồ, tạo hóa đơn và theo dõi thanh toán từ khách thuê
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Meter Reading Form */}
          {contracts.length > 0 ? (
            <MeterReadingInputForm
              contracts={contracts}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div
                  className="flex items-center gap-3 p-4 rounded-lg border-l-4"
                  style={{
                    borderLeftColor: 'var(--warning)',
                    backgroundColor: 'var(--warning-light)',
                  }}
                >
                  <AlertCircle
                    className="h-5 w-5 flex-shrink-0"
                    style={{ color: 'var(--warning)' }}
                  />
                  <p style={{ color: 'var(--warning)' }}>
                    Bạn chưa có hợp đồng nào. Vui lòng tạo hợp đồng trước.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Invoice Generator */}
          {contracts.length > 0 ? (
            <UtilityInvoiceGenerator
              contracts={contracts}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-4">
                  Tạo hợp đồng để sử dụng tính năng này
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Services Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            Hướng dẫn sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--input-background)' }}
            >
              <h3 className="font-bold mb-2">1. Ghi chỉ số</h3>
              <p className="text-sm text-muted-foreground">
                Nhập chỉ số đồng hồ điện, nước hàng tháng. Hệ thống tự động tính toán tiêu thụ
              </p>
            </div>
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--input-background)' }}
            >
              <h3 className="font-bold mb-2">2. Tạo hóa đơn</h3>
              <p className="text-sm text-muted-foreground">
                Tạo hóa đơn từ chỉ số đã ghi. Khách thuê sẽ nhận được thông báo
              </p>
            </div>
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--input-background)' }}
            >
              <h3 className="font-bold mb-2">3. Theo dõi thanh toán</h3>
              <p className="text-sm text-muted-foreground">
                Xem trạng thái thanh toán và lịch sử giao dịch của khách thuê
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
