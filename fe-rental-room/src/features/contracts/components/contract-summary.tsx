"use client";
import { Badge } from '@/components/ui/badge';
import { CalendarRange, Wallet, FileText } from 'lucide-react';
import type { Contract, ContractStatus } from '@/types';

function statusChip(status?: ContractStatus) {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-success-light text-success border-success/20">Đang hiệu lực</Badge>;
    case 'TERMINATED':
      return <Badge className="bg-destructive-light text-destructive border-destructive/20">Đã chấm dứt</Badge>;
    case 'EXPIRED':
      return <Badge className="bg-warning-light text-warning border-warning/20">Hết hạn</Badge>;
    default:
      return <Badge variant="secondary">—</Badge>;
  }
}

export function ContractSummary({ contract }: { contract: Contract }) {
  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="col-span-2 space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-semibold">{contract.room?.property?.name ?? contract.room?.roomNumber ?? 'Hợp đồng thuê'}</span>
        </div>
        <div className="text-sm text-muted-foreground">{contract.room?.property?.address ?? contract.room?.property?.district ?? '—'}</div>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4" /> Bắt đầu: {fmt(contract.startDate)}</div>
        <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4" /> Kết thúc: {fmt(contract.endDate)}</div>
        <div className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Giá: {contract.monthlyRent?.toLocaleString('vi-VN')}đ/tháng</div>
      </div>
      <div className="md:col-span-3 flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">Chủ nhà: {contract.landlord?.user?.fullName ?? contract.landlord?.user?.email ?? '—'}</div>
        {statusChip(contract.status)}
      </div>
    </div>
  );
}
