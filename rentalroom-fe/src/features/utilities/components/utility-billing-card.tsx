'use client';

import { Service, MeterReading } from '../api/utilities-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Droplet, Wifi } from 'lucide-react';

interface UtilityBillingCardProps {
  services: Service[];
  readings: MeterReading[];
  totalAmount: number;
  isLoading?: boolean;
}

const getServiceIcon = (serviceName: string) => {
  const name = serviceName.toLowerCase();
  if (name.includes('điện')) return <Zap className="h-4 w-4" />;
  if (name.includes('nước')) return <Droplet className="h-4 w-4" />;
  if (name.includes('internet') || name.includes('wifi'))
    return <Wifi className="h-4 w-4" />;
  return null;
};

const getServiceBadgeColor = (serviceName: string) => {
  const name = serviceName.toLowerCase();
  if (name.includes('điện')) return 'bg-utility-electric/10 text-utility-electric';
  if (name.includes('nước')) return 'bg-utility-water/10 text-utility-water';
  if (name.includes('internet')) return 'bg-utility-internet/10 text-utility-internet';
  return 'bg-muted text-muted-foreground';
};

export function UtilityBillingCard({
  services,
  readings,
  totalAmount,
  isLoading,
}: UtilityBillingCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chi phí dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Đang tải...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const meteredServices = services.filter((s) => s.billingMethod === 'METERED');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Chi phí dịch vụ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meteredServices.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Không có dịch vụ theo chỉ số
          </div>
        ) : (
          <>
            {meteredServices.map((service) => {
              const reading = readings.find(
                (r) => r.serviceId === service.id,
              );

              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getServiceBadgeColor(service.serviceName)}`}>
                      {getServiceIcon(service.serviceName)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{service.serviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.unitPrice.toLocaleString('vi-VN')} ₫/{service.unit}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {reading ? (
                      <div>
                        <p className="text-2xl font-bold">
                          {reading.amount.toLocaleString('vi-VN')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tiêu thụ: {reading.usage.toLocaleString('vi-VN')}{service.unit}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="secondary">Chưa nhập</Badge>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Tổng chi phí dịch vụ:</span>
                <span className="text-2xl font-bold text-info">
                  {totalAmount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
