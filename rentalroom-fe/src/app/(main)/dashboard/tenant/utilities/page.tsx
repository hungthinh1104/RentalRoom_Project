'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { UtilityBillingCard } from '@/features/utilities/components/utility-billing-card';
import { MeterReadingHistory } from '@/features/utilities/components/meter-reading-history';
import { utilitiesApi, MeterReading, Service } from '@/features/utilities/api/utilities-api';

export default function TenantUtilitiesPage() {
  const searchParams = useSearchParams();
  const currentMonth = searchParams.get('month') || format(new Date(), 'yyyy-MM');

  const [services, setServices] = useState<Service[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tenant's utility billing
  useEffect(() => {
    const loadUtilityBilling = async () => {
      try {
        setIsLoading(true);
        const data = await utilitiesApi.getTenantUtilityBilling(currentMonth);
        setServices(data.services);
        setReadings(data.latestReadings);
        setTotalAmount(data.totalAmount);
      } catch (error) {
        console.error('Error loading utility billing:', error);
        toast.error('Lỗi khi tải dữ liệu chi phí dịch vụ');
      } finally {
        setIsLoading(false);
      }
    };

    loadUtilityBilling();
  }, [currentMonth]);

  const handleMonthChange = (month: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('month', month);
    window.history.pushState({}, '', url.toString());
  };

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Chi Phí Dịch Vụ</h1>
        <p className="text-gray-600 mt-1">Xem chi phí điện nước và dịch vụ khác</p>
      </div>

      {/* Month Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn kỳ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={currentMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Generate last 12 months */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  const month = format(d, 'yyyy-MM');
                  const label = format(d, 'MMMM yyyy', { locale: vi });
                  return (
                    <SelectItem key={month} value={month}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : services.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Không có dịch vụ được cấu hình cho phòng của bạn
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services">Dịch Vụ ({services.length})</TabsTrigger>
            <TabsTrigger value="history">Lịch Sử ({readings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <UtilityBillingCard
              services={services}
              readings={readings}
              totalAmount={totalAmount}
              isLoading={false}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <MeterReadingHistory
              readings={readings}
              services={serviceMap}
              isLoading={false}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
