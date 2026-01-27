'use client';

import { MeterReading, Service } from '../api/utilities-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MeterReadingHistoryProps {
  readings: MeterReading[];
  services: Map<string, Service>;
  isLoading?: boolean;
}

export function MeterReadingHistory({
  readings,
  services,
  isLoading,
}: MeterReadingHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử chỉ số</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground font-medium">Đang tải...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (readings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử chỉ số</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground font-medium">Chưa có dữ liệu</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử chỉ số</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kỳ</TableHead>
                <TableHead>Dịch vụ</TableHead>
                <TableHead className="text-right">Lần trước</TableHead>
                <TableHead className="text-right">Hiện tại</TableHead>
                <TableHead className="text-right">Tiêu thụ</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
                <TableHead>Ngày nhập</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.map((reading) => {
                const service = services.get(reading.serviceId);
                return (
                  <TableRow key={reading.id}>
                    <TableCell className="font-medium">{reading.month}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{service?.serviceName || 'N/A'}</span>
                        <Badge variant="outline" className="text-xs">
                          {service?.unit || 'unit'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {reading.previousReading.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      {reading.currentReading.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {reading.usage.toLocaleString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(reading.amount).toLocaleString('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(reading.createdAt), 'dd/MM/yyyy', {
                        locale: vi,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
