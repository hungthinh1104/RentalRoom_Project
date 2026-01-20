'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Receipt, Calendar, User, Home, CreditCard, QrCode } from 'lucide-react';
import { formatCurrency } from '@/utils/tax-helpers';
import { utilitiesApi, InvoiceLineItem, Payment } from '../api/utilities-api';
import { UtilityPaymentDialog } from './utility-payment-dialog';
import api from '@/lib/api/client';
import { toast } from 'sonner';

interface InvoiceDetailDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
}: InvoiceDetailDialogProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoice, isLoading, refetch } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => utilitiesApi.getUtilityInvoice(invoiceId!),
    enabled: !!invoiceId && open,
  });

  const handleGenerateQR = async () => {
    if (!invoice || !invoiceId) return;

    setQrLoading(true);
    try {
      const response = await api.post<{ success: boolean; qrUrl?: string; error?: string }>(
        `/payments/invoices/${invoiceId}/qr/generate`
      );

      if (response.data?.success && response.data?.qrUrl) {
        setQrUrl(response.data.qrUrl);
        toast.success('Đã tạo mã QR thanh toán');
      } else {
        toast.error(response.data?.error || 'Không thể tạo mã QR');
      }
    } catch (error: unknown) {
      console.error('Failed to generate QR:', error);

      // Extract error message
      let errorMessage = 'Không thể tạo mã QR thanh toán';
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        if (error.message.includes('Payment config missing')) {
          errorMessage = 'Chưa cấu hình thông tin thanh toán';
        } else if (error.message.includes('not own this invoice')) {
          errorMessage = 'Bạn không có quyền tạo QR cho hóa đơn này';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setQrLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!invoice || !invoiceId) return;

    setVerifyLoading(true);
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        transactionId?: string;
        amount?: number;
        transactionDate?: string;
      }>(`/payments/invoices/${invoiceId}/verify`);

      if (response.data?.success) {
        // Refetch invoice to update status
        await refetch();
        alert('✓ Thanh toán xác nhận thành công!');
      } else {
        alert(`❌ ${response.data?.message || 'Không tìm thấy giao dịch'}`);
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      alert('❌ Lỗi khi xác nhận thanh toán');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (!open) return null;

  const handlePayment = () => {
    setPaymentDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Chi tiết hóa đơn
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              {/* Invoice Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Số hóa đơn</p>
                      <p className="font-semibold">{invoice.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ngày tạo</p>
                      <p className="font-medium">
                        {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Khách thuê</p>
                      <p className="font-medium">
                        {invoice.contract?.tenant?.user?.fullName ||
                          invoice.tenant?.user?.fullName ||
                          'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phòng</p>
                      <p className="font-medium">{invoice.contract?.room?.roomNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge and Actions */}
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'PAID'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : invoice.status === 'OVERDUE'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                >
                  {invoice.status === 'PAID'
                    ? 'Đã thanh toán'
                    : invoice.status === 'OVERDUE'
                      ? 'Quá hạn'
                      : 'Chưa thanh toán'}
                </span>
                {invoice.status !== 'PAID' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowQR(!showQR);
                        if (!showQR && !qrUrl) {
                          handleGenerateQR();
                        }
                      }}
                      disabled={qrLoading}
                      className="gap-2"
                    >
                      {qrLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4" />
                      )}
                      {showQR ? 'Ẩn QR' : 'Xem QR'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleVerifyPayment}
                      disabled={verifyLoading}
                      className="gap-2"
                    >
                      {verifyLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      Xác nhận thanh toán
                    </Button>
                    <Button onClick={handlePayment} className="gap-2">
                      <CreditCard className="h-4 w-4" />
                      Ghi nhận thanh toán
                    </Button>
                  </div>
                )}
              </div>

              {/* QR Code Section */}
              {showQR && invoice.status !== 'PAID' && (
                <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="text-center space-y-4">
                    <h3 className="font-semibold text-lg">Quét mã QR để thanh toán</h3>
                    <div className="bg-white p-4 rounded-lg inline-block shadow-lg">
                      {qrUrl ? (
                        <Image
                          src={qrUrl}
                          alt="Payment QR Code"
                          width={256}
                          height={256}
                          className="w-64 h-64"
                        />
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
                          {qrLoading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <QrCode className="h-16 w-16 mx-auto mb-2" />
                              <p className="text-sm">Mã QR thanh toán</p>
                              <p className="text-xs mt-2">
                                Số tiền: {formatCurrency(Number(invoice.totalAmount))}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Thông tin chuyển khoản:</p>
                      <div className="bg-white/80 dark:bg-gray-900/80 p-3 rounded-lg space-y-1 text-left">
                        <p><span className="text-muted-foreground">Ngân hàng:</span> <span className="font-medium">Vietcombank</span></p>
                        <p><span className="text-muted-foreground">Số TK:</span> <span className="font-medium">1234567890</span></p>
                        <p><span className="text-muted-foreground">Chủ TK:</span> <span className="font-medium">Rental Room Management</span></p>
                        <p><span className="text-muted-foreground">Nội dung:</span> <span className="font-medium">{invoice.invoiceNumber}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div>
                <h3 className="font-semibold mb-3">Chi tiết các khoản</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Mô tả</th>
                        <th className="text-right p-3 text-sm font-medium">Số lượng</th>
                        <th className="text-right p-3 text-sm font-medium">Đơn giá</th>
                        <th className="text-right p-3 text-sm font-medium">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoice.lineItems?.map((item: InvoiceLineItem) => (
                        <tr key={item.id}>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{item.description}</p>
                              {item.serviceId && (
                                <p className="text-xs text-muted-foreground">
                                  {item.service?.serviceName}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">{item.quantity || 1}</td>
                          <td className="p-3 text-right">
                            {formatCurrency(Number(item.unitPrice) || 0)}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(Number(item.amount) || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng cộng</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(Number(invoice.totalAmount) || 0)}
                  </span>
                </div>
                {invoice.paidAmount && Number(invoice.paidAmount) > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Đã thanh toán</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(Number(invoice.paidAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                      <span>Còn phải trả</span>
                      <span className="text-primary text-lg">
                        {formatCurrency(
                          Number(invoice.totalAmount) - Number(invoice.paidAmount)
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment History */}
              {invoice.payments && invoice.payments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Lịch sử thanh toán</h3>
                  <div className="space-y-2">
                    {invoice.payments.map((payment: Payment) => (
                      <div
                        key={payment.id}
                        className="flex justify-between items-center p-3 rounded-lg bg-muted/30"
                      >
                        <div>
                          <p className="font-medium">
                            {formatCurrency(Number(payment.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.paymentDate).toLocaleDateString('vi-VN')} •{' '}
                            {payment.paymentMethod}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Thành công
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy hóa đơn
            </div>
          )}
        </DialogContent>
      </Dialog>

      {invoice && (
        <UtilityPaymentDialog
          invoice={invoice}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSuccess={() => {
            setPaymentDialogOpen(false);
            // Refetch invoice detail to update status
          }}
        />
      )}
    </>
  );
}
