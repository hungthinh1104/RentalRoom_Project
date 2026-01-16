'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import api from '@/lib/api/client';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const paymentConfigSchema = z.object({
  bankName: z.string().min(1, 'Vui lòng chọn ngân hàng'),
  accountNumber: z.string().min(8, 'Số tài khoản phải ít nhất 8 ký tự').regex(/^[0-9]+$/, 'Chỉ được nhập số'),
});

type PaymentConfigFormData = z.infer<typeof paymentConfigSchema>;

interface PaymentConfigFormProps {
  onSuccess?: () => void;
}

const BANKS = [
  { value: 'Vietcombank', label: 'Vietcombank (VCB)' },
  { value: 'MB', label: 'MB Bank (Ngân hàng Quân Đội)' },
  { value: 'BIDV', label: 'BIDV (Đầu tư & Phát triển)' },
  { value: 'Techcombank', label: 'Techcombank (TCB)' },
  { value: 'ACB', label: 'ACB (Asia Commercial Bank)' },
  { value: 'VietinBank', label: 'VietinBank (CTG)' },
  { value: 'Agribank', label: 'Agribank (NHNo&PTNT)' },
  { value: 'VPBank', label: 'VPBank (VPB)' },
  { value: 'TPBank', label: 'TPBank (TPB)' },
  { value: 'SHB', label: 'SHB (Ngân hàng SHB)' },
  { value: 'SeABank', label: 'SeABank' },
  { value: 'VIB', label: 'VIB (Quốc tế)' },
  { value: 'MSB', label: 'MSB (Hàng Hải)' },
  { value: 'OCB', label: 'OCB (Phương Đông)' },
  { value: 'EximBank', label: 'EximBank (Xuất Nhập Khẩu)' },
  { value: 'HDBank', label: 'HDBank (Phát triển TP.HCM)' },
  { value: 'Sacombank', label: 'Sacombank (STB)' },
];

export function PaymentConfigForm({ onSuccess }: PaymentConfigFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const form = useForm<PaymentConfigFormData>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      bankName: 'MB',
      accountNumber: '',
    },
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get<{
          success: boolean;
          config: PaymentConfigFormData | null;
        }>('/payments/config');

        if (response.data?.config) {
          form.reset(response.data.config);
        }
      } catch (error) {
        console.error('Failed to load payment config:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchConfig();
  }, [form]);

  const onSubmit = async (data: PaymentConfigFormData) => {
    setLoading(true);
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>('/payments/config', data);

      if (response.data?.success) {
        toast({
          title: 'Thành công',
          description: 'Cấu hình thanh toán đã được lưu',
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: 'Lỗi',
          description: response.data?.message || 'Không thể lưu cấu hình',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Payment config error:', error);
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể lưu cấu hình thanh toán',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/30 text-primary grid place-items-center">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Cấu hình thanh toán</CardTitle>
            <CardDescription>
              Thiết lập thông tin ngân hàng để nhận QR thanh toán tự động
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cách hoạt động</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>• Hệ thống sẽ tạo mã QR thanh toán dựa trên thông tin tài khoản của bạn</p>
            <p>• Người thuê quét QR → chuyển khoản được tự động xác minh</p>
            <p>• Không cần nhập API token, chỉ cần tài khoản ngân hàng</p>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Ngân hàng
                  </FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      disabled={loading}
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {BANKS.map((bank) => (
                        <option key={bank.value} value={bank.value}>
                          {bank.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Chọn ngân hàng nơi bạn nhận tiền thanh toán
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tài khoản ngân hàng</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="0123456789"
                      disabled={loading}
                      className="h-11"
                    />
                  </FormControl>
                  <FormDescription>
                    Số tài khoản nhận tiền thanh toán từ người thuê
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="text-emerald-900 dark:text-emerald-100">
                Bảo mật & Đơn giản
              </AlertTitle>
              <AlertDescription className="text-emerald-800 dark:text-emerald-200 text-sm space-y-1">
                <p>✓ Hệ thống dùng 1 API token bảo mật chung</p>
                <p>✓ Không lưu token cá nhân trên database</p>
                <p>✓ Chỉ cần tài khoản ngân hàng của bạn</p>
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!loading && <CheckCircle2 className="mr-2 h-4 w-4" />}
              {loading ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
