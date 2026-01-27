'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { utilitiesApi, Service, MeterReading } from '../api/utilities-api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MeterReadingFormProps {
  contractId: string;
  month: string;
  services: Service[];
  lastReadings: Record<string, MeterReading | undefined>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const meterReadingSchema = z.object({
  readings: z.array(
    z.object({
      serviceId: z.string(),
      currentReading: z.coerce
        .number()
        .min(0, 'Chỉ số phải lớn hơn 0')
        .positive('Chỉ số không hợp lệ'),
    }),
  ),
});

type MeterReadingFormData = z.infer<typeof meterReadingSchema>;

export function MeterReadingForm({
  contractId,
  month,
  services,
  lastReadings,
  open,
  onOpenChange,
  onSuccess,
}: MeterReadingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const form = useForm<MeterReadingFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(meterReadingSchema) as any,
    defaultValues: {
      readings: services
        .filter((s) => s.billingMethod === 'METERED')
        .map((s) => ({
          serviceId: s.id,
          currentReading: 0,
        })),
    },
  });

  const handleSubmit = async (data: MeterReadingFormData) => {
    try {
      setIsSubmitting(true);
      setValidationErrors({});

      // Validate readings against previous readings
      const errors: Record<string, string> = {};
      for (const reading of data.readings) {
        const service = services.find((s) => s.id === reading.serviceId);
        if (!service) continue;

        const lastReading = lastReadings[reading.serviceId];
        if (lastReading && reading.currentReading < lastReading.currentReading) {
          errors[reading.serviceId] = `Chỉ số phải lớn hơn hoặc bằng ${lastReading.currentReading} (lần trước)`;
        }
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Submit meter readings
      await utilitiesApi.submitMeterReadings({
        contractId,
        month,
        readings: data.readings,
      });

      toast.success('Nhập chỉ số thành công!');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error submitting meter readings:', error);
      const message = error && typeof error === 'object' && 'response' in error ?
        (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(
        message || 'Lỗi khi nhập chỉ số điện nước',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const meteredServices = services.filter((s) => s.billingMethod === 'METERED');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nhập Chỉ Số Điện Nước</DialogTitle>
          <DialogDescription>
            Kỳ: {month} • Nhập chỉ số hiện tại cho các dịch vụ
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {meteredServices.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Không có dịch vụ theo chỉ số để nhập
                </AlertDescription>
              </Alert>
            ) : (
              meteredServices.map((service, index) => {
                const lastReading = lastReadings[service.id];
                const error = validationErrors[service.id];

                return (
                  <div key={service.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {service.serviceName}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {service.unit}
                      </span>
                    </div>

                    {lastReading && (
                      <div className="rounded-sm bg-muted/30 p-2 text-xs text-muted-foreground border border-border/50">
                        Lần trước: {lastReading.previousReading.toLocaleString()}
                        {service.unit} → {lastReading.currentReading.toLocaleString()}
                        {service.unit}
                        <br />
                        Tiêu thụ: {lastReading.usage.toLocaleString()}
                        {service.unit} × {service.unitPrice.toLocaleString()} ₫
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name={`readings.${index}.currentReading`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Nhập chỉ số hiện tại"
                              {...field}
                              value={field.value as number}
                              className={cn(
                                "bg-background/50 border-input/40 text-foreground transition-all duration-300 backdrop-blur-sm",
                                error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                              )}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          {error && (
                            <FormMessage className="text-destructive">
                              {error}
                            </FormMessage>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                );
              })
            )}

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? 'Đang lưu...' : 'Lưu chỉ số'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
