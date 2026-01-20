'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Invoice } from '../api/utilities-api';
import { billingApi } from '../api/utilities-api';
import { useQueryClient } from '@tanstack/react-query';

interface UtilityPaymentDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Số tiền phải lớn hơn 0'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MOMO', 'ZALOPAY']),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function UtilityPaymentDialog({
  invoice,
  open,
  onOpenChange,
  onSuccess,
}: UtilityPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: invoice ? Number(invoice.totalAmount) : 0,
      paymentMethod: 'BANK_TRANSFER',
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError(null);
      setSuccess(false);
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: PaymentFormValues) => {
    if (!invoice) return;

    try {
      setIsLoading(true);
      setError(null);

      await billingApi.recordUtilityPayment(invoice.id, data.amount, data.paymentMethod);

      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['utility-invoices'] });

      setTimeout(() => {
        handleOpenChange(false);
        onSuccess?.();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể xử lý thanh toán';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!invoice) return null;

  const remainingAmount =
    Number(invoice.totalAmount) - (invoice.paidAmount || 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán hóa đơn</DialogTitle>
          <DialogDescription>
            Hóa đơn: {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: 'var(--input-background)' }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tổng tiền</p>
              <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(Number(invoice.totalAmount))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Còn phải trả</p>
              <p
                className="text-lg font-bold"
                style={{
                  color: remainingAmount > 0 ? 'var(--warning)' : 'var(--success)',
                }}
              >
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(remainingAmount)}
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền thanh toán (VND)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1000"
                      min="1000"
                      max={remainingAmount}
                      placeholder="Nhập số tiền"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="border-[var(--input-border)] focus:ring-[var(--primary)]"
                    />
                  </FormControl>
                  <FormDescription>
                    Tối đa: {remainingAmount.toLocaleString('vi-VN')} VND
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phương thức thanh toán</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="border-[var(--input-border)]">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                      <SelectItem value="MOMO">MoMo</SelectItem>
                      <SelectItem value="ZALOPAY">ZaloPay</SelectItem>
                      <SelectItem value="CASH">Tiền mặt</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div
                className="flex gap-2 rounded-lg border-l-4 p-3"
                style={{
                  borderLeftColor: 'var(--destructive)',
                  backgroundColor: 'var(--destructive-light)',
                }}
              >
                <AlertCircle
                  className="h-5 w-5 flex-shrink-0"
                  style={{ color: 'var(--destructive)' }}
                />
                <p className="text-sm" style={{ color: 'var(--destructive)' }}>
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div
                className="flex gap-2 rounded-lg border-l-4 p-3"
                style={{
                  borderLeftColor: 'var(--success)',
                  backgroundColor: 'var(--success-light)',
                }}
              >
                <Check
                  className="h-5 w-5 flex-shrink-0"
                  style={{ color: 'var(--success)' }}
                />
                <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                  Thanh toán thành công!
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isLoading || success}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
