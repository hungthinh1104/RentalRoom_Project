"use client";

import { Badge } from '@/components/ui/badge';
import { CalendarRange, Wallet, FileText, MapPin, User } from 'lucide-react';
import type { Contract, ContractStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function statusChip(status?: ContractStatus) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          Đang hiệu lực
        </Badge>
      );
    case 'TERMINATED':
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
          Đã chấm dứt
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
          Hết hạn
        </Badge>
      );
    default:
      return <Badge variant="secondary">—</Badge>;
  }
}

export function ContractSummary({ contract }: { contract: Contract }) {
  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Thông tin chung
          </CardTitle>
          {statusChip(contract.status)}
        </div>
      </CardHeader>

      <CardContent className="p-6 grid gap-6 md:grid-cols-2">
        {/* Room Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Phòng & Địa chỉ</h4>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-lg">{contract.room?.property?.name ?? contract.room?.roomNumber}</p>
              <p className="text-sm text-muted-foreground">{contract.room?.property?.address ?? '—'}</p>
              {contract.room?.roomNumber && (
                <Badge variant="secondary" className="mt-2">
                  Phòng {contract.room.roomNumber}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Landlord Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Chủ nhà</h4>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{contract.landlord?.user?.fullName ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{contract.landlord?.user?.phoneNumber ?? contract.landlord?.user?.email ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 h-px bg-border" />

        {/* Contract Details */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Thời hạn hợp đồng</p>
              <p className="font-medium text-sm">{fmt(contract.startDate)} — {fmt(contract.endDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Giá thuê hàng tháng</p>
              <p className="font-medium text-sm">
                {contract.monthlyRent?.toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tiền cọc (Đang giữ)</p>
              <p className="font-medium text-sm">
                {contract.deposit?.toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
