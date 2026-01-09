'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Zap, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/utilities-api';

interface Contract {
  id: string;
  contractNumber: string;
  room: {
    roomNumber: string;
    property: {
      propertyName: string;
    };
  };
}

interface UtilityInvoiceGeneratorProps {
  contracts: Contract[];
  onSuccess?: () => void;
}

const generatorSchema = z.object({
  contractId: z.string().min(1, 'Vui lòng chọn hợp đồng'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Định dạng tháng: YYYY-MM'),
});

type GeneratorFormValues = z.infer<typeof generatorSchema>;

export function UtilityInvoiceGenerator({
  contracts,
  onSuccess,
}: UtilityInvoiceGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorSchema),
    defaultValues: {
      contractId: '',
      month: new Date().toISOString().slice(0, 7),
    },
  });

  const onSubmit = async (data: GeneratorFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      await billingApi.generateUtilityInvoice(data.contractId, data.month);

      setSuccess(true);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['utility-invoices'] });
      setTimeout(() => setSuccess(false), 3000);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tạo hóa đơn';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-l-4" style={{ borderLeftColor: 'var(--primary)' }}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          <div>
            <CardTitle>Tạo hóa đơn điện nước</CardTitle>
            <CardDescription>
              Tạo hóa đơn dựa trên chỉ số đã ghi
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="contractId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hợp đồng</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn hợp đồng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.room.property.propertyName} -{' '}
                          {contract.room.roomNumber} ({contract.contractNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Chọn hợp đồng để tạo hóa đơn
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tháng (YYYY-MM)</FormLabel>
                  <FormControl>
                    <input
                      type="month"
                      {...field}
                      className="flex h-10 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-background)] px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                    />
                  </FormControl>
                  <FormDescription>
                    Tháng để tạo hóa đơn
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div
                className="flex gap-3 rounded-lg border-l-4 p-4"
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
                className="flex gap-3 rounded-lg border-l-4 p-4"
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
                  Tạo hóa đơn thành công!
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              {isLoading ? 'Đang xử lý...' : 'Tạo hóa đơn'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
