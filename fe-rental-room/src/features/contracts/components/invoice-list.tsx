"use client";

import { Badge } from '@/components/ui/badge';
import type { Invoice } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function InvoiceList({ loading, invoices }: { loading: boolean; invoices?: Invoice[] }) {
  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

  if (loading) return (
    <Card>
      <CardHeader className="bg-muted/30 pb-4">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5 text-primary" />
          Hóa đơn liên quan
        </CardTitle>
        <Badge variant="outline" className="font-normal">
          {invoices?.length || 0} hóa đơn
        </Badge>
      </CardHeader>
      <CardContent className="p-6">
        {!invoices || invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
            <CreditCard className="h-8 w-8 mb-2 opacity-50" />
            <p>Chưa có hóa đơn nào được tạo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <Link
                href={`/dashboard/tenant/payments/${inv.id}`}
                key={inv.id}
                className="block group"
              >
                <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {inv.invoiceNumber || 'Hóa đơn chưa đánh số'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Kỳ: {inv.billingMonth}
                        </span>
                        <span>•</span>
                        <span>Hạn: {fmt(inv.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {inv.totalAmount?.toLocaleString('vi-VN')}₫
                      </p>
                      <Badge variant={inv.status === 'PAID' ? 'default' : 'secondary'} className={`text-xs ${inv.status === 'PAID' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700' : inv.status === 'OVERDUE' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : ''}`}>
                        {inv.status === 'PAID' ? 'Đã thanh toán' :
                          inv.status === 'OVERDUE' ? 'Quá hạn' :
                            'Chưa thanh toán'}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
