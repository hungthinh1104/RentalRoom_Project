"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { TerminationType } from '@/types/enums';
import { useLegalConfirmation } from '@/components/security/legal-finality-dialog';
import { toast } from 'sonner';

interface TerminateDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (data: { reason: string; noticeDays: number; terminationType: string; refundAmount: number }) => void;
  loading?: boolean;
  deposit?: number;
  depositAmount?: number; // Alias
  daysRemaining?: number;
  isTenant?: boolean;
}

export function TerminateDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  deposit = 0,
  depositAmount,
  daysRemaining = 0,
  isTenant = true,
}: TerminateDialogProps) {
  const [reason, setReason] = useState('');
  const [noticeDays, setNoticeDays] = useState(30);
  const [terminationType, setTerminationType] = useState<TerminationType>(
    isTenant ? TerminationType.EARLY_BY_TENANT : TerminationType.EARLY_BY_LANDLORD
  );
  const { confirm, Dialog: LegalDialog } = useLegalConfirmation();

  const finalDeposit = depositAmount ?? deposit;
  const [refundAmount, setRefundAmount] = useState<number>(0);

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do chấm dứt hợp đồng');
      return;
    }

    const terminationData = {
      reason: reason.trim(),
      noticeDays,
      terminationType,
      refundAmount
    };

    confirm(
      {
        title: "Chấm dứt hợp đồng",
        description: `Bạn đang chấm dứt hợp đồng với lý do: "${reason.trim()}". Loại: ${terminationType}. Số tiền hoàn lại: ${refundAmount.toLocaleString('vi-VN')} đ. Hành động này sẽ tạo snapshot pháp lý và không thể hoàn tác.`,
        severity: "critical",
        consentText: "Tôi xác nhận chấm dứt hợp đồng",
      },
      () => {
        onConfirm(terminationData);
        setReason('');
        setNoticeDays(30);
      }
    );
  };

  // Logic to auto-calculate refund/penalty based on Type
  // Note: This matches the warning logic roughly, but allows manual override
  const handleTypeChange = (type: TerminationType) => {
    setTerminationType(type);
    if (type === TerminationType.EXPIRY) {
      setRefundAmount(finalDeposit); // Full refund if expired
    } else if (type === TerminationType.EARLY_BY_TENANT) {
      setRefundAmount(0); // Lose deposit
    } else if (type === TerminationType.EARLY_BY_LANDLORD) {
      setRefundAmount(finalDeposit * 2); // Double refund (compensation)
    } else if (type === TerminationType.EVICTION) {
      setRefundAmount(0); // Evicted, likely 0
    } else {
      setRefundAmount(finalDeposit); // Mutual or Other -> Default to full refund, let user change
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-destructive flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Chấm dứt hợp đồng
          </DialogTitle>
          <DialogDescription>
            Hành động này sẽ kết thúc hiệu lực hợp đồng và giải phóng phòng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Logic Warning */}
          {(daysRemaining > 0 && terminationType !== TerminationType.EXPIRY) && (
            <Alert variant="destructive" className="border-2 bg-destructive/10">
              <AlertDescription className="text-sm font-medium text-destructive">
                ⚠️ Hợp đồng còn {daysRemaining} ngày. Chấm dứt sớm có thể phát sinh phạt cọc.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại chấm dứt</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={terminationType}
                onChange={(e) => handleTypeChange(e.target.value as TerminationType)}
              >
                <option value={TerminationType.EARLY_BY_TENANT}>Khách hủy sớm (Mất cọc)</option>
                <option value={TerminationType.EARLY_BY_LANDLORD}>Chủ nhà hủy sớm (Đền cọc)</option>
                <option value={TerminationType.MUTUAL_AGREEMENT}>Thỏa thuận 2 bên</option>
                <option value={TerminationType.EVICTION}>Trục xuất (Vi phạm)</option>
                <option value={TerminationType.EXPIRY}>Hết hạn hợp đồng</option>
                <option value={TerminationType.OTHER}>Khác</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Số ngày đã báo trước</Label>
              <Input
                type="number"
                min={0}
                value={noticeDays}
                onChange={(e) => setNoticeDays(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lý do cụ thể <span className="text-destructive">*</span></Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Chuyển công tác, vi phạm nội quy..."
            />
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-4 border">
            <h4 className="font-semibold text-sm">💰 Tài chính hoàn lại (Dự kiến)</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Tiền cọc gốc</Label>
                <div className="font-medium">{finalDeposit.toLocaleString('vi-VN')} đ</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Số tiền hoàn lại cho khách</Label>
                <Input
                  type="number"
                  className="mt-1 font-bold text-success"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {refundAmount === 0 && "Khách mất cọc"}
                  {refundAmount === finalDeposit && "Hoàn lại toàn bộ cọc"}
                  {refundAmount > finalDeposit && "Có đền bù thêm"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading || !reason.trim()}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận chấm dứt'}
            </Button>
          </div>
        </div>
      </DialogContent>
      <LegalDialog />
    </Dialog>
  );
}


