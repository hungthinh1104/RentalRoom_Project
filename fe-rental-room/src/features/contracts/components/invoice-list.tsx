"use client";
import { Badge } from '@/components/ui/badge';
import type { Invoice } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export function InvoiceList({ loading, invoices }: { loading: boolean; invoices?: Invoice[] }) {
  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
  if (loading) return <Skeleton className="h-24 w-full" />;
  if (!invoices || invoices.length === 0) return <p className="text-sm text-muted-foreground">Chưa có hóa đơn nào.</p>;

  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between border rounded-lg p-3 bg-card/60">
          <div>
            <p className="font-medium">Hóa đơn {inv.invoiceNumber}</p>
            <p className="text-sm text-muted-foreground">Kỳ: {inv.billingMonth} • Hạn: {fmt(inv.dueDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold">{inv.totalAmount?.toLocaleString('vi-VN')}đ</div>
            <Badge className="rounded-full">{inv.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
