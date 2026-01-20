'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { MeterReadingForm } from '../components/meter-reading-form';
import { MeterReadingHistory } from '../components/meter-reading-history';
import { utilitiesApi, MeterReading, Service } from '../api/utilities-api';

interface UtilitiesDashboardPageProps {
  contractId: string;
}

export function UtilitiesDashboardPage({ contractId }: UtilitiesDashboardPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonth = searchParams.get('month') || format(new Date(), 'yyyy-MM');

  const [services, setServices] = useState<Service[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [lastReadings, setLastReadings] = useState<Record<string, MeterReading | undefined>>({});
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Fetch services and last readings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Here we would fetch services for the contract
        // For now, we'll initialize empty arrays
        setServices([]);
      } catch (error) {
        console.error('Error loading services:', error);
        toast.error('Lỗi khi tải dữ liệu dịch vụ');
      }
    };

    loadData();
  }, [contractId]);

  // Fetch meter readings for current month
  useEffect(() => {
    const loadReadings = async () => {
      try {
        setIsLoadingReadings(true);
        const data = await utilitiesApi.getMeterReadings(contractId, currentMonth);
        setReadings(data);

        // Also fetch last readings
        const last = await utilitiesApi.getMeterReadings(contractId);
        const lastMap: Record<string, MeterReading | undefined> = {};
        last.forEach((r) => {
          if (!lastMap[r.serviceId] || r.createdAt > lastMap[r.serviceId]!.createdAt) {
            lastMap[r.serviceId] = r;
          }
        });
        setLastReadings(lastMap);
      } catch (error) {
        console.error('Error loading readings:', error);
        toast.error('Lỗi khi tải dữ liệu chỉ số');
      } finally {
        setIsLoadingReadings(false);
      }
    };

    if (contractId) {
      loadReadings();
    }
  }, [contractId, currentMonth]);

  const handleMonthChange = (month: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set('month', month);
    router.push(`?${searchParams.toString()}`);
  };

  const handleSuccess = () => {
    // Reload readings
    utilitiesApi
      .getMeterReadings(contractId, currentMonth)
      .then((data) => {
        setReadings(data);
        toast.success('Cập nhật chỉ số thành công');
      })
      .catch((error) => {
        console.error('Error reloading readings:', error);
      });
  };

  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const totalAmount = readings.reduce((sum, r) => sum + Number(r.amount), 0);
  const meteredServices = services.filter((s) => s.billingMethod === 'METERED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Điện Nước</h1>
          <p className="text-gray-600 mt-1">Nhập và quản lý chỉ số dịch vụ</p>
        </div>

        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nhập chỉ số
        </Button>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tổng Chi Phí Dịch Vụ (Tháng)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalAmount.toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {readings.length} dịch vụ đã nhập
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Dịch Vụ Theo Chỉ Số
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{meteredServices.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {readings.length}/{meteredServices.length} đã nhập
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Meter Reading Form Dialog */}
      <MeterReadingForm
        contractId={contractId}
        month={currentMonth}
        services={services}
        lastReadings={lastReadings}
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleSuccess}
      />

      {/* Tabs */}
      <Tabs defaultValue="readings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="readings">Chỉ số ({readings.length})</TabsTrigger>
          <TabsTrigger value="analysis">Phân tích</TabsTrigger>
        </TabsList>

        <TabsContent value="readings" className="space-y-4">
          {isLoadingReadings ? (
            <Card>
              <CardContent className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : readings.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Chưa có chỉ số nào được nhập cho tháng này. Vui lòng nhập chỉ số.
              </AlertDescription>
            </Alert>
          ) : (
            <MeterReadingHistory
              readings={readings}
              services={serviceMap}
              isLoading={false}
            />
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Xu hướng sử dụng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                Chức năng phân tích sẽ có sớm
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
