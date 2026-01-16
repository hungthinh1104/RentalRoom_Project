'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, Zap, Check, Plus } from 'lucide-react';
import { utilitiesApi } from '../api/utilities-api';

interface Contract {
  id: string;
  contractNumber: string;
  room: {
    roomNumber: string;
    property: {
      propertyName: string;
      services: any[];
    };
  };
}

interface MeterReadingInputFormProps {
  contracts: Contract[];
  onSuccess?: () => void;
}

const readingSchema = z.object({
  contractId: z.string().min(1, 'Vui lòng chọn hợp đồng'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Định dạng tháng: YYYY-MM'),
  readings: z.array(
    z.object({
      serviceId: z.string(),
      currentReading: z.number().min(0, 'Chỉ số phải >= 0'),
    }),
  ),
});

type ReadingFormValues = z.infer<typeof readingSchema>;

export function MeterReadingInputForm({
  contracts,
  onSuccess,
}: MeterReadingInputFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedContractId = useForm<{ contractId: string }>({
    defaultValues: { contractId: '' },
  }).watch('contractId');

  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  const form = useForm<ReadingFormValues>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      contractId: '',
      month: new Date().toISOString().slice(0, 7),
      readings: [],
    },
  });

  const onSubmit = async (data: ReadingFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      await utilitiesApi.submitMeterReadings({
        contractId: data.contractId,
        month: data.month,
        readings: data.readings,
      });

      setSuccess(true);
      form.reset();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        onSuccess?.();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể ghi chỉ số';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContractChange = (contractId: string) => {
    form.setValue('contractId', contractId);
    const contract = contracts.find((c) => c.id === contractId);
    if (contract?.room?.property?.services) {
      const newReadings = contract.room.property.services.map((service: any) => ({
        serviceId: service.id,
        currentReading: 0,
      }));
      form.setValue('readings', newReadings);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          <Plus className="h-4 w-4" />
          Ghi chỉ số mới
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ghi chỉ số đồng hồ</DialogTitle>
          <DialogDescription>
            Nhập chỉ số hiện tại cho các dịch vụ
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contract Selection */}
            <FormField
              control={form.control}
              name="contractId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hợp đồng</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleContractChange}
                  >
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Month Selection */}
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tháng</FormLabel>
                  <FormControl>
                    <input
                      type="month"
                      {...field}
                      className="flex h-10 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Services Readings */}
            {selectedContract?.room?.property?.services && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Chỉ số dịch vụ</label>
                {selectedContract.room.property.services.map(
                  (service: any, idx: number) => (
                    <FormField
                      key={service.id}
                      control={form.control}
                      name={`readings.${idx}.currentReading`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            {service.serviceName}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Chỉ số hiện tại"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              className="border-[var(--input-border)]"
                            />
                          </FormControl>
                          <FormDescription>
                            {service.unit} (Giá: {service.unitPrice.toLocaleString('vi-VN')} ₫)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ),
                )}
              </div>
            )}

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
                  Ghi chỉ số thành công!
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isLoading || success}
                className="flex-1"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}
              >
                {isLoading ? 'Đang ghi...' : 'Xác nhận'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
