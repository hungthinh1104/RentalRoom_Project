'use client';

import { Invoice, Payment } from '../api/utilities-api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface UtilityInvoiceCardProps {
  invoice: Invoice & { payments?: Payment[] };
  onPayClick?: (invoice: Invoice) => void;
}

function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

function getStatusInfo(status: string) {
  const info: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string; bgColor: string }> = {
    PAID: {
      icon: CheckCircle2,
      label: 'Đã thanh toán',
      color: 'var(--success)',
      bgColor: 'var(--success-light)',
    },
    PENDING: {
      icon: Clock,
      label: 'Chờ thanh toán',
      color: 'var(--warning)',
      bgColor: 'var(--warning-light)',
    },
    OVERDUE: {
      icon: AlertTriangle,
      label: 'Quá hạn',
      color: 'var(--destructive)',
      bgColor: 'var(--destructive-light)',
    },
  };
  return info[status] || info.PENDING;
}

export function UtilityInvoiceCard({
  invoice,
  onPayClick,
}: UtilityInvoiceCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const statusInfo = getStatusInfo(invoice.status);
  const StatusIcon = statusInfo.icon;
  const paidAmount =
    invoice.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const remainingAmount = Number(invoice.totalAmount) - paidAmount;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader
        className="pb-3"
        style={{
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              <CardTitle className="text-base">{invoice.invoiceNumber}</CardTitle>
            </div>
            <CardDescription>
              {invoice.contract?.room?.property?.propertyName} -{' '}
              {invoice.contract?.room?.roomNumber}
            </CardDescription>
          </div>
          <Badge
            className="flex items-center gap-1"
            style={{
              color: statusInfo.color,
              backgroundColor: statusInfo.bgColor,
              border: `1px solid ${statusInfo.color}20`,
            }}
          >
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Amount Info */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: 'var(--input-background)' }}
          >
            <p className="text-xs text-muted-foreground mb-1">Tổng tiền</p>
            <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
              {formatCurrency(Number(invoice.totalAmount))}
            </p>
          </div>

          {remainingAmount > 0 && invoice.status !== 'PAID' && (
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: 'var(--warning-light)' }}
            >
              <p className="text-xs text-muted-foreground mb-1">Còn phải trả</p>
              <p
                className="text-lg font-bold"
                style={{ color: 'var(--warning)' }}
              >
                {formatCurrency(remainingAmount)}
              </p>
            </div>
          )}

          {paidAmount > 0 && (
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: 'var(--success-light)' }}
            >
              <p className="text-xs text-muted-foreground mb-1">Đã thanh toán</p>
              <p
                className="text-lg font-bold"
                style={{ color: 'var(--success)' }}
              >
                {formatCurrency(paidAmount)}
              </p>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Ngày phát hành</p>
            <p className="font-medium">{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Ngày hết hạn</p>
            <p className="font-medium">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-sm font-medium py-2 px-3 rounded-md transition-colors"
          style={{
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-light)',
          }}
        >
          {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
        </button>

        {/* Line Items Details */}
        {showDetails && invoice.lineItems && invoice.lineItems.length > 0 && (
          <div
            className="mt-4 pt-4 space-y-2 rounded-lg p-3"
            style={{ backgroundColor: 'var(--input-background)' }}
          >
            <p className="font-medium text-sm mb-3">Chi tiết hóa đơn:</p>
            {invoice.lineItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start text-xs gap-2"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-muted-foreground">
                    {Number(item.quantity)}
                  </p>
                </div>
                <p className="font-bold text-right">
                  {formatCurrency(Number(item.amount))}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Payment Button */}
        {invoice.status !== 'PAID' && onPayClick && (
          <Button
            onClick={() => onPayClick(invoice)}
            className="w-full flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
          >
            <CreditCard className="h-4 w-4" />
            Thanh toán ngay
          </Button>
        )}

        {/* Paid Indicator */}
        {invoice.status === 'PAID' && (
          <div
            className="flex items-center justify-center gap-2 p-3 rounded-lg"
            style={{
              backgroundColor: 'var(--success-light)',
            }}
          >
            <CheckCircle2
              className="h-5 w-5"
              style={{ color: 'var(--success)' }}
            />
            <p className="font-medium" style={{ color: 'var(--success)' }}>
              Hóa đơn đã thanh toán
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
